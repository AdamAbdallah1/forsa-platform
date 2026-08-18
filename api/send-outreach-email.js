import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Resend } from "resend";
import {
  initializeApp,
  cert,
  getApps,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/* Firebase Admin */

if (getApps().length === 0) {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    );
  } else {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_JSON."
    );
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      serviceAccount.project_id,
  });
}

const adminAuth = getAuth();

/* Resend */

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY.");
}

if (!process.env.FROM_EMAIL) {
  throw new Error("Missing FROM_EMAIL.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/* Admin */

const ADMIN_EMAIL = "support.forsa@gmail.com";

/* API */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    /* Authenticate Firebase user */

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

    /* Admin-only */

    if (
      decodedToken.email?.toLowerCase() !==
      ADMIN_EMAIL.toLowerCase()
    ) {
      return res.status(403).json({
        error: "Forbidden.",
      });
    }

    /* Validate request */

    const { to, subject, message } = req.body || {};

    if (!to || !subject || !message) {
      return res.status(400).json({
        error: "to, subject, and message are required.",
      });
    }

    const recipient = String(to).trim();
    const emailSubject = String(subject).trim();
    const emailMessage = String(message);

    /* Send through Resend */

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: [recipient],
      subject: emailSubject,
      text: emailMessage,
    });

    if (error) {
      console.error(
        "Outreach email failed:",
        error
      );

      return res.status(500).json({
        error: "Failed to send email.",
      });
    }

    return res.status(200).json({
      success: true,
      emailId: data?.id || null,
    });
  } catch (error) {
    console.error(
      "Outreach endpoint failed:",
      error
    );

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}