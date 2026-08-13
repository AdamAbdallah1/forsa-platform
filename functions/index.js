const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const { Resend } = require("resend");
require("dotenv").config();

setGlobalOptions({ maxInstances: 10 });

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendTestEmail = onRequest(async (req, res) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Forsa <support@forsa.digital>",
      to: ["support.forsa@gmail.com"],
      subject: "Forsa email test",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Forsa email system is working.</h2>
          <p>This is a test email sent through Resend.</p>
          <p>Your Forsa email infrastructure is connected successfully.</p>
        </div>
      `,
    });

    if (error) {
      logger.error("Resend error", error);
      return res.status(500).json({
        success: false,
        error,
      });
    }

    logger.info("Email sent", data);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error("Email function failed", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});