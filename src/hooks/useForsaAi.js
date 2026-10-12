import { useCallback, useEffect, useRef, useState } from "react";
import { sendMiraMessage, useMiraUsage } from "../lib/miraService";
import { matchLocalReply } from "../lib/forsaAiLocal";

/*
 * Shared Forsa AI conversation state.
 *
 * The workspace page and the floating widget both use this hook, so the
 * send path, error handling, and usage tracking exist exactly once. Each
 * mounted instance owns independent React memory — conversations are never
 * persisted anywhere.
 *
 * A ref mirror (`messagesRef`) sits alongside state so sends and retries
 * always operate on the current transcript without stale-closure bugs. The
 * ref is the source of truth for outgoing payloads; state drives rendering.
 *
 * Send order:
 *   1. deterministic local check (small talk / out-of-scope) — no quota
 *   2. provider call through the authenticated endpoint — one quota unit
 *
 * Retrying re-sends the same pending turn without appending a duplicate,
 * and an in-flight request blocks further sends.
 */

const STATUS = {
  IDLE: "idle",
  SENDING: "sending",
  ERROR: "error",
};

export default function useForsaAi({ tool = "general" } = {}) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [error, setError] = useState(null);

  const messagesRef = useRef([]);
  const pendingRef = useRef(null);
  const inFlightRef = useRef(false);

  const usage = useMiraUsage();

  /* Drop a stuck sending state if the component unmounts mid-flight. */
  useEffect(
    () => () => {
      inFlightRef.current = false;
    },
    []
  );

  const pushMessage = useCallback((message) => {
    const withId = {
      ...message,
      id: message.id || `m${messagesRef.current.length + 1}`,
      createdAt: message.createdAt || Date.now(),
    };

    messagesRef.current = [...messagesRef.current, withId];
    setMessages(messagesRef.current);

    return withId;
  }, []);

  const deliver = useCallback(
    async (content) => {
      if (inFlightRef.current) return false;
      inFlightRef.current = true;

      pendingRef.current = content;
      setStatus(STATUS.SENDING);
      setError(null);

      const history = messagesRef.current.map(({ role, content: body }) => ({
        role,
        content: body,
      }));

      try {
        const data = await sendMiraMessage({
          messages: history,
          tool,
          consent: { shareCv: false },
        });

      pushMessage({
        role: "assistant",
        content: data.reply,
        local: false,
        truncated: data.truncated === true,
      });
      setStatus(STATUS.IDLE);
      pendingRef.current = null;

      return true;
    } catch (sendError) {
      if (sendError?.name === "AbortError") {
        setStatus(STATUS.IDLE);
        pendingRef.current = null;
      } else {
        setError(sendError);
        setStatus(STATUS.ERROR);
      }

      return false;
    } finally {
      inFlightRef.current = false;
    }
  }, [pushMessage, tool]);

  /**
   * Send a message. Local small talk and out-of-scope inputs are answered
   * immediately without touching the provider or quota; everything else is
   * delivered to the endpoint. Returns false when blocked (already sending).
   */
  const sendText = useCallback(
    async (content) => {
      if (inFlightRef.current) return false;

      const value = String(content || "").trim();

      if (!value) return false;

      const local = matchLocalReply(value);

      if (local) {
        pushMessage({ role: "user", content: value });
        pushMessage({ role: "assistant", content: local.reply, local: true });
        setStatus(STATUS.IDLE);
        pendingRef.current = null;

        return true;
      }

      pushMessage({ role: "user", content: value });

      return deliver(value);
    },
    [deliver, pushMessage]
  );

  const retry = useCallback(async () => {
    if (inFlightRef.current || !pendingRef.current) return false;

    return deliver(pendingRef.current);
  }, [deliver]);

  const reset = useCallback(() => {
    messagesRef.current = [];
    pendingRef.current = null;
    inFlightRef.current = false;
    setMessages([]);
    setError(null);
    setStatus(STATUS.IDLE);
  }, []);

  return {
    messages,
    status,
    error,
    usage: usage.usage,
    capacity: usage.capacity,
    isSending: status === STATUS.SENDING,
    isError: status === STATUS.ERROR,
    hasConversation: messages.length > 0,
    sendText,
    retry,
    reset,
    setError,
    STATUS,
  };
}
