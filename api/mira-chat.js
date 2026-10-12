import { authenticate, rateLimit } from "./_lib/forsa-server.js";
import {
  ContractError,
  MIRA_REPLY_MAX_TOKENS,
  assertBodySize,
  buildMiraSystemPrompt,
  nextUtcMidnightIso,
  parseMiraRequest,
} from "./_lib/mira-contract.js";
import {
  GlobalQuotaExceededError,
  QuotaExceededError,
  consumeMiraQuotas,
} from "./_lib/mira-quota.js";
import {
  ProviderError,
  createChatCompletion,
  publicMessageFor,
  missingProviderConfig,
  resolveMaxOutputTokens,
  resolveTimeoutMs,
} from "./_lib/mira-provider.js";

/*
 * Forsa AI's chat endpoint.
 *
 * Order of operations is deliberate and matters:
 *
 *   1. method check
 *   2. kill switch          -> 503, no work done
 *   3. authenticate         -> 401/403; identity comes only from the token
 *   4. body size guard
 *   5. contract validation   -> 400; rejected before any quota is touched
 *   6. burst rate limit
 *   7. provider configured? -> 503, quota NOT consumed
 *   8. consume BOTH quotas   -> 429 personal or 429 global; one atomic
 *                              Firestore transaction, no partial state
 *   9. call the provider     -> timeout + output-token cap enforced
 *
 * Step 8 sits immediately before step 9 so one consumed unit maps to one
 * model invocation, and the provider-config check at step 7 means a
 * misconfigured deployment never burns anyone's allowance.
 *
 * There is deliberately no refund path. With plain HTTPS against a remote
 * inference API, a timeout or dropped connection cannot distinguish "never
 * sent" from "processed but the response was lost", so any automatic refund
 * risks double-spending the shared daily budget during an outage. A consumed
 * unit stays consumed; both allowances reset at UTC midnight.
 */

function isMiraEnabled() {
  return process.env.MIRA_ENABLED === "true";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    if (!isMiraEnabled()) {
      return res.status(503).json({
        error: "Forsa AI is not enabled on this deployment.",
        code: "MIRA_DISABLED",
      });
    }

    /* Identity is derived from the verified token, never the body. */
    const decoded = await authenticate(req);

    assertBodySize(req.body);

    const payload = parseMiraRequest(req.body);

    /* Burst guard, keyed by the verified uid. Translated to a coded error
       so the client can render a distinct burst state. */
    try {
      rateLimit(req, decoded.uid);
    } catch (burstError) {
      if (burstError?.status === 429) {
        const coded = new Error(
          "Too many requests. Please slow down and try again shortly."
        );
        coded.status = 429;
        coded.code = "MIRA_BURST_LIMIT";
        throw coded;
      }

      throw burstError;
    }

    const missing = missingProviderConfig();

    if (missing.length > 0) {
      /* Report before consuming quota so a disabled integration never
         burns a user's daily allowance. */
      return res.status(503).json({
        error: "Forsa AI is not connected to a model yet.",
        code: "MIRA_PROVIDER_NOT_CONFIGURED",
        missing,
      });
    }

    /*
     * Last gate before invocation. One transaction covers the personal and
     * the shared counter, so concurrent requests cannot exceed either.
     */
    const quotas = await consumeMiraQuotas(decoded.uid);

    /*
     * The system prompt is server-owned. User content is passed as an
     * already-validated user turn; no client-supplied system prompt exists.
     */
    const messages = [
      { role: "system", content: buildMiraSystemPrompt(payload.tool) },
      ...payload.messages,
    ];

    const maxTokens = Math.min(resolveMaxOutputTokens(), MIRA_REPLY_MAX_TOKENS);

    const completion = await createChatCompletion({
      messages,
      maxTokens,
      timeoutMs: resolveTimeoutMs(),
    });

    return res.status(200).json({
      reply: completion.reply,
      model: completion.model,
      truncated: completion.truncated === true,
      usage: quotas.personal,
    });
  } catch (error) {
    if (error instanceof ContractError) {
      return res.status(error.status).json({
        error: error.message,
        code: error.code,
      });
    }

    if (error instanceof QuotaExceededError) {
      return res.status(429).json({
        error: error.message,
        code: error.code,
        usage: {
          used: error.used,
          limit: error.limit,
          resetAt: nextUtcMidnightIso(),
        },
      });
    }

    if (error instanceof GlobalQuotaExceededError) {
      return res.status(429).json({
        error: error.message,
        code: error.code,
        capacity: {
          used: error.used,
          limit: error.limit,
          resetAt: nextUtcMidnightIso(),
        },
      });
    }

    if (error instanceof ProviderError) {
      /*
       * Return canned copy for the code, never the provider's own message:
       * upstream errors can carry internals, and the token must never be
       * echoed. The original message stays server-side for the logs.
       */
      if (error.status >= 500) {
        console.error(
          `Forsa AI provider failed [${error.code}]:`,
          error.message
        );
      }

      return res.status(error.status).json({
        error: publicMessageFor(error.code),
        code: error.code,
      });
    }

    /* authenticate() throws with status 401/403 and a safe message. */
    const status = error.status || 500;

    if (status >= 500) {
      console.error("Forsa AI chat endpoint failed:", error.message);
    }

    return res.status(status).json({
      error:
        status === 500
          ? "Something went wrong. Please try again."
          : error.message,
      /* Only our own burst code passes through here; anything else stays
         unlabeled so upstream internals can never leak via error codes. */
      code:
        status === 500
          ? "INTERNAL"
          : error.code === "MIRA_BURST_LIMIT"
            ? error.code
            : undefined,
    });
  }
}
