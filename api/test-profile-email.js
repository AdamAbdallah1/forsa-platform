import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import {
  findIncompleteProfiles,
  sendProfileReminder,
} from "./send-profile-reminders.js";

console.log("=== FORSA PROFILE EMAIL TEST ===");

const users = await findIncompleteProfiles({
  respectCooldown: false,
});

if (users.length === 0) {
  console.log("No incomplete finder profiles found.");
  process.exit(0);
}

const testUser = users[0];

console.log("Testing email for:");

console.log({
  uid: testUser.uid,
  name: testUser.name,
  email: testUser.email,
  accountType: testUser.accountType,
  missing: testUser.missing,
});

if (!testUser.email) {
  throw new Error(
    `Test user has no email: ${testUser.uid}`
  );
}

console.log(
  `Sending test email to: ${testUser.email}`
);

const result = await sendProfileReminder(
  testUser.email,
  testUser.name,
  testUser.status
);

console.log("Resend result:");

console.log(result);

if (result.error) {
  throw new Error(
    result.error.message ||
      "Resend failed"
  );
}

console.log("");
console.log("=== TEST EMAIL SENT SUCCESSFULLY ===");
console.log(`To: ${testUser.email}`);
console.log(`Resend ID: ${result.data?.id || "unknown"}`);