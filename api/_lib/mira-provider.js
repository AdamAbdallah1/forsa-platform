/*
 * Cloudflare Workers AI adapter — server only.
 *
 * Uses the documented REST chat-completions API with native fetch, so no SDK
 * dependency is added. Credentials are read from server-only environment
 * variables and never leave this module: nothing here is imported by client
 * code, and no variable is prefixed with VITE_.
 *
 * Deliberately NOT logged: request messages, response text, and the provider
 * token. Only status codes and error codes reach the logs.
 */

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

const MIN_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 60000;
const DEFAULT_TIMEOUT_MS = 25000;

const MIN_OUTPUT_TOKENS = 64;
const MAX_OUTPUT_TOKENS = 2048;
const DEFAULT_OUTPUT_TOKENS = 1024;

export class ProviderError extends Error {
  constructor(message, { status = 502, code = "PROVIDER_ERROR", retryable = false } = {}) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

export function isProviderConfigured() {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_AI_TOKEN &&
      process.env.MIRA_MODEL
  );
}

/** Names of any missing provider configuration, for an honest 503 body. */
export function missingProviderConfig() {
  const missing = [];

  if (!process.env.CLOUDFLARE_ACCOUNT_ID) missing.push("CLOUDFLARE_ACCOUNT_ID");
  if (!process.env.CLOUDFLARE_AI_TOKEN) missing.push("CLOUDFLARE_AI_TOKEN");
  if (!process.env.MIRA_MODEL) missing.push("MIRA_MODEL");

  return missing;
}

