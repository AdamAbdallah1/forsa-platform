import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Resend } from "resend";
import { authenticate, db } from "./_lib/forsa-server.js";

/* Resend */

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY.");
}

if (!process.env.FROM_EMAIL) {
  throw new Error("Missing FROM_EMAIL.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/* API */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    /*
     * Authenticate with the shared server helper. It verifies the Bearer
     * ID token and requires email_verified === true.
     */
    const decoded = await authenticate(req);

    const uid = String(decoded.uid || "");

    /*
     * Admin authority: role === "admin" on the user's Firestore document.
     * Capability checks are role-based everywhere; no hardcoded email.
     */
    const userSnap = await db.collection("users").doc(uid).get();

    if (!userSnap.exists || userSnap.data().role !== "admin") {
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

    const status = error.status || 500;

    return res.status(status).json({
      error: error.message || "Internal server error.",
    });
  }
}