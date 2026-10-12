/*
 * Forsa AI career quick guides.
 *
 * Hand-written, static content — always available, even when the AI provider
 * is unreachable or the user's quota is spent. Nothing here is generated,
 * fetched, or personalized. Keep entries short and genuinely useful; prefer
 * a small honest library over a large shallow one.
 */

export const FORSA_AI_GUIDES = [
  {
    id: "cv-basics",
    title: "CV basics",
    summary: "What every Lebanese graduate CV needs — and what to leave out.",
    readMinutes: 3,
    sections: [
      {
        heading: "Keep it to one page",
        body: "Recruiters skim. One page forces you to keep only what matters: contact details, a two-line summary, education, experience, skills. Cut everything that does not help you get an interview.",
      },
      {
        heading: "Lead with outcomes, not duties",
        body: "“Responsible for social media” says little. “Grew a student club page from 200 to 1,500 followers in one semester” says everything. Numbers, even small ones, make claims believable.",
      },
      {
        heading: "Match the language of the posting",
        body: "If the posting asks for “content calendar” experience and you ran one, use those exact words. Recruiters — and their filters — scan for them.",
      },
      {
        heading: "Skip photos, birth dates, and marital status",
        body: "They add nothing to your application and can introduce bias. Name, phone, email, city, and a LinkedIn or portfolio link are enough.",
      },
    ],
  },
  {
    id: "application-message",
    title: "Writing a professional application message",
    summary: "A short structure that works for cover letters and recruiter messages.",
    readMinutes: 3,
    sections: [
      {
        heading: "Use this structure",
        body: "One line on who you are, one line on why this role at this company, two to three lines connecting your strongest relevant facts to what they asked for, and one line asking for the next step.",
      },
      {
        heading: "Name the company and role",
        body: "Generic letters read as mass applications. One specific sentence about the company — a product, a project, a value — changes how the whole letter lands.",
      },
      {
        heading: "Only claim what you can defend",
        body: "Every skill and achievement in the letter should trace back to something real on your CV. Interviewers probe exactly these claims.",
      },
      {
        heading: "End with a clear ask",
        body: "“I would welcome the chance to discuss how I can contribute” beats trailing off. Keep the whole message under 200 words.",
      },
    ],
  },
  {
    id: "interview-checklist",
    title: "Interview preparation checklist",
    summary: "What to do in the days and hours before an interview in Lebanon.",
    readMinutes: 4,
    sections: [
      {
        heading: "Research the employer",
        body: "Know what they do, who their customers are, and one recent development. Prepare two genuine questions — interviewers notice when you have none.",
      },
      {
        heading: "Prepare five stories",
        body: "A challenge you solved, something you learned fast, a disagreement you handled, a result you are proud of, a failure and what it taught you. Most behavioral questions map to one of these.",
      },
      {
        heading: "Rehearse out loud",
        body: "Answers that sound crisp in your head ramble when spoken. Practice your two-minute self-introduction until it fits in two minutes.",
      },
      {
        heading: "Handle logistics early",
        body: "Confirm the location or video link, plan transport with Beirut traffic in mind, dress one notch above the role, and bring a copy of your CV.",
      },
      {
        heading: "Follow up once",
        body: "A short thank-you message within a day is professional. More than one follow-up before they reply is pressure.",
      },
    ],
  },
  {
    id: "beginner-portfolio",
    title: "Building a beginner portfolio",
    summary: "How to show proof of skill when you have little work history.",
    readMinutes: 3,
    sections: [
      {
        heading: "Three small projects beat one big claim",
        body: "Employers trust finished work. Three small, complete, documented projects say more than “proficient in” followed by a list.",
      },
      {
        heading: "Document as you build",
        body: "For each project write one paragraph: the problem, what you did, and the result. That paragraph is half your interview answer already.",
      },
      {
        heading: "Use free, public hosting",
        body: "A GitHub profile, a Behance page, a public Notion doc, or a simple site — pick one place and keep the link on your CV. Dead links are worse than no links.",
      },
      {
        heading: "Include one collaborative piece",
        body: "Freelance gigs, volunteer work, and student projects all count. Working with others signals things solo tutorials cannot.",
      },
    ],
  },
  {
    id: "first-tech-job",
    title: "Preparing for a first tech job",
    summary: "What actually gets junior developers and designers hired.",
    readMinutes: 4,
    sections: [
      {
        heading: "Fundamentals over frameworks",
        body: "Employers hiring juniors test problem-solving and basics far more than the newest framework. Be solid on fundamentals in one stack.",
      },
      {
        heading: "Read and debug other people's code",
        body: "Junior work is mostly reading, fixing, and extending existing code. Practice exactly that: clone a small open-source project and fix a real issue.",
      },
      {
        heading: "Learn to explain your thinking",
        body: "Technical interviews reward clear reasoning, not just correct answers. Narrate your approach before and while you solve.",
      },
      {
        heading: "Apply while learning",
        body: "Do not wait until you feel ready — that day never arrives on its own. Apply to junior roles and internships from your second or third project onward.",
      },
    ],
  },
  {
    id: "organize-job-search",
    title: "Organizing your job search",
    summary: "A simple weekly system so applications don't dissolve into chaos.",
    readMinutes: 3,
    sections: [
      {
        heading: "Set a weekly application target",
        body: "Five thoughtful applications beat twenty copy-pasted ones. Decide your number on Sunday and track it somewhere visible.",
      },
      {
        heading: "Keep one tracking sheet",
        body: "Company, role, date applied, contact, status, follow-up date. A month in, this sheet is the difference between a system and a blur.",
      },
      {
        heading: "Batch the boring parts",
        body: "Dedicate one block per week to finding postings and one to tailoring CVs. Context-switching between hunting and writing wastes both.",
      },
      {
        heading: "Follow up on a schedule",
        body: "One polite follow-up seven to ten days after applying. Then move on mentally — silence is data, not a verdict on you.",
      },
    ],
  },
];

export function getGuide(id) {
  return FORSA_AI_GUIDES.find((guide) => guide.id === id) || null;
}
