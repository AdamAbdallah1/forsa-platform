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
    subject: "Welcome to Forsa — your next opportunity starts here",
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
                      Your account is verified and you're ready to discover
                      opportunities that match your skills, interests, and goals.
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
                                  Complete your profile so companies can
                                  understand who you are and what you can offer.
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
                            href="https://forsa.digital/profile"
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
                            Complete your profile
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
                      You can always come back to your profile and update
                      your information later.
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
