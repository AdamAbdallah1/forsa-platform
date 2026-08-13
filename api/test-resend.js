import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const result = await resend.emails.send({
  from: `Forsa <${process.env.FROM_EMAIL}>`,
  to: ["support.forsa@gmail.com"],
  subject: "Forsa email system test",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>Forsa email system is working</h2>

      <p>This is a test email from the Forsa platform.</p>

      <p>
        If you're seeing this, your Resend + forsa.digital setup is working.
      </p>

      <p>— The Forsa Team</p>
    </div>
  `,
});

console.log(JSON.stringify(result, null, 2));
