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

function nonEmptyString(value) {
  return Boolean(String(value ?? "").trim());
}

function hasEducation(education) {
  if (!education) return false;

  if (typeof education === "string") {
    return Boolean(education.trim());
  }

  if (Array.isArray(education)) {
    return education.length > 0;
  }

  if (typeof education === "object") {
    return Object.values(education).some((value) =>
      String(value ?? "").trim()
    );
  }

  return false;
}

/*
 * The 8-signal credibility model, derived directly from the app's
 * public directory scoring (src/pages/People.jsx getProfileStrength)
 * with strict semantics: empty arrays/objects never count as present.
 *
 * Signals: name, city, About (bio/about), skills, job preferences
 * (lookingFor), CV, work experience, education.
 */
function assessProfile(account) {
  const skills = account.skills ?? account.publicSkills;
  const lookingFor =
    account.lookingFor ?? account.publicLookingFor;
  const cv = account.cv ?? account.publicCv;

  const signals = {
    name: nonEmptyString(account.name),
    city: nonEmptyString(account.city),
    about: nonEmptyString(account.bio || account.about),
    skills: Array.isArray(skills) && skills.length > 0,
    lookingFor:
      Array.isArray(lookingFor) && lookingFor.length > 0,
    cv: Boolean(cv),
    experience:
      Array.isArray(account.experience) &&
      account.experience.length > 0,
    education: hasEducation(account.education),
  };

  return signals;
}

function missingSignals(account) {
  const signals = assessProfile(account);

  return Object.keys(signals).filter((key) => !signals[key]);
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
  success: "#17a34a",
  successBg: "#e7f7ee",
  mutedBg: "#f2f4f7",
};

/* -------------------------------------------------------------------------- */
/* Email template (seekers only, no verification content)                     */
/* -------------------------------------------------------------------------- */

const contentSignals = [
  {
    key: "cv",
    label: "CV / Resume",
    hint: "Upload a PDF so companies can review your background in detail.",
  },
  {
    key: "skills",
    label: "Skills",
    hint: "Add the skills and technologies you want to be found for.",
  },
  {
    key: "experience",
    label: "Work experience",
    hint: "Internships, jobs, freelance work, or relevant projects.",
  },
  {
    key: "education",
    label: "Education",
    hint: "Institution, program, and graduation year.",
  },
  {
    key: "about",
    label: "About you",
    hint: "A short summary of who you are and what you do.",
  },
  {
    key: "lookingFor",
    label: "Job preferences",
    hint: "Desired role, location, and work preference.",
  },
];

function pickCtaLabel(missing) {
  if (missing.includes("cv")) return "Add your CV";
  if (missing.includes("experience")) return "Add your experience";
  if (missing.includes("about")) return "Write your About section";

  return "Complete your profile";
}

function checklistHtml(missing) {
  return contentSignals
    .map((item) => {
      const done = !missing.includes(item.key);

      const iconStyle = done
        ? `background:${emailStyles.successBg};color:${emailStyles.success};`
        : `background:${emailStyles.mutedBg};color:${emailStyles.subtle};`;

      const titleColor = done
        ? emailStyles.subtle
        : emailStyles.text;

      const doneTag = done
        ? `<span style="color:${emailStyles.subtle};font-size:12px;font-weight:600;text-transform:uppercase;">Added</span>`
        : `<span style="color:${emailStyles.accent};font-size:12px;font-weight:700;text-transform:uppercase;">To add</span>`;

      return `
                    <tr>
                      <td style="padding:0 0 12px 0;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td
                              style="
                                background:${emailStyles.card};
                                border:1px solid ${emailStyles.border};
                                border-radius:14px;
                              "
                            >
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                  <td style="padding:16px;" width="48" valign="top">
                                    <div
                                      style="
                                        width:28px;
                                        height:28px;
                                        line-height:28px;
                                        text-align:center;
                                        border-radius:50%;
                                        font-size:14px;
                                        font-weight:800;
                                        ${iconStyle}
                                      "
                                    >
                                      ${done ? "✓" : "○"}
                                    </div>
                                  </td>
                                  <td style="padding:16px 16px 16px 0;" valign="top">
                                    <div
                                      style="
                                        display:flex;
                                        justify-content:space-between;
                                        align-items:center;
                                      "
                                    >
                                      <div style="font-size:14px;line-height:20px;font-weight:700;color:${titleColor};">
                                        ${item.label}
                                      </div>
                                      ${doneTag}
                                    </div>
                                    <div style="margin-top:3px;font-size:13px;line-height:20px;color:${emailStyles.muted};">
                                      ${item.hint}
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>`;
    })
    .join("");
}