export function resolveTimeoutMs() {
  const parsed = Number.parseInt(String(process.env.MIRA_TIMEOUT_MS ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MS;

  return Math.min(Math.max(parsed, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

export function resolveMaxOutputTokens() {
  const parsed = Number.parseInt(
    String(process.env.MIRA_MAX_OUTPUT_TOKENS ?? ""),
    10
  );

  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_OUTPUT_TOKENS;

  return Math.min(Math.max(parsed, MIN_OUTPUT_TOKENS), MAX_OUTPUT_TOKENS);
}

/**
 * Extract assistant text from a Workers AI response.
 *
 * The OpenAI-compatible chat-completions endpoint returns the reply at the
 * TOP level (`choices[0].message.content`), with no `result` wrapper — see
 * https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
 * The classic `/ai/run` shape (`result.response`) is kept as a fallback.
 */
function extractReply(payload) {
  if (!payload || typeof payload !== "object") return null;

  const choice = Array.isArray(payload.choices) ? payload.choices[0] : null;
  const content = choice?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  const result = payload.result;

  if (
    result &&
    typeof result.response === "string" &&
    result.response.trim()
  ) {
    return result.response.trim();
  }

  return null;
}

/** Map an upstream HTTP status onto a stable, client-safe error. */
/*
 * Client-safe copy for each error code. Provider messages can include
 * upstream internals, so they are used for server logs only and never
 * forwarded to the browser.
 */
const CLIENT_MESSAGES = {
  MIRA_PROVIDER_NOT_CONFIGURED: "Forsa AI is not connected to a model yet.",
  MIRA_PROVIDER_RATE_LIMIT:
    "Forsa AI is rate limited by the model provider. Try again shortly.",
  MIRA_PROVIDER_TIMEOUT: "Forsa AI took too long to respond.",
  MIRA_PROVIDER_UNREACHABLE: "Forsa AI could not reach the model provider.",
  MIRA_PROVIDER_UNAVAILABLE: "Forsa AI's model provider is unavailable.",
  MIRA_PROVIDER_REJECTED: "Forsa AI's model provider rejected the request.",
  PROVIDER_EMPTY_REPLY: "Forsa AI returned an empty response.",
  PROVIDER_BAD_INPUT: "Forsa AI could not process that request.",
  PROVIDER_ERROR: "Forsa AI's model provider returned an error.",
};

/** The message that is safe to show a user, for a given error code. */
export function publicMessageFor(code) {
  return CLIENT_MESSAGES[code] || CLIENT_MESSAGES.PROVIDER_ERROR;
}

function upstreamError(status) {
  if (status === 429) {
    return new ProviderError(
      "Forsa AI is rate limited by the model provider. Try again shortly.",
      { status: 429, code: "MIRA_PROVIDER_RATE_LIMIT", retryable: true }
    );
  }

  if (status === 401 || status === 403) {
    /* 403 is also how a free-plan account is told a model needs billing. */
    return new ProviderError(
      "Forsa AI's model provider rejected the request.",
      { status: 503, code: "MIRA_PROVIDER_REJECTED", retryable: false }
    );
  }

  if (status === 400) {
    return new ProviderError("Mira's request was rejected.", {
      status: 400,
      code: "MIRA_PROVIDER_REJECTED",
      retryable: false,
    });
  }

  if (status === 408 || status === 524) {
    return new ProviderError("Forsa AI took too long to respond.", {
      status: 504,
      code: "MIRA_PROVIDER_TIMEOUT",
      retryable: true,
    });
  }

  return new ProviderError("Forsa AI's model provider is unavailable.", {
    status: 503,
    code: "MIRA_PROVIDER_UNAVAILABLE",
    retryable: true,
  });
}

/**
 * Run one chat completion against Cloudflare Workers AI.
 *
 * @param {{messages: Array<{role: string, content: string}>,
 *          maxTokens?: number,
 *          temperature?: number,
 *          timeoutMs?: number}} options
 * @returns {Promise<{reply: string, model: string, truncated: boolean}>}
 */
export async function createChatCompletion({
  messages,
  maxTokens,
  temperature = 0.6,
  timeoutMs,
}) {
  if (!isProviderConfigured()) {
    throw new ProviderError("Forsa AI has no model provider configured.", {
      status: 503,
      code: "MIRA_PROVIDER_NOT_CONFIGURED",
      retryable: false,
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ProviderError("No messages to send.", {
      status: 500,
      code: "PROVIDER_BAD_INPUT",
      retryable: false,
    });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const url = `${CLOUDFLARE_API_BASE}/accounts/${encodeURIComponent(
    accountId
  )}/ai/v1/chat/completions`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || resolveTimeoutMs());

  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_AI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.MIRA_MODEL,
        messages,
        max_tokens: maxTokens || resolveMaxOutputTokens(),
        temperature,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new ProviderError("Forsa AI took too long to respond.", {
        status: 504,
        code: "MIRA_PROVIDER_TIMEOUT",
        retryable: true,
      });
    }

    throw new ProviderError("Forsa AI could not reach the model provider.", {
      status: 503,
      code: "MIRA_PROVIDER_UNREACHABLE",
      retryable: true,
    });
  } finally {
    clearTimeout(timer);
  }

  const raw = await response.text();

  let payload;

  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw upstreamError(response.status);
  }

  /* Workers AI can answer HTTP 200 with success:false. */
  if (payload && payload.success === false) {
    throw new ProviderError("Forsa AI's model provider returned an error.", {
      status: 503,
      code: "MIRA_PROVIDER_UNAVAILABLE",
      retryable: true,
    });
  }

  const reply = extractReply(payload);

  if (!reply) {
    throw new ProviderError("Forsa AI returned an empty response.", {
      status: 502,
      code: "PROVIDER_EMPTY_REPLY",
      retryable: true,
    });
  }

  /*
   * A `length` finish reason means the model hit max_tokens mid-answer.
   * Surfacing it lets the endpoint and UI report the cutoff honestly
   * instead of presenting a truncated reply as complete.
   */
  const truncated =
    payload?.choices?.[0]?.finish_reason === "length";

  return {
    reply,
    model: payload?.result?.model || process.env.MIRA_MODEL,
    truncated,
  };
}
