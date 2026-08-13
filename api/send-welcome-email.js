import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { Resend } from "resend";

/* -------------------------------------------------------------------------- */
/* Firebase                                                                   */
/* -------------------------------------------------------------------------- */

if (getApps().length === 0) {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      );
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON."
      );
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    serviceAccount = JSON.parse(
      readFileSync(
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
        "utf8"
      )
    );
  } else {
    throw new Error(
      "Missing Firebase service account configuration."
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
const adminAuth = getAuth();
/* -------------------------------------------------------------------------- */
/* Resend                                                                     */
/* -------------------------------------------------------------------------- */

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY.");
}

if (!process.env.FROM_EMAIL) {
  throw new Error("Missing FROM_EMAIL.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getDisplayName(account) {
  return (
    account.name ||
    account.fullName ||
    account.displayName ||
    account.companyName ||
    "there"
  );
}

/* -------------------------------------------------------------------------- */
/* Email templates                                                            */
/* -------------------------------------------------------------------------- */

function seekerEmail({ name }) {
  const safeName = escapeHtml(name);

  return {
    subject: "Welcome to Forsa — your next opportunity starts here",
    html: `
<!doctype html>
<html>
<body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="max-width:620px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:20px;padding:40px;">

      <div style="font-size:28px;font-weight:800;letter-spacing:-0.04em;">
        Forsa
      </div>

      <div style="margin-top:32px;">
        <h1 style="margin:0;font-size:30px;line-height:1.2;">
          Welcome to Forsa, ${safeName}.
        </h1>

        <p style="font-size:16px;line-height:1.7;color:#4b5563;margin-top:20px;">
          Your account is verified and you're ready to start discovering
          opportunities that match your skills, interests, and goals.
        </p>

        <p style="font-size:16px;line-height:1.7;color:#4b5563;">
          Complete your profile, explore opportunities, and put yourself
          in front of the right companies.
        </p>

        <a
          href="https://forsa.digital/profile"
          style="display:inline-block;margin-top:16px;padding:14px 22px;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;"
        >
          Complete your profile
        </a>
      </div>

      <div style="margin-top:36px;padding-top:24px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:13px;color:#9ca3af;">
          You're receiving this email because you created a verified Forsa account.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`,
  };
}

function companyEmail({ name }) {
  const safeName = escapeHtml(name);

  return {
    subject: "Welcome to Forsa — start finding the right talent",
    html: `
<!doctype html>
<html>
<body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="max-width:620px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:20px;padding:40px;">

      <div style="font-size:28px;font-weight:800;letter-spacing:-0.04em;">
        Forsa
      </div>

      <div style="margin-top:32px;">
        <h1 style="margin:0;font-size:30px;line-height:1.2;">
          Welcome to Forsa, ${safeName}.
        </h1>

        <p style="font-size:16px;line-height:1.7;color:#4b5563;margin-top:20px;">
          Your company account is verified and ready to go.
        </p>

        <p style="font-size:16px;line-height:1.7;color:#4b5563;">
          You can now discover promising candidates, publish opportunities,
          and build a stronger hiring pipeline through Forsa.
        </p>

        <a
          href="https://forsa.digital"
          style="display:inline-block;margin-top:16px;padding:14px 22px;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;"
        >
          Open Forsa
        </a>
      </div>

      <div style="margin-top:36px;padding-top:24px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:13px;color:#9ca3af;">
          You're receiving this email because you created a verified Forsa company account.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`,
  };
}

/* -------------------------------------------------------------------------- */
/* API handler                                                                */
/* -------------------------------------------------------------------------- */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const authHeader = req.headers.authorization;

if (!authHeader?.startsWith("Bearer ")) {
  return res.status(401).json({
    error: "Unauthorized.",
  });
}

const idToken = authHeader.slice("Bearer ".length);

let decodedToken;

try {
  decodedToken = await adminAuth.verifyIdToken(idToken);
} catch {
  return res.status(401).json({
    error: "Invalid authentication token.",
  });
}

const uid = decodedToken.uid;

if (decodedToken.email_verified !== true) {
  return res.status(403).json({
    error: "Email is not verified.",
  });
}

    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      return res.status(404).json({
        error: "User profile not found.",
      });
    }

    const account = snap.data();

    if (account.emailVerified !== true) {
      return res.status(400).json({
        error: "Email is not verified.",
      });
    }

    if (account.welcomeEmailSentAt) {
      return res.status(200).json({
        success: true,
        alreadySent: true,
      });
    }

    const email = String(account.email || "").trim();

    if (!email) {
      return res.status(400).json({
        error: "Account has no email address.",
      });
    }

    const accountType = String(
      account.accountType || "finder"
    )
      .trim()
      .toLowerCase();

    const name = getDisplayName(account);

    let emailContent;

    if (accountType === "hiring") {
      emailContent = companyEmail({ name });
    } else {
      emailContent = seekerEmail({ name });
    }

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error("Welcome email failed:", error);

      return res.status(500).json({
        error: "Failed to send welcome email.",
      });
    }

    await userRef.update({
      welcomeEmailSentAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      alreadySent: false,
      accountType,
      emailId: data?.id || null,
    });
  } catch (error) {
    console.error("Welcome email endpoint failed:", error);

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}