function improvementEmail({ name, missing }) {
  const safeName = escapeHtml(name);
  const safeMissing = missing.map(escapeHtml);
  const cta = pickCtaLabel(safeMissing);

  return {
    subject: "A small profile polish can go a long way",
    html: `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Give companies more to evaluate</title>
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
                      PROFILE TIPS
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
                      A stronger profile
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
                      Give companies more<br>
                      to understand, ${safeName}.
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
                      When you apply, a complete profile gives companies
                      more useful information to evaluate you against — and
                      it strengthens the credibility and trust of your
                      application. Before you apply, make sure your profile
                      represents you properly.
                    </p>

                    <!-- Checklist heading -->
                    <div
                      style="
                        margin:28px 0 0 0;
                        font-size:12px;
                        line-height:18px;
                        font-weight:700;
                        color:${emailStyles.subtle};
                        text-transform:uppercase;
                        letter-spacing:0.02em;
                      "
                    >
                      Where your profile stands
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:14px;">
                      ${checklistHtml(missing)}
                    </table>

                    <!-- Portfolio tip (soft, where relevant) -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:14px;">
                      <tr>
                        <td
                          style="
                            background:#f8f9fc;
                            border:1px solid ${emailStyles.border};
                            border-radius:14px;
                            padding:16px;
                          "
                        >
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="48" valign="top">
                                <div
                                  style="
                                    width:28px;
                                    height:28px;
                                    line-height:28px;
                                    text-align:center;
                                    border-radius:50%;
                                    background:${emailStyles.mutedBg};
                                    color:${emailStyles.subtle};
                                    font-size:14px;
                                    font-weight:800;
                                  "
                                >
                                  ➝
                                </div>
                              </td>
                              <td style="padding-left:0;padding-top:3px;" valign="top">
                                <div style="font-size:14px;line-height:20px;font-weight:700;color:${emailStyles.text};">
                                  Portfolio links
                                </div>
                                <div style="margin-top:3px;font-size:13px;line-height:20px;color:${emailStyles.muted};">
                                  If you have projects or a public portfolio, add links where relevant to make your work easy to see.
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
                            ${cta}
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
                      You can update your profile at any time from your
                      Forsa account.
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
                You're receiving this email because you have a verified
                Forsa profile.
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
     * The idempotency marker (profileImprovementEmailSentAt) is
     * written BEFORE the email provider is called. With transactional
     * serialized isolation, only one of several concurrent requests
     * can commit the claim; the others retry, observe the marker, and
     * skip sending. Repeated profile edits therefore never produce
     * more than one email.
     *
     * Eligibility is judged independently from the persisted
     * users/{uid} document using the app's existing 8-signal
     * credibility model (People.jsx). Profiles missing at least 3
     * signals are eligible; stronger profiles are skipped, as are
     * profiles that already triggered the profile-complete email.
     * If the profile is not weak enough, no marker is written and no
     * email is sent.
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

        if (account.profileImprovementEmailSentAt) {
          decision = { status: "alreadySent" };
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

        if (account.emailVerified !== true) {
          decision = { status: "emailNotVerified" };
          return;
        }

        const email = String(account.email || "").trim();

        if (!email) {
          decision = { status: "noEmail" };
          return;
        }

        /*
         * Never send the improvement reminder to a profile that has
         * already reached the app's "complete" state — that would
         * contradict the congratulatory profile-complete email.
         */
        if (account.profileCompleteEmailSentAt) {
          decision = { status: "alreadyComplete" };
          return;
        }

        const missing = missingSignals(account);

        if (missing.length < 3) {
          decision = { status: "notEligible" };
          return;
        }

        const now = new Date();

        transaction.update(userRef, {
          profileImprovementEmailSentAt: now,
          updatedAt: now,
        });

        decision = {
          status: "claim",
          account,
          email,
          missing,
        };
      });
    } catch (transactionError) {
      console.error(
        "Profile improvement email claim failed:",
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

    if (
      decision.status === "notEligible" ||
      decision.status === "alreadyComplete"
    ) {
      return res.status(200).json({
        success: false,
        alreadySent: true,
        reason: decision.status,
      });
    }

    const name = getFirstName(decision.account);

    const { subject, html } = improvementEmail({
      name,
      missing: decision.missing,
    });

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: [decision.email],
      subject,
      html,
    });

    if (error) {
      console.error("Profile improvement email failed:", error);

      return res.status(500).json({
        error: "Failed to send profile improvement email.",
      });
    }

    return res.status(200).json({
      success: true,
      alreadySent: false,
      emailId: data?.id || null,
    });
  } catch (error) {
    console.error("Profile improvement email endpoint failed:", error);

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}