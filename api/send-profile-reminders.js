import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { Resend } from "resend";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const REMINDER_COOLDOWN_DAYS = 7;
const PROFILE_URL = "https://forsa.digital/profile";

/* -------------------------------------------------------------------------- */
/* Firebase                                                                   */
/* -------------------------------------------------------------------------- */

if (getApps().length === 0) {
  let serviceAccount;

  // Production / Vercel
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      );
    } catch (error) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON."
      );
    }
  }

  // Local development
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    serviceAccount = JSON.parse(
      readFileSync(
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
        "utf8"
      )
    );
  }

  else {
    throw new Error(
      "Missing Firebase service account configuration. " +
      "Set FIREBASE_SERVICE_ACCOUNT_JSON for Vercel " +
      "or FIREBASE_SERVICE_ACCOUNT_PATH for local development."
    );
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      serviceAccount.project_id,
  });
}

const db = getFirestore();

/* -------------------------------------------------------------------------- */
/* Resend                                                                     */
/* -------------------------------------------------------------------------- */

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY in .env.local");
}

if (!process.env.FROM_EMAIL) {
  throw new Error("Missing FROM_EMAIL in .env.local");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Converts an email value into a plain email address.
 *
 * Handles:
 *   john@example.com
 *   mailto:john@example.com
 *   <john@example.com>
 *   [john@example.com](mailto:john@example.com)
 */
export function normalizeEmail(value) {
  let email = String(value ?? "").trim();

  if (!email) {
    return "";
  }

  // Handle Markdown email:
  // [john@example.com](mailto:john@example.com)
  const markdownMatch = email.match(
    /^\[([^\]]+)\]\(mailto:([^)]+)\)$/i
  );

  if (markdownMatch) {
    email = markdownMatch[2].trim();
  }

  // Handle plain mailto:
  // mailto:john@example.com
  if (email.toLowerCase().startsWith("mailto:")) {
    email = email.slice(7).trim();
  }

  // Remove surrounding < >
  email = email.replace(/^<|>$/g, "").trim();

  return email;
}

/**
 * Basic email validation.
 */
export function isValidEmail(value) {
  const email = normalizeEmail(value);

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Determines whether a profile field has a meaningful value.
 */
function hasValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object" && value !== null) {
    return Object.keys(value).length > 0;
  }

  return Boolean(String(value ?? "").trim());
}

/**
 * Only finder/seeker accounts receive profile reminders.
 */
function isFinderAccount(user) {
  const accountType = String(
    user.accountType || "finder"
  )
    .trim()
    .toLowerCase();

  return accountType === "finder";
}

/**
 * Prevents sending reminders more often than once every 7 days.
 */
function canSendReminder(user) {
  const lastSentAt = user.profileReminder?.lastSentAt;

  if (!lastSentAt) {
    return true;
  }

  const lastSentDate =
    typeof lastSentAt?.toDate === "function"
      ? lastSentAt.toDate()
      : new Date(lastSentAt);

  if (Number.isNaN(lastSentDate.getTime())) {
    return true;
  }

  const cooldownMs =
    REMINDER_COOLDOWN_DAYS *
    24 *
    60 *
    60 *
    1000;

  return Date.now() - lastSentDate.getTime() >= cooldownMs;
}

/* -------------------------------------------------------------------------- */
/* Profile status                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A profile is considered complete only when ALL FOUR fields exist:
 *
 * - Skills
 * - Experience
 * - CV / Resume
 * - Portfolio
 */
export function getProfileStatus(user) {
  const skills =
    user.skills || user.publicSkills;

  const experience =
    user.experience;

  const cv =
    user.cv || user.publicCv;

  const portfolio =
    user.portfolioLinks;

  const hasSkills = hasValue(skills);
  const hasExperience = hasValue(experience);
  const hasCv = hasValue(cv);
  const hasPortfolio = hasValue(portfolio);

  const completeEnough =
    hasSkills &&
    hasExperience &&
    hasCv &&
    hasPortfolio;

  return {
    hasSkills,
    hasExperience,
    hasCv,
    hasPortfolio,
    completeEnough,
  };
}

/**
 * Returns human-readable missing profile fields.
 */
export function getMissingItems(status) {
  const missing = [];

  if (!status.hasSkills) {
    missing.push("Skills");
  }

  if (!status.hasExperience) {
    missing.push("Experience");
  }

  if (!status.hasCv) {
    missing.push("CV / Resume");
  }

  if (!status.hasPortfolio) {
    missing.push("Portfolio");
  }

  return missing;
}

