/* Public profile projection tests.
 * Pure logic — no Firebase, no network.
 * Run with: npm run test:projection
 * (or: node scripts/tests/public-profile-projection.test.mjs) */
import assert from "node:assert/strict";

const projection = await import(
  new URL("../../src/lib/publicProfileProjection.js", import.meta.url).href
);

const { buildPublicProfile, sanitizeCompanyBio } = projection;

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`FAIL  ${name}: ${e.message}`);
  }
}

// Test sanitizeCompanyBio function
check("sanitizeCompanyBio: normal bio passes through", () => {
  const bio = "We are a great company hiring talented engineers.";
  const result = sanitizeCompanyBio(bio);
  assert.equal(result, bio);
});

check("sanitizeCompanyBio: empty string returns undefined", () => {
  const result = sanitizeCompanyBio("");
  assert.equal(result, undefined);
});

check("sanitizeCompanyBio: whitespace only returns undefined", () => {
  const result = sanitizeCompanyBio("   \n\t  ");
  assert.equal(result, undefined);
});

check("sanitizeCompanyBio: single directory header passes through", () => {
  const bio = "We are Identifier company";
  const result = sanitizeCompanyBio(bio);
  assert.equal(result, "We are Identifier company");
});

check("sanitizeCompanyBio: two directory headers passes through", () => {
  const bio = "We are Identifier and Providers company";
  const result = sanitizeCompanyBio(bio);
  assert.equal(result, "We are Identifier and Providers company");
});

check("sanitizeCompanyBio: three directory headers returns undefined (sanitized)", () => {
  const bio = "Identifier Providers Created";
  const result = sanitizeCompanyBio(bio);
  assert.equal(result, undefined);
});

check("sanitizeCompanyBio: Firebase Auth directory export sanitized", () => {
  const bio = `Identifier\tProviders\tCreated\tSigned In\tUser UID\tActions
user1\tGoogle\t2023-01-01\t2023-06-01\tuid1\tAction`;
  const result = sanitizeCompanyBio(bio);
  assert.equal(result, undefined);
});

check("sanitizeCompanyBio: Firebase Auth directory export with extra text sanitized", () => {
  const bio = `We are a great company.
Identifier\tProviders\tCreated\tSigned In\tUser UID\tActions
user1\tGoogle\t2023-01-01\t2023-06-01\tuid1\tAction`;
  const result = sanitizeCompanyBio(bio);
  assert.equal(result, undefined);
});

check("sanitizeCompanyBio: normal bio with similar words not sanitized", () => {
  const bio = "We identify providers and create solutions. Created with care.";
  const result = sanitizeCompanyBio(bio);
  assert.equal(result, bio);
});

// Test buildPublicProfile with company account
check("buildPublicProfile: company bio included for company account", () => {
  const user = {
    uid: "test-uid",
    accountType: "hiring",
    companyName: "Test Company",
    companyBio: "We hire great engineers.",
  };
  const profile = buildPublicProfile(user);
  assert.equal(profile.companyBio, "We hire great engineers.");
});

check("buildPublicProfile: company bio sanitized for company account", () => {
  const user = {
    uid: "test-uid",
    accountType: "hiring",
    companyName: "Test Company",
    companyBio: "Identifier Providers Created Signed In User UID Actions",
  };
  const profile = buildPublicProfile(user);
  assert.equal(profile.companyBio, undefined);
});

check("buildPublicProfile: company bio not included for seeker account", () => {
  const user = {
    uid: "test-uid",
    accountType: "finder",
    name: "John Doe",
    bio: "Software engineer",
  };
  const profile = buildPublicProfile(user);
  assert.equal(profile.companyBio, undefined);
});

check("buildPublicProfile: company bio with normal text passes", () => {
  const user = {
    uid: "test-uid",
    accountType: "hiring",
    companyName: "Test Company",
    companyBio: "We identify problems and create solutions. We are a trusted provider.",
  };
  const profile = buildPublicProfile(user);
  assert.equal(profile.companyBio, "We identify problems and create solutions. We are a trusted provider.");
});

console.log("");
console.log(`${passed} passed, ${failures.length} failed`);

if (failures.length > 0) {
  console.log("Failures:", failures.join(", "));
  process.exitCode = 1;
}
