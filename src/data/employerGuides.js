/*
 * Forsa Employer Guides — hand-written editorial content for employers.
 *
 * Local data by design: a small curated collection does not need a database,
 * a backend, or authentication. Every guide is readable without signing in,
 * and the collection ships with the bundle so guides work offline after load.
 *
 * Content rules enforced by tests in scripts/tests/employer-guides.test.mjs:
 * - ids unique, categories valid, required fields present
 * - related routes point at real Forsa routes only
 * - no fabricated claims, fake automation, or invented features
 */

export const EMPLOYER_GUIDE_CATEGORIES = [
  {
    id: "getting-started",
    label: "Getting Started",
    description: "Set up your company presence on Forsa.",
  },
  {
    id: "posting",
    label: "Posting Opportunities",
    description: "Create and publish effective opportunity listings.",
  },
  {
    id: "managing",
    label: "Managing Applications",
    description: "Review, evaluate, and move candidates through your pipeline.",
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    description: "Solve common issues and improve your results.",
  },
];

export const EMPLOYER_GUIDES = [
  {
    id: "company-profile",
    title: "Company Profile Setup",
    summary:
      "Complete your public company profile: logo, bio, website, Instagram, location, and contact person.",
    readMinutes: 3,
    category: "getting-started",
    sections: [
      {
        heading: "Add your logo and cover image",
        body:
          "Upload a square logo (at least 200×200 px) and a cover image (16:9 ratio, at least 1200×675 px). These appear on your public company profile and on every opportunity you post.",
      },
      {
        heading: "Write a compelling company bio",
        body:
          "Write 2–4 sentences describing what your company does, who you serve, and what makes your workplace distinctive. Avoid generic mission statements — be specific about your product, mission, or culture.",
      },
      {
        heading: "Add website and Instagram",
        body:
          "Paste your company website URL (e.g., https://company.com) and Instagram handle (e.g., @company). These appear as clickable links on your public profile and help candidates research you.",
      },
      {
        heading: "Set location and contact person",
        body:
          "Enter your city and the name of the hiring contact. This helps candidates understand where the role is based and who they'll hear from.",
      },
      {
        heading: "Verify your company",
        body:
          "Verified companies display a badge and rank higher in search. To request verification, go to your dashboard and click 'Request verification'. You'll need to provide a phone number, website, and proof message.",
      },
    ],
  },
  {
    id: "post-opportunity",
    title: "Posting an Opportunity",
    summary:
      "Step-by-step: title, location, pay, deadline, application method (Forsa or external), description, tags.",
    readMinutes: 4,
    category: "posting",
    sections: [
      {
        heading: "Choose a clear title",
        body:
          "Use a specific, searchable title. Examples: 'Junior Frontend Developer (React)', 'Marketing Intern — Social Media', 'Backend Developer (Node.js/PostgreSQL)'. Avoid vague titles like 'Developer Needed'.",
      },
      {
        heading: "Set location, pay, and deadline",
        body:
          "Enter the city (e.g., Beirut), pay range or 'Competitive', and an application deadline. The deadline is optional but recommended — it creates urgency and automatically closes applications.",
      },
      {
        heading: "Choose application method",
        body:
          "Select 'Apply on Forsa' (applications come through Forsa with CV and answers) or 'Apply externally' (redirect to your URL or email). If external, provide a valid URL or email address.",
      },
      {
        heading: "Add category, type, and tags",
        body:
          "Select a category (e.g., Engineering, Marketing, Design), type (Full-time, Part-time, Internship, Contract), and up to 5 relevant tags (e.g., React, Figma, Python). These power search and matching.",
      },
      {
        heading: "Write description and requirements",
        body:
          "Use the description field for role summary, responsibilities, and day-to-day work. Use the requirements field for must-have skills, experience, and qualifications. Be specific — '2+ years React' is better than 'React experience'.",
      },
      {
        heading: "Publish and manage",
        body:
          "Click 'Post opportunity' to publish. Your listing goes through review (usually within a few hours). Once approved, it's live on /explore and your company profile. You can edit, close, or delete from your Dashboard at any time.",
      },
    ],
  },
  {
    id: "opportunity-description",
    title: "Writing a Clear Opportunity Description",
    summary:
      "Structure: role summary, responsibilities, requirements, benefits, company culture. Tips for attracting quality applicants.",
    readMinutes: 4,
    category: "posting",
    sections: [
      {
        heading: "Start with a one-sentence summary",
        body:
          "Open with a single sentence that answers: what will this person do, and why does it matter? Example: 'Build and maintain our customer-facing React dashboard used by 50,000+ monthly users.'",
      },
      {
        heading: "List 4–6 core responsibilities",
        body:
          "Use bullet points with action verbs. Example: 'Design and ship new React components', 'Collaborate with backend team on API contracts', 'Write unit and integration tests', 'Participate in code reviews'.",
      },
      {
        heading: "Separate must-haves from nice-to-haves",
        body:
          "Label requirements as 'Required' or 'Preferred'. Required: '2+ years React, TypeScript, REST APIs'. Preferred: 'Experience with GraphQL, familiarity with Tailwind CSS'. This helps candidates self-assess honestly.",
      },
      {
        heading: "Describe what you offer",
        body:
          "Include salary range (or 'Competitive'), benefits (health insurance, remote flexibility, learning budget), and what makes your team unique. Candidates decide quickly — make it easy to say yes.",
      },
      {
        heading: "End with a clear call to action",
        body:
          "Tell them exactly what to do: 'Click Apply and share your CV and a brief note on why this role excites you.' Keep it under 200 words total.",
      },
    ],
  },
  {
    id: "opportunity-requirements",
    title: "Writing Clear Requirements",
    summary:
      "Distinguish must-haves from nice-to-haves. Be specific about skills, experience level, education. Avoid bias.",
    readMinutes: 3,
    category: "posting",
    sections: [
      {
        heading: "Separate required from preferred",
        body:
          "Use two clear sections: 'Required' and 'Preferred'. Required = deal-breakers for the role. Preferred = bonus skills that strengthen candidacy. Never mix them.",
      },
      {
        heading: "Be specific about experience",
        body:
          "Instead of 'experience with React', write '2+ years building production React applications'. Instead of 'strong communication', write 'experience presenting technical decisions to non-technical stakeholders'.",
      },
      {
        heading: "Avoid unnecessary degree requirements",
        body:
          "Unless legally required (e.g., medical, engineering licensure), prefer 'Bachelor's degree or equivalent experience'. Many talented candidates in Lebanon are self-taught or have non-traditional paths.",
      },
      {
        heading: "Avoid biased language",
        body:
          "Avoid: 'rockstar', 'ninja', 'young and energetic', 'native speaker'. Use: 'experienced', 'proficient', 'fluent in English/Arabic'. Focus on what the work requires.",
      },
      {
        heading: "Be honest about the work environment",
        body:
          "State clearly: on-site (city), hybrid (days/week), or remote. If hybrid, specify required office days. If remote, mention time zone expectations. Transparency saves everyone time.",
      },
    ],
  },
  {
    id: "review-process",
    title: "Opportunity Review and Verification",
    summary:
      "How Forsa reviews posts: auto-checks, admin review, verification badges. What makes a post 'Verified'.",
    readMinutes: 3,
    category: "posting",
    sections: [
      {
        heading: "Automatic checks",
        body:
          "Every post passes automated checks: required fields complete, no prohibited content, valid deadline, valid application URL/email, pay field filled. Posts failing auto-checks are returned with specific errors.",
      },
      {
        heading: "Admin review",
        body:
          "Approved posts are reviewed by Forsa admins for policy compliance (no discriminatory language, realistic requirements, legitimate company). This usually takes a few hours during business hours.",
      },
      {
        heading: "Verified badge",
        body:
          'A "Verified" badge appears on posts from companies that have completed verification. To get verified, request verification from your dashboard and provide a phone number, website, and proof of legitimacy.',
      },
      {
        heading: "Status meanings",
        body:
          'Statuses: "Live" (approved and visible on Explore), "Pending" (awaiting admin review), "Closed" (manually closed or deadline passed), "Suspended" (flagged for policy review). You can close/reopen from your Dashboard.',
      },
      {
        heading: "If your post is rejected",
        body:
          "You'll receive a notification with the reason. Common reasons: missing pay info, vague requirements, discriminatory language, unverified company. Fix the issue and re-submit — no need to recreate the post.",
      },
    ],
  },
  {
    id: "manage-applications",
    title: "Managing Applications",
    summary:
      "Dashboard: filter by status (pending/shortlisted/interview/accepted/rejected), rank by fit score, bulk actions.",
    readMinutes: 4,
    category: "managing",
    sections: [
      {
        heading: "Application dashboard overview",
        body:
          "Your Applicants page shows all applications across your posts. Use the status filter (All, Pending, Shortlisted, Interview, Accepted, Rejected) and search bar to find specific candidates.",
      },
      {
        heading: "Smart ranking",
        body:
          "Forsa ranks applicants using profile fit (skills, location, goals), CV availability, application answers, and recency. The fit score (0–100%) helps you prioritize. Click the score to see the breakdown.",
      },
      {
        heading: "Reviewing an applicant",
        body:
          "Click an applicant card to see their profile, CV, answers, and fit score breakdown. You can view their public profile, download/view their CV, and read their answers to your custom questions.",
      },
      {
        heading: "Status workflow",
        body:
          "Use the status actions on each card: Shortlist, Accept, Reject, or Invite Interview. Each change notifies the candidate automatically via email and in-app notification.",
      },
      {
        heading: "Communication",
        body:
          "Click 'Open messages' to message the candidate directly through Forsa. All communication stays on the platform for transparency and record-keeping.",
      },
    ],
  },
  {
    id: "application-status",
    title: "Updating Application Status",
    summary:
      "Status flow: Pending → Shortlisted → Interview → Accepted/Rejected. Notifications sent automatically.",
    readMinutes: 3,
    category: "managing",
    sections: [
      {
        heading: "Status flow",
        body:
          "Standard flow: Pending → Shortlisted → Interview → Accepted or Rejected. You can skip steps (e.g., Pending → Accepted) but cannot move backward without canceling an interview first.",
      },
      {
        heading: "Updating status",
        body:
          "Click the status pill on an applicant card or use the 'Update status' button in the applicant card. Select the new status and confirm. The candidate receives an automatic email and in-app notification.",
      },
      {
        heading: "Rejecting with respect",
        body:
          "When rejecting, you can add a private note (not sent to candidate) for your records. The candidate receives a polite, standardized notification. We recommend personalizing the rejection when possible.",
      },
      {
        heading: "Withdrawing an offer",
        body:
          "If you need to withdraw an accepted offer, change the status back to 'Accepted' → 'Rejected' and add a note. The candidate will be notified. We recommend a personal message in addition to the automated notification.",
      },
    ],
  },
  {
    id: "schedule-interview",
    title: "Interview Planning",
    summary:
      "Online (meeting link) or in-person (location + maps link). Auto-sends calendar invite + notification.",
    readMinutes: 3,
    category: "managing",
    sections: [
      {
        heading: "Invite to interview",
        body:
          "From the applicant card, click 'Invite interview'. Choose Online (add meeting link) or In-person (add location name and Google Maps link). Set date and time. The candidate receives an email and in-app notification with a calendar-friendly invite.",
      },
      {
        heading: "Online interviews",
        body:
          "Paste a valid meeting link (Google Meet, Zoom, Teams, Calendly). The candidate receives a calendar-compatible invitation. Forsa does not host video calls — use your preferred platform.",
      },
      {
        heading: "In-person interviews",
        body:
          "Enter the location name (e.g., 'Cedars Tech Office, Downtown Beirut') and a Google Maps link. The candidate receives a map link and address. Forsa does not send calendar files for in-person interviews.",
      },
      {
        heading: "Canceling or rescheduling",
        body:
          "Open the interview modal and click 'Cancel interview'. The candidate is notified and the status reverts to 'Shortlisted'. To reschedule, cancel the current interview and send a new invitation.",
      },
      {
        heading: "Interview notes",
        body:
          "Add private notes (visible only to your hiring team) when scheduling. These are not shared with the candidate.",
      },
    ],
  },
  {
    id: "improve-listing",
    title: "Improving Listing Quality",
    summary:
      "Boost views: add pay range, specific skills, clear deadline, company logo, website/Instagram links.",
    readMinutes: 3,
    category: "posting",
    sections: [
      {
        heading: "Add a pay range",
        body:
          "Posts with a pay range get 2–3× more applications. Even a wide range (e.g., $800–$1,500/month) outperforms 'Competitive' or leaving it blank.",
      },
      {
        heading: "Add 3–5 specific skill tags",
        body:
          "Tags power matching. Add the exact skills you need (e.g., React, PostgreSQL, Figma, Python). Generic tags like 'Programming' don't help matching.",
      },
      {
        heading: "Set a realistic deadline",
        body:
          "A deadline 2–4 weeks out creates urgency without rushing candidates. Avoid 'ASAP' — it signals disorganization.",
      },
      {
        heading: "Complete your company profile",
        body:
          "Posts from verified companies with complete profiles (logo, bio, website, Instagram) get 3× more applications. Candidates research you before applying.",
      },
      {
        heading: "Feature your post",
        body:
          "Featured posts appear at the top of Explore and in the weekly digest. Featured posts are selected by the Forsa team — ensure your listing is complete, verified, and has a pay range.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting Common Issues",
    summary:
      '"No applicants yet" → check pay range, skills, deadline. "Low apply rate" → improve description, add pay.',
    readMinutes: 3,
    category: "troubleshooting",
    sections: [
      {
        heading: "No applicants yet",
        body:
          "Check: pay range included, specific skill tags added, deadline 2+ weeks out, company profile complete, post is 'Live' (not Pending), pay is competitive for the role/location.",
      },
      {
        heading: "Low apply rate (views but few applications)",
        body:
          "Improve the description: add pay range, clarify requirements, list benefits. Ensure requirements are realistic for the pay/level. Add company logo and website link.",
      },
      {
        heading: "Low quality applicants",
        body:
          "Tighten requirements: be specific about years of experience, required skills, education. Add screening questions in the application form. Use 'Preferred' for nice-to-haves.",
      },
      {
        heading: "No one scheduling interviews",
        body:
          "Shortlist candidates first, then use 'Invite interview'. Ensure your interview details (date, time, link/location) are complete. Candidates may hesitate if details are missing.",
      },
      {
        heading: "Post stuck in 'Pending'",
        body:
          "Review usually completes within a few business hours. If it's been >24 hours, check your email for a rejection reason. Common issues: missing pay, vague requirements, unverified company, prohibited content.",
      },
      {
        heading: "CV won't open",
        body:
          "CVs are stored securely. Click 'View CV' to open in a new tab. If it fails, the file may be corrupted — ask the candidate to re-upload via the application message thread.",
      },
    ],
  },
];
export function getGuide(id) {
  return EMPLOYER_GUIDES.find((guide) => guide.id === id) || null;
}