/* -------------------------------------------------------------------------- */
/* HTML helpers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Safely escapes user-controlled values before putting them into HTML.
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* -------------------------------------------------------------------------- */
/* Email                                                                      */
/* -------------------------------------------------------------------------- */

export function buildEmail(name, status) {
  const firstName =
    String(name || "there")
      .trim()
      .split(/\s+/)[0] || "there";

  const missingItems = getMissingItems(status);

  const missingList = missingItems
    .map(
      (item) => `
        <li style="margin-bottom: 8px;">
          ${escapeHtml(item)}
        </li>
      `
    )
    .join("");

  return {
    subject: "Complete your Forsa profile",

    html: `
<!DOCTYPE html>
<html>
  <body
    style="
      margin: 0;
      padding: 0;
      background: #f8fafc;
      font-family: Arial, Helvetica, sans-serif;
      color: #111827;
    "
  >
    <div
      style="
        max-width: 600px;
        margin: 40px auto;
        padding: 32px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
      "
    >

      <h2
        style="
          margin: 0 0 24px;
          font-size: 24px;
          line-height: 1.3;
        "
      >
        Complete your Forsa profile
      </h2>

      <p
        style="
          font-size: 16px;
          line-height: 1.6;
          margin: 0 0 16px;
        "
      >
        Hi ${escapeHtml(firstName)},
      </p>

      <p
        style="
          font-size: 16px;
          line-height: 1.6;
          margin: 0 0 16px;
        "
      >
        Your Forsa profile isn't complete yet.
      </p>

      <p
        style="
          font-size: 16px;
          line-height: 1.6;
          margin: 0 0 16px;
        "
      >
        Completing your profile helps companies understand
        your background and makes it easier for you to be
        discovered for relevant opportunities on Forsa.
      </p>

      <p
        style="
          font-size: 16px;
          line-height: 1.6;
          margin: 24px 0 8px;
          font-weight: 600;
        "
      >
        Still missing from your profile:
      </p>

      <ul
        style="
          font-size: 15px;
          line-height: 1.5;
          margin: 8px 0 24px;
          padding-left: 24px;
        "
      >
        ${missingList}
      </ul>

      <a
        href="${PROFILE_URL}"
        style="
          display: inline-block;
          padding: 12px 20px;
          background: #111827;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
        "
      >
        Complete my profile
      </a>

      <p
        style="
          font-size: 14px;
          line-height: 1.6;
          color: #6b7280;
          margin: 24px 0 0;
        "
      >
        If you've already updated your profile, you can safely
        ignore this email.
      </p>

      <p
        style="
          font-size: 14px;
          line-height: 1.6;
          color: #6b7280;
          margin: 24px 0 0;
        "
      >
        — The Forsa Team
      </p>

    </div>
  </body>
</html>
`,
  };
}

/* -------------------------------------------------------------------------- */
/* Find incomplete profiles                                                   */
/* -------------------------------------------------------------------------- */

export async function findIncompleteProfiles({
  respectCooldown = true,
} = {}) {
  const snapshot =
    await db.collection("users").get();

  const users = [];

  for (const document of snapshot.docs) {
    const user = document.data();

    /* ---------------------------------------------------------------------- */
    /* Email                                                                  */
    /* ---------------------------------------------------------------------- */

    if (!user.email) {
      continue;
    }

    const email = normalizeEmail(user.email);

    if (!isValidEmail(email)) {
      console.warn(
        `Skipping invalid email for ${document.id}:`,
        user.email
      );

      continue;
    }

    /* ---------------------------------------------------------------------- */
    /* Account type                                                           */
    /* ---------------------------------------------------------------------- */

    if (!isFinderAccount(user)) {
      continue;
    }

    /* ---------------------------------------------------------------------- */
    /* Profile status                                                         */
    /* ---------------------------------------------------------------------- */

    const status =
      getProfileStatus(user);

    if (status.completeEnough) {
      continue;
    }

    /* ---------------------------------------------------------------------- */
    /* Cooldown                                                               */
    /* ---------------------------------------------------------------------- */

    if (
      respectCooldown &&
      !canSendReminder(user)
    ) {
      continue;
    }

    users.push({
      uid: document.id,
      email,
      name: user.name || "",
      accountType:
        user.accountType || "finder",
      status,
      missing:
        getMissingItems(status),
    });
  }

  return users;
}

/* -------------------------------------------------------------------------- */
/* Send one reminder                                                          */
/* -------------------------------------------------------------------------- */

