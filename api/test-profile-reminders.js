import { findIncompleteProfiles } from "./send-profile-reminders.js";

const users = await findIncompleteProfiles();

console.log("\n=== FORSA PROFILE REMINDER DRY RUN ===\n");
console.log(`Incomplete finder profiles: ${users.length}\n`);

for (const user of users) {
  const missing = [];

  if (!user.status.hasSkills) missing.push("Skills");
  if (!user.status.hasExperience) missing.push("Experience");
  if (!user.status.hasCv) missing.push("CV / Resume");
  if (!user.status.hasPortfolio) missing.push("Portfolio");

  console.log({
    name: user.name,
    email: user.email,
    accountType: user.accountType,
    missing,
  });
}

console.log("\n=== END DRY RUN ===\n");