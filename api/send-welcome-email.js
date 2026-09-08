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

function getFirstName(account) {
  const name = getDisplayName(account);

  if (name === "there") {
    return "there";
  }

  return name.split(/\s+/)[0];
}

/* -------------------------------------------------------------------------- */
/* Shared email styles                                                        */
/* -------------------------------------------------------------------------- */

const emailStyles = {
  background: "#f4f6f8",
  card: "#ffffff",
  text: "#101828",
  muted: "#667085",
  subtle: "#98a2b3",
  border: "#eaecf0",
  accent: "#635bff",
  accentDark: "#5148d8",
};

/* -------------------------------------------------------------------------- */
/* Email templates                                                            */
/* -------------------------------------------------------------------------- */

function seekerEmail({ name }) {
  const safeName = escapeHtml(name);

  return {
    subject: "Welcome to Forsa — your profile is ready",
    html: `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Welcome to Forsa</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:${emailStyles.background};
    font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;
    color:${emailStyles.text};
    -webkit-font-smoothing:antialiased;
  "
>
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="width:100%;background:${emailStyles.background};"
  >
    <tr>
      <td align="center" style="padding:48px 16px;">

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="max-width:620px;width:100%;"
        >

          <!-- Header -->
          <tr>
            <td style="padding:0 8px 24px 8px;">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td align="left">
                    <div
                      style="
                        font-size:26px;
                        line-height:32px;
                        font-weight:800;
                        letter-spacing:-0.06em;
                        color:${emailStyles.text};
                      "
                    >
                      Forsa<span style="color:${emailStyles.accent};">.</span>
                    </div>
                  </td>

                  <td align="right">
                    <div
                      style="
                        display:inline-block;
                        padding:7px 11px;
                        border:1px solid ${emailStyles.border};
                        border-radius:999px;
                        background:#ffffff;
                        color:${emailStyles.muted};
                        font-size:11px;
                        line-height:16px;
                        font-weight:600;
                      "
                    >
                      PROFILE READY
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td
              style="
                background:${emailStyles.card};
                border:1px solid ${emailStyles.border};
                border-radius:24px;
                overflow:hidden;
              "
            >

              <!-- Accent -->
              <div
                style="
                  height:5px;
                  background:${emailStyles.accent};
                  line-height:5px;
                  font-size:0;
                "
              >
                &nbsp;
              </div>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td style="padding:44px 42px 42px 42px;">

                    <!-- Eyebrow -->
                    <div
                      style="
                        font-size:13px;
                        line-height:20px;
                        font-weight:700;
                        color:${emailStyles.accent};
                        letter-spacing:0.02em;
                        text-transform:uppercase;
                      "
                    >
                      You're in
                    </div>

                    <!-- Heading -->
                    <h1
                      style="
                        margin:12px 0 0 0;
                        font-size:36px;
                        line-height:43px;
                        font-weight:800;
                        letter-spacing:-0.045em;
                        color:${emailStyles.text};
                      "
                    >
                      Welcome to Forsa,<br>
                      ${safeName}.
                    </h1>

                    <!-- Intro -->
                    <p
                      style="
                        margin:20px 0 0 0;
                        font-size:16px;
                        line-height:27px;
                        color:${emailStyles.muted};
                      "
                    >
                      Your profile is ready. Forsa helps talented people like
                      you connect with career opportunities — internships,
                      freelance work, and jobs — that match what you're good at
                      and where you want to go.
                    </p>

                    <!-- Feature block -->
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="
                        margin-top:28px;
                        background:#f8f9fc;
                        border:1px solid ${emailStyles.border};
                        border-radius:16px;
                      "
                    >
                      <tr>
                        <td style="padding:20px;">

                          <table
                            role="presentation"
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                          >
                            <tr>
                              <td width="36" valign="top">
                                <div
                                  style="
                                    width:30px;
                                    height:30px;
                                    line-height:30px;
                                    text-align:center;
                                    border-radius:10px;
                                    background:#eeecff;
                                    color:${emailStyles.accent};
                                    font-size:15px;
                                    font-weight:800;
                                  "
                                >
                                  ✓
                                </div>
                              </td>

                              <td valign="top" style="padding-left:12px;">
                                <div
                                  style="
                                    font-size:14px;
                                    line-height:21px;
                                    font-weight:700;
                                    color:${emailStyles.text};
                                  "
                                >
                                  Your next step
                                </div>

                                <div
                                  style="
                                    margin-top:4px;
                                    font-size:14px;
                                    line-height:22px;
                                    color:${emailStyles.muted};
                                  "
                                >
                                  Companies look at profiles before reaching
                                  out, so keep yours current as your skills and
                                  experience grow.
                                </div>
                              </td>
                            </tr>
                          </table>

                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="margin-top:30px;"
                    >
                      <tr>
                        <td
                          align="center"
                          style="
                            border-radius:12px;
                            background:${emailStyles.accent};
                          "
                        >
                          <a
                            href="https://forsa.digital/explore"
                            style="
                              display:inline-block;
                              padding:15px 24px;
                              border-radius:12px;
                              color:#ffffff;
                              font-size:14px;
                              line-height:20px;
                              font-weight:700;
                              text-decoration:none;
                            "
                          >
                            Explore opportunities
                            <span style="padding-left:6px;">→</span>
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Secondary text -->
                    <p
                      style="
                        margin:18px 0 0 0;
                        font-size:13px;
                        line-height:21px;
                        color:${emailStyles.subtle};
                      "
                    >
                      Come back any time to explore new opportunities or update
                      your profile.
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 8px 0 8px;">

              <p
                style="
                  margin:0;
                  font-size:12px;
                  line-height:20px;
                  color:${emailStyles.subtle};
                  text-align:center;
                "
              >
                You're receiving this email because you created a
                Forsa account.
              </p>

              <p
                style="
                  margin:8px 0 0 0;
                  font-size:12px;
                  line-height:20px;
                  color:${emailStyles.subtle};
                  text-align:center;
                "
              >
                © Forsa
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Welcome to Forsa</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:${emailStyles.background};
    font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;
    color:${emailStyles.text};
    -webkit-font-smoothing:antialiased;
  "
>
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="width:100%;background:${emailStyles.background};"
  >
    <tr>
      <td align="center" style="padding:48px 16px;">

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="max-width:620px;width:100%;"
        >

          <!-- Header -->
          <tr>
            <td style="padding:0 8px 24px 8px;">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td align="left">
                    <div
                      style="
                        font-size:26px;
                        line-height:32px;
                        font-weight:800;
                        letter-spacing:-0.06em;
                        color:${emailStyles.text};
                      "
                    >
                      Forsa<span style="color:${emailStyles.accent};">.</span>
                    </div>
                  </td>

                  <td align="right">
                    <div
                      style="
                        display:inline-block;
                        padding:7px 11px;
                        border:1px solid ${emailStyles.border};
                        border-radius:999px;
                        background:#ffffff;
                        color:${emailStyles.muted};
                        font-size:11px;
                        line-height:16px;
                        font-weight:600;
                      "
                    >
                      ACCOUNT VERIFIED
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td
              style="
                background:${emailStyles.card};
                border:1px solid ${emailStyles.border};
                border-radius:24px;
                overflow:hidden;
              "
            >

              <!-- Accent -->
              <div
                style="
                  height:5px;
                  background:${emailStyles.accent};
                  line-height:5px;
                  font-size:0;
                "
              >
                &nbsp;
              </div>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td style="padding:44px 42px 42px 42px;">

                    <!-- Eyebrow -->
                    <div
                      style="
                        font-size:13px;
                        line-height:20px;
                        font-weight:700;
                        color:${emailStyles.accent};
                        letter-spacing:0.02em;
                        text-transform:uppercase;
                      "
                    >
                      Your company is ready
                    </div>

                    <!-- Heading -->
                    <h1
                      style="
                        margin:12px 0 0 0;
                        font-size:36px;
                        line-height:43px;
                        font-weight:800;
                        letter-spacing:-0.045em;
                        color:${emailStyles.text};
                      "
                    >
                      Welcome to Forsa,<br>
                      ${safeName}.
                    </h1>

                    <!-- Intro -->
                    <p
                      style="
                        margin:20px 0 0 0;
                        font-size:16px;
                        line-height:27px;
                        color:${emailStyles.muted};
                      "
                    >
                      Your company account is verified and ready to help you
                      discover promising candidates and build a stronger
                      hiring pipeline.
                    </p>

                    <!-- Feature block -->
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="
                        margin-top:28px;
                        background:#f8f9fc;
                        border:1px solid ${emailStyles.border};
                        border-radius:16px;
                      "
                    >
                      <tr>
                        <td style="padding:20px;">

                          <table
                            role="presentation"
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                          >
                            <tr>
                              <td width="36" valign="top">
                                <div
                                  style="
                                    width:30px;
                                    height:30px;
                                    line-height:30px;
                                    text-align:center;
                                    border-radius:10px;
                                    background:#eeecff;
                                    color:${emailStyles.accent};
                                    font-size:15px;
                                    font-weight:800;
                                  "
                                >
                                  ✓
                                </div>
                              </td>

                              <td valign="top" style="padding-left:12px;">
                                <div
                                  style="
                                    font-size:14px;
                                    line-height:21px;
                                    font-weight:700;
                                    color:${emailStyles.text};
                                  "
                                >
                                  Start building your pipeline
                                </div>

                                <div
                                  style="
                                    margin-top:4px;
                                    font-size:14px;
                                    line-height:22px;
                                    color:${emailStyles.muted};
                                  "
                                >
                                  Explore talent, publish opportunities, and
                                  connect with people who match your needs.
                                </div>
                              </td>
                            </tr>
                          </table>

                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="margin-top:30px;"
                    >
                      <tr>
                        <td
                          align="center"
                          style="
                            border-radius:12px;
                            background:${emailStyles.accent};
                          "
                        >
                          <a
                            href="https://forsa.digital"
                            style="
                              display:inline-block;
                              padding:15px 24px;
                              border-radius:12px;
                              color:#ffffff;
                              font-size:14px;
                              line-height:20px;
                              font-weight:700;
                              text-decoration:none;
                            "
                          >
                            Open Forsa
                            <span style="padding-left:6px;">→</span>
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Secondary text -->
                    <p
                      style="
                        margin:18px 0 0 0;
                        font-size:13px;
                        line-height:21px;
                        color:${emailStyles.subtle};
                      "
                    >
                      Your company profile can be updated at any time as your
                      hiring needs evolve.
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 8px 0 8px;">

              <p
                style="
                  margin:0;
                  font-size:12px;
                  line-height:20px;
                  color:${emailStyles.subtle};
                  text-align:center;
                "
              >
                You're receiving this email because you created a verified
                Forsa company account.
              </p>

              <p
                style="
                  margin:8px 0 0 0;
                  font-size:12px;
                  line-height:20px;
                  color:${emailStyles.subtle};
                  text-align:center;
                "
              >
                © Forsa
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
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

    /*
     * Eligibility + exactly-once claim happen INSIDE a single
     * Firestore transaction.
     *
     * The idempotency markers are written BEFORE the email provider
     * is called. With transactional serialized isolation, only one of
     * several concurrent requests can commit the claim; the others
     * retry, observe the marker, and skip sending. This prevents
     * duplicate emails from double clicks, repeated requests,
     * refreshes, or network retries.
     *
     * If sending later fails, the marker stays set and the email is
     * never automatically retried (fail-closed). No array recipients,
     * no batch operations, no collection scans.
     */
    let decision = { status: "notFound" };

    try {
      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(userRef);

        if (!snap.exists) {
          return;
        }

        const account = snap.data();

        if (account.welcomeEmailSentAt) {
          decision = { status: "alreadySent" };
          return;
        }

        /*
         * Only accounts created by the current registration flow
         * (registerUser / loginWithGoogle new-account branch) carry
         * isNewRegistration. Pre-feature accounts never have it, so
         * existing users can never become eligible — not by logging
         * in, editing their profile, or re-running onboarding.
         */
        if (account.isNewRegistration !== true) {
          decision = { status: "notEligible" };
          return;
        }

        if (account.emailVerified !== true) {
          decision = { status: "emailNotVerified" };
          return;
        }

        const accountType = String(
          account.accountType || "finder"
        )
          .trim()
          .toLowerCase();

        if (accountType === "hiring") {
          decision = { status: "notEligible" };
          return;
        }

        const email = String(account.email || "").trim();

        if (!email) {
          decision = { status: "noEmail" };
          return;
        }

        const now = new Date();

        transaction.update(userRef, {
          welcomeEmailSentAt: now,
          onboardingCompletedAt: now,
          updatedAt: now,
        });

        decision = {
          status: "claim",
          account,
          email,
          accountType,
        };
      });
    } catch (transactionError) {
      console.error(
        "Welcome email claim failed:",
        transactionError
      );

      return res.status(500).json({
        error: "Internal server error.",
      });
    }

    if (decision.status === "notFound") {
      return res.status(404).json({
        error: "User profile not found.",
      });
    }

    if (decision.status === "alreadySent") {
      return res.status(200).json({
        success: true,
        alreadySent: true,
      });
    }

    if (decision.status === "emailNotVerified") {
      return res.status(400).json({
        error: "Email is not verified.",
      });
    }

    if (decision.status === "noEmail") {
      return res.status(400).json({
        error: "Account has no email address.",
      });
    }

    if (decision.status === "notEligible") {
      return res.status(200).json({
        success: false,
        alreadySent: true,
        reason: "notEligible",
      });
    }

    const name = getFirstName(decision.account);

    let emailContent;

    if (decision.accountType === "hiring") {
      emailContent = companyEmail({ name });
    } else {
      emailContent = seekerEmail({ name });
    }

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: [decision.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error("Welcome email failed:", error);

      return res.status(500).json({
        error: "Failed to send welcome email.",
      });
    }

    return res.status(200).json({
      success: true,
      alreadySent: false,
      accountType: decision.accountType,
      emailId: data?.id || null,
    });
  } catch (error) {
    console.error("Welcome email endpoint failed:", error);

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}
