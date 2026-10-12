/*
 * Forsa AI error copy.
 *
 * Maps a service error onto the copy shown to the user. Personal and
 * global quota states have deliberately different messages: the user must
 * never be told their own allowance is spent when it is the shared budget,
 * or vice versa. Timeout copy states the uncertain outcome plainly because
 * a timed-out request may still have consumed a generation — retrying is
 * allowed but informed.
 */
export function describeError(error) {
  const code = error?.code;

  if (code === "QUOTA_EXCEEDED") {
    return {
      title: "Daily Forsa AI limit reached",
      body: error.quota
        ? `You have used ${error.quota.used} of ${error.quota.limit} Forsa AI generations today. Your allowance resets at midnight UTC.`
        : "You have used today's Forsa AI allowance. It resets at midnight UTC.",
      tone: "neutral",
      retryable: false,
    };
  }

  if (code === "GLOBAL_QUOTA_EXCEEDED") {
    return {
      title: "Forsa AI reached its free daily capacity",
      body:
        "Forsa AI has reached its free daily capacity. The career guides on the Forsa AI page remain available, and generations resume at midnight UTC.",
      tone: "neutral",
      retryable: false,
    };
  }

  if (code === "MIRA_PROVIDER_RATE_LIMIT") {
    return {
      title: "Forsa AI is busy",
      body:
        "The model provider is rate limiting requests right now. Try again in a moment.",
      tone: "neutral",
      retryable: true,
    };
  }

  if (code === "MIRA_BURST_LIMIT") {
    return {
      title: "Slow down a little",
      body:
        "You're sending requests too quickly. Wait a moment, then try again — this does not affect your daily allowance.",
      tone: "neutral",
      retryable: true,
    };
  }

  if (code === "MIRA_PROVIDER_TIMEOUT") {
    return {
      title: "Forsa AI took too long",
      body:
        "The request timed out and its outcome is uncertain — it may have used one of your AI generations. Check your remaining count, then try again if you have allowance left.",
      tone: "error",
      retryable: true,
    };
  }

  if (code === "MIRA_PROVIDER_UNREACHABLE" || code === "MIRA_UNREACHABLE") {
    return {
      title: "Forsa AI could not be reached",
      body:
        "The model provider did not respond. Check your connection and try again.",
      tone: "error",
      retryable: true,
    };
  }

  if (code === "NOT_AUTHENTICATED") {
    return {
      title: "Sign in to use Forsa AI",
      body: "Your session ended. Sign in again to continue.",
      tone: "neutral",
      retryable: false,
    };
  }

  if (
    code === "MIRA_DISABLED" ||
    code === "MIRA_PROVIDER_NOT_CONFIGURED"
  ) {
    return {
      title: "Forsa AI is not connected yet",
      body:
        "No model provider is configured for this deployment, so no reply is generated and nothing is sent anywhere.",
      tone: "neutral",
      retryable: false,
    };
  }

  if (code === "MIRA_PROVIDER_UNAVAILABLE") {
    return {
      title: "Forsa AI is temporarily unavailable",
      body:
        "The model provider is having problems right now. This attempt used one of your AI generations — try again in a little while.",
      tone: "error",
      retryable: true,
    };
  }

  if (code === "MIRA_PROVIDER_REJECTED") {
    return {
      title: "Forsa AI could not process that",
      body:
        "The model provider rejected the request. Try rephrasing, or shorten a very long input and try again.",
      tone: "error",
      retryable: true,
    };
  }

  if (code === "PROVIDER_EMPTY_REPLY") {
    return {
      title: "Forsa AI returned nothing",
      body:
        "The model came back empty. Try asking again, or rephrase your question.",
      tone: "error",
      retryable: true,
    };
  }

  return {
    title: "Something went wrong",
    body: "Forsa AI could not answer that. Please try again.",
    tone: "error",
    retryable: true,
  };
}
