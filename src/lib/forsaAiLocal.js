/*
 * Deterministic local handling for Forsa AI.
 *
 * These replies are generated in the browser without invoking the AI
 * provider and without consuming quota. Two cases are covered:
 *
 *   1. Small talk — normalized EXACT matches only ("hi", "thanks", ...).
 *      Exact matching keeps this predictable: anything that is not exactly
 *      a greeting is not treated as one.
 *
 *   2. Clearly out-of-scope requests — a small set of tightly scoped
 *      patterns for topics Forsa AI never covers (weather, sports results,
 *      entertainment, recipes, ...). Ambiguous messages are NOT matched
 *      here; they go to the provider with tool=general, where the
 *      server-owned system prompt keeps the conversation career-scoped.
 *
 * Returns `{ reply }` for a local answer, or `null` when the message should
 * go to the provider. Never throws, never performs I/O.
 */

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/[!?.,;:…]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SMALL_TALK = new Map([
  ["hi", "Hi there — how can I help with your career today?"],
  ["hello", "Hello — how can I help with your career today?"],
  ["hey", "Hey — how can I help with your career today?"],
  ["hey there", "Hey — how can I help with your career today?"],
  ["hi there", "Hi there — how can I help with your career today?"],
  ["good morning", "Good morning — how can I help with your career today?"],
  ["good afternoon", "Good afternoon — how can I help with your career today?"],
  ["good evening", "Good evening — how can I help with your career today?"],
  ["salam", "Salam — how can I help with your career today?"],
  ["marhaba", "Marhaba — how can I help with your career today?"],
  ["how are you", "I'm running well, thank you. More importantly — what are you working toward in your career?"],
  ["how r u", "I'm running well, thank you. More importantly — what are you working toward in your career?"],
  ["how is it going", "All good here. What career question can I help with today?"],
  ["whats up", "Not much — I'm here whenever you have a career question. What are you working on?"],
  ["what's up", "Not much — I'm here whenever you have a career question. What are you working on?"],
  ["thanks", "You're welcome. Good luck out there — come back any time you need a hand."],
  ["thank you", "You're welcome. Good luck out there — come back any time you need a hand."],
  ["thank you so much", "You're welcome. Good luck out there — come back any time you need a hand."],
  ["thx", "You're welcome. Good luck out there — come back any time you need a hand."],
  ["ok", "Got it. Let me know when you're ready — pick a career tool above or ask me anything."],
  ["okay", "Got it. Let me know when you're ready — pick a career tool above or ask me anything."],
  ["bye", "Goodbye for now — I'll be here when you need career help."],
  ["goodbye", "Goodbye for now — I'll be here when you need career help."],
  ["see you", "See you — good luck with the job hunt."],
]);

const OUT_OF_SCOPE_REPLY =
  "I focus on careers — CVs, interviews, applications, and planning your next step. " +
  "Try one of the career tools above, or ask me a career question and I'll do my best.";

/*
 * Career framing wins over out-of-scope patterns: "weather for outdoor jobs"
 * is a career question that happens to contain the word "weather", so any
 * message carrying obvious career vocabulary bypasses pattern matching and
 * goes to the provider. This keeps the pattern list from silently
 * misclassifying natural-language messages.
 */
const CAREER_WORDS =
  /\b(job|jobs|career|careers|cv|resume|interview|work|working|hiring|salary|salaries|role|application|profession|employer|recruiter|promotion|internship|workplace|colleague|boss|manager|freelance|remote work)\b/;

const OUT_OF_SCOPE_PATTERNS = [
  /\bweather\b/,
  /\btemperature outside\b/,
  /\bwho won\b.*\b(match|game|league|cup)\b/,
  /\b(score|result)s?\b.*\b(match|game|football|basketball)\b/,
  /\bfootball\b.*\b(score|match|result|tonight)\b/,
  /\brecipe\b/,
  /\bhow (do|can) i cook\b/,
  /\btell me a joke\b/,
  /\b(movie|film|series|show)s?\b.*\b(recommend|watch|suggest)\b/,
  /\b(celebrity|actor|actress|singer)\b/,
  /\bhoroscope\b/,
  /\blast night.*\b(dream|dreamt)\b/,
  /\btranslate\b.*\b(sentence|paragraph|word)\b/,
  /\bwhat time is it\b/,
  /\bstock price\b/,
  /\bcryptocurrency\b|\bbitcoin\b.*\b(price|worth|buy)\b/,
];

/**
 * @param {string} text raw user input
 * @returns {{ reply: string, local: true } | null}
 */
export function matchLocalReply(text) {
  const normalized = normalize(text);

  if (!normalized) return null;

  if (normalized.length > 200) return null;

  if (SMALL_TALK.has(normalized)) {
    return { reply: SMALL_TALK.get(normalized), local: true };
  }

  /* Career-framed messages are never redirected locally. */
  if (CAREER_WORDS.test(normalized)) return null;

  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(normalized)) {
      return { reply: OUT_OF_SCOPE_REPLY, local: true };
    }
  }

  return null;
}