export async function sendProfileReminder(
  email,
  name,
  status
) {
  const normalizedEmail =
    normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    throw new Error(
      `Invalid email address: ${email}`
    );
  }

  const message =
    buildEmail(name, status);

  const result =
    await resend.emails.send({
      from: `Forsa <${process.env.FROM_EMAIL}>`,
      to: [normalizedEmail],
      subject: message.subject,
      html: message.html,
    });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Resend failed to send email"
    );
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* Record successful reminder                                                 */
/* -------------------------------------------------------------------------- */

async function recordReminderSent(uid) {
  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        profileReminder: {
          lastSentAt: Timestamp.now(),
        },
      },
      {
        merge: true,
      }
    );
}

/* -------------------------------------------------------------------------- */
/* Send reminders                                                             */
/* -------------------------------------------------------------------------- */

export async function sendReminders(users) {
  const results = [];

  for (const user of users) {
    try {
      const resendResult =
        await sendProfileReminder(
          user.email,
          user.name,
          user.status
        );

      /*
       * Only record lastSentAt AFTER Resend
       * successfully accepted the email.
       */
      await recordReminderSent(user.uid);

      results.push({
        uid: user.uid,
        email: user.email,
        name: user.name,
        sent: true,
        resendId:
          resendResult.data?.id || null,
      });
    } catch (error) {
      console.error(
        `Failed to send reminder to ${user.email}:`,
        error
      );

      results.push({
        uid: user.uid,
        email: user.email,
        name: user.name,
        sent: false,
        error:
          error?.message ||
          "Unknown email error",
      });
    }
  }

  return results;
}

/* -------------------------------------------------------------------------- */
/* API handler                                                                */
/* -------------------------------------------------------------------------- */

export default async function handler(
  req,
  res
) {
  if (req.method !== "POST") {
  return res.status(405).json({
    error: "Method not allowed",
  });
}

const authHeader = req.headers.authorization;
const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
  return res.status(401).json({
    error: "Unauthorized",
  });
}

  try {
    const body = req.body || {};

    /*
     * IMPORTANT:
     *
     * Default behavior is DRY RUN.
     *
     * Nothing is sent unless:
     *
     * dryRun: false
     *
     * is explicitly provided.
     */
    const dryRun =
      body.dryRun !== false;

    /*
     * Optional single-email test.
     *
     * Example:
     *
     * {
     *   "testEmail": "your@email.com"
     * }
     */
    const testEmail =
      typeof body.testEmail === "string"
        ? normalizeEmail(body.testEmail)
        : "";

    /*
     * Find incomplete finder profiles.
     *
     * The 7-day cooldown is respected.
     */
    const users =
  await findIncompleteProfiles({
    respectCooldown: !testEmail,
  });

    /* ---------------------------------------------------------------------- */
    /* Single test email                                                      */
    /* ---------------------------------------------------------------------- */

    if (testEmail) {
      if (!isValidEmail(testEmail)) {
        return res.status(400).json({
          error:
            "Invalid testEmail address.",
          email: testEmail,
        });
      }

      const testUser = users[0];

      if (!testUser) {
        return res.status(200).json({
          test: true,
          sent: false,
          message:
            "No eligible incomplete finder profiles found.",
        });
      }

      const result =
        await sendProfileReminder(
          testEmail,
          testUser.name,
          testUser.status
        );

      return res.status(200).json({
        test: true,
        sent: true,
        email: testEmail,
        basedOnUser: {
          uid: testUser.uid,
          name: testUser.name,
          accountType:
            testUser.accountType,
          missing: testUser.missing,
        },
        resend: result,
      });
    }

    /* ---------------------------------------------------------------------- */
    /* Dry run                                                                */
    /* ---------------------------------------------------------------------- */

    if (dryRun) {
      return res.status(200).json({
        dryRun: true,
        count: users.length,
        users,
      });
    }

    /* ---------------------------------------------------------------------- */
    /* Production bulk send                                                   */
    /* ---------------------------------------------------------------------- */

    const results =
      await sendReminders(users);

    const sent =
      results.filter(
        (result) => result.sent
      ).length;

    const failed =
      results.filter(
        (result) => !result.sent
      ).length;

    return res.status(200).json({
      dryRun: false,
      attempted: users.length,
      sent,
      failed,
      results,
    });
  } catch (error) {
    console.error(
      "Profile reminder error:",
      error
    );

    return res.status(500).json({
      error:
        "Could not process profile reminders.",
      details:
        error?.message ||
        "Unknown error",
    });
  }
}