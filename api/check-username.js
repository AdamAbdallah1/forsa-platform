import { db, rateLimit } from "./_lib/forsa-server.js";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    rateLimit(req, String(req.body?.username || "").trim().toLowerCase());

    const raw = String(req.body?.username || "").trim();
    const lower = raw.toLowerCase();

    if (!USERNAME_RE.test(lower)) {
      return res.status(400).json({
        error: "Invalid username.",
      });
    }

    const snap = await db.doc(`usernames/${lower}`).get();

    return res.status(200).json({
      available: !snap.exists,
    });
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({
        error: error.message,
      });
    }

    console.error("Check username endpoint failed:", error);

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}