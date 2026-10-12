/*
 * Career Guides library — hand-written editorial content.
 *
 * Local data by design: a small curated collection does not need a database,
 * a backend, or authentication. Every article is readable without signing in,
 * and the collection ships with the bundle so guides work offline after load.
 *
 * Content rules enforced by tests in /tmp/career-guides-test.mjs:
 * - slugs unique, categories valid, required fields present
 * - related slugs exist and never include self
 * - nextStep links point at real Forsa routes only
 * - no fabricated authors, metrics, statistics, or credentials
 */

export const GUIDE_CATEGORIES = [
  {
    id: "cv",
    label: "CV & Resume",
    description: "Present your experience clearly, even when it's short.",
  },
  {
    id: "interviews",
    label: "Interviews",
    description: "Walk in prepared and answer with confidence.",
  },
  {
    id: "job-search",
    label: "Job Search",
    description: "Find openings and apply with purpose.",
  },
  {
    id: "career-growth",
    label: "Career Development",
    description: "Plan the next steps of your working life.",
  },
  {
    id: "skills",
    label: "Technical Skills",
    description: "Build proof of what you can do.",
  },
  {
    id: "workplace",
    label: "Workplace Skills",
    description: "Thrive once you're through the door.",
  },
];

export const CAREER_GUIDES = [
  {
    slug: "build-cv-no-experience",
    cover: "/guides/build-cv-no-experience.svg",
    coverAlt: "Illustration of a CV document stamped with a purple approval seal",
    title: "How to Build a CV With Little or No Work Experience",
    summary:
      "No internships yet? Your education, projects, and volunteer work count — here's how to present them like a professional.",
    intro: [
      "Almost every student and recent graduate faces the same blank-page problem: employers ask for experience, but nobody will give you the first chance to get it. The good news is that hiring managers reading junior CVs are not actually looking for a long job history. They are looking for evidence that you can learn, finish things, and communicate clearly.",
      "This guide shows you how to build a one-page CV from what you already have — coursework, projects, volunteering, and part-time work — and how to phrase each item so it earns you an interview.",
    ],
    category: "cv",
    featured: true,
    publishedAt: "2026-10-12",
    sections: [
      {
        heading: "Start with structure, not content",
        blocks: [
          {
            type: "paragraph",
            text: "A junior CV has five blocks, in this order: contact details, a two-line summary, education, experience (broadly defined), and skills. One page, clean font, generous white space. Recruiters spend seconds on a first scan, and structure is what lets the important parts survive that scan.",
          },
          {
            type: "checklist",
            items: [
              "Name, phone, email, city, and one link (LinkedIn or portfolio)",
              "Two-line summary naming your field and what you're looking for",
              "Education with graduation year and relevant coursework",
              "Experience section including projects, volunteering, and part-time work",
              "Skills grouped by category, not a random list",
            ],
          },
        ],
      },
      {
        heading: "Redefine what counts as experience",
        blocks: [
          {
            type: "paragraph",
            text: "If you have never held a formal job, your experience section should still exist — it just draws from different sources. A class project you finished, a student club you helped run, freelance gigs, family business help, and volunteer shifts all demonstrate reliability and initiative, which is exactly what entry-level hiring screens for.",
          },
          {
            type: "example",
            label: "Weak vs. strong",
            text: "Weak: “Helped with social media for a club.” Strong: “Ran Instagram for the AUB entrepreneurship club (2024–2025): planned a weekly content calendar and grew followers from 200 to 1,500.” Same reality, completely different signal.",
          },
        ],
      },
      {
        heading: "Write bullets that prove, not claim",
        blocks: [
          {
            type: "paragraph",
            text: "Every bullet should follow one pattern: what you did, plus the outcome or scale. Start bullets with strong verbs — built, organized, wrote, taught, fixed, coordinated — and attach a number wherever one honestly exists: people reached, hours volunteered, grades earned, items delivered.",
          },
          {
            type: "list",
            items: [
              "One bullet per achievement, not one paragraph per role.",
              "Numbers beat adjectives: prefer “tutored 6 students weekly” over “excellent tutor”.",
              "If you truly have no number, describe scope instead: “managed inventory for a two-person shop”.",
            ],
          },
        ],
      },
      {
        heading: "Tailor the top third for each application",
        blocks: [
          {
            type: "paragraph",
            text: "You don't need a new CV for every job — you need a tailored top third. Rewrite the two-line summary to mirror the posting's language, and reorder bullets so the most relevant experience appears first. When a posting asks for “content calendar” experience and you ran one, use those exact words: recruiters and their filters scan for them.",
          },
        ],
      },
      {
        heading: "Leave these things out",
        blocks: [
          {
            type: "paragraph",
            text: "Photos, birth dates, marital status, and national ID numbers add nothing to your application and can introduce bias. Objectives like “seeking a challenging position” waste the most valuable space on the page — your two-line summary already does that job with specifics.",
          },
          {
            type: "callout",
            title: "Before you send it",
            text: "Read the whole CV out loud once. Fix every typo, check every date, and confirm your phone number is current. Then ask one employed friend to skim it for ten seconds and tell you what stuck — that's your real first impression.",
          },
        ],
      },
    ],
    nextStep: { label: "Get CV feedback from Forsa AI", to: "/ai?tool=cv" },
    related: ["describe-projects-honestly", "professional-application-message", "build-portfolio"],
  },
  {
    slug: "professional-application-message",
    cover: "/guides/professional-application-message.svg",
    coverAlt: "Illustration of an envelope with a letter and a gold wax seal",
    title: "How to Write a Professional Application Message",
    summary:
      "A short, reusable structure for cover letters and recruiter messages that actually gets read.",
    intro: [
      "Most application messages fail in the first three lines: they're generic, they're about what the applicant wants, and they give the reader no reason to continue. Recruiters and hiring managers respond to messages that are specific, brief, and clearly written for them — not blasted to fifty companies.",
      "This guide gives you a structure that works for cover letters, LinkedIn messages, and email applications alike, plus the mistakes that quietly disqualify good candidates.",
    ],
    category: "job-search",
    featured: false,
    publishedAt: "2026-10-12",
    sections: [
      {
        heading: "The four-part structure",
        blocks: [
          {
            type: "paragraph",
            text: "Every strong application message has the same skeleton. One line on who you are, one line on why this role at this company, two to three lines connecting your strongest relevant facts to what they asked for, and one line asking for the next step. Nothing more.",
          },
          {
            type: "example",
            label: "Example opening",
            text: "“I'm a business graduate from LAU with six months of social media internship experience. I'm applying for the Junior Marketing Associate role because your team's recent campus campaign is exactly the kind of work I want to do full-time.” Two sentences, and the reader already knows who you are and why you're writing.",
          },
        ],
      },
      {
        heading: "Name the company and the role",
        blocks: [
          {
            type: "paragraph",
            text: "One specific sentence about the employer — a product, a project, a value they state publicly — transforms how the whole message lands. It proves this application wasn't mass-produced, and it gives the reader something to respond to beyond your CV.",
          },
        ],
      },
      {
        heading: "Connect, don't repeat, your CV",
        blocks: [
          {
            type: "paragraph",
            text: "The message is not a second CV. Pick the two or three facts from your background that map directly onto the posting's requirements, and explain the connection in plain language. If they asked for client communication and you handled walk-in customers at a family shop, say exactly that.",
          },
          {
            type: "list",
            items: [
              "Mirror the posting's vocabulary for skills you genuinely have.",
              "Quantify one achievement to make the message memorable.",
              "Keep the whole message under 200 words — brevity signals respect for their time.",
            ],
          },
        ],
      },
      {
        heading: "Mistakes that quietly disqualify you",
        blocks: [
          {
            type: "checklist",
            items: [
              "Wrong company name or role title — always re-read before sending",
              "“Dear Sir/Madam” when a name is findable — spend the two minutes",
              "Attachments with vague names — use Firstname-Lastname-CV.pdf",
              "Apologizing for lack of experience — frame what you bring instead",
              "No clear ask at the end — close with the next step you want",
            ],
          },
        ],
      },
      {
        heading: "Follow up once, then move on",
        blocks: [
          {
            type: "paragraph",
            text: "If you haven't heard back in seven to ten days, one short, polite follow-up is professional. Reference your original message, restate your interest in one line, and stop there. Repeated follow-ups don't create interest — they spend goodwill you may need later.",
          },
        ],
      },
    ],
    nextStep: { label: "Draft your message with Forsa AI", to: "/ai?tool=application" },
    related: ["build-cv-no-experience", "evaluate-job-opportunity", "find-first-internship"],
  },
  {
    slug: "first-job-interview",
    cover: "/guides/first-job-interview.svg",
    coverAlt: "Illustration of two overlapping conversation bubbles",
    title: "How to Prepare for Your First Job Interview",
    summary:
      "Research, stories, rehearsal, and logistics — a complete preparation plan for first-time interviewees.",
    intro: [
      "A first interview feels high-stakes because everything about it is unfamiliar — but interviewers evaluating juniors are mostly checking three things: can this person communicate, did they prepare, and do they actually want this role? All three are entirely within your control.",
      "This guide walks through a preparation routine you can reuse for every interview: what to research, which stories to prepare, how to rehearse, and how to handle the day itself.",
    ],
    category: "interviews",
    featured: false,
    publishedAt: "2026-10-12",
    sections: [
      {
        heading: "Research the employer properly",
        blocks: [
          {
            type: "paragraph",
            text: "Know what the company does, who its customers are, and one recent development — a launch, an expansion, a campaign. Then prepare two genuine questions of your own. Interviewers consistently notice when candidates have none, and it reads as indifference even when it isn't.",
          },
          {
            type: "example",
            label: "Good questions to bring",
            text: "“What does success look like in the first three months of this role?” and “What is something the team is trying to improve right now?” Both show you think like someone who already works there.",
          },
        ],
      },
      {
        heading: "Prepare five stories, not fifty answers",
        blocks: [
          {
            type: "paragraph",
            text: "You cannot predict every question, but almost every behavioral question maps to one of five stories: a challenge you solved, something you learned fast, a disagreement you handled well, a result you're proud of, and a failure plus what it taught you. Write each as three bullet points — situation, action, outcome — and practice telling them in under two minutes each.",
          },
        ],
      },
      {
        heading: "Rehearse out loud, not in your head",
        blocks: [
          {
            type: "paragraph",
            text: "Answers that sound crisp in your head ramble when spoken. Say your two-minute self-introduction aloud until it genuinely fits in two minutes, and do at least one full mock round with a friend playing interviewer — including the awkward silences.",
          },
          {
            type: "list",
            items: [
              "Time your self-introduction: two minutes, no more.",
              "Practice the salary question with a range-free deflection: ask about their budgeted range first.",
              "Prepare an honest answer for “what's your weakness” tied to something you're actively improving.",
            ],
          },
        ],
      },
      {
        heading: "Handle logistics the day before",
        blocks: [
          {
            type: "paragraph",
            text: "Confirm the location or video link, plan transport with Beirut traffic in mind, and lay out clothes one notch above the role's daily dress. Bring a printed CV even for digital-first companies — it signals preparation and saves the interview if their screen fails.",
          },
        ],
      },
      {
        heading: "After the interview",
        blocks: [
          {
            type: "paragraph",
            text: "Send one short thank-you message within a day, referencing something specific you discussed. Then write down every question they asked while it's fresh — that list becomes your preparation file for the next interview, whether with them or elsewhere.",
          },
          {
            type: "callout",
            title: "If it goes badly",
            text: "One weak answer rarely decides anything; interviewers evaluate the whole conversation. Don't apologize excessively mid-interview — recover, finish strong, and treat the debrief notes as the real prize.",
          },
        ],
      },
    ],
    nextStep: { label: "Practice with Forsa AI interviews", to: "/ai?tool=interview" },
    related: ["professional-application-message", "build-cv-no-experience", "organize-job-search"],
  },
  {
    slug: "build-portfolio",
    cover: "/guides/build-portfolio.svg",
    coverAlt: "Illustration of four portfolio tiles, one highlighted in purple",
    title: "How to Build a Portfolio That Demonstrates Your Skills",
    summary:
      "Three small finished projects beat a long list of claims. Here's how to build proof employers trust.",
    intro: [
      "For designers, developers, writers, marketers, and creators of all kinds, a portfolio does what a CV cannot: it shows finished work. Employers hiring juniors discount self-assessed skill lists heavily — but they trust artifacts they can click, read, or watch.",
      "You don't need client work to have a portfolio. This guide shows how to build one from scratch with projects, documentation, and public links that survive scrutiny.",
    ],
    category: "skills",
    featured: false,
    publishedAt: "2026-10-12",
    sections: [
      {
        heading: "Three small finished projects",
        blocks: [
          {
            type: "paragraph",
            text: "Scope beats ambition. Three small, complete, documented projects say more than one grand unfinished one or a list of tools you once opened. “Complete” means someone else can view it, understand what it is, and see that it works — a live link, screenshots, or a short demo video all qualify.",
          },
        ],
      },
      {
        heading: "Document each project the same way",
        blocks: [
          {
            type: "paragraph",
            text: "For every project, write one short paragraph covering three things: the problem, what you personally did, and the result. That paragraph does double duty — it sits in your portfolio and becomes half of your interview answer when asked about the work.",
          },
          {
            type: "example",
            label: "Example project note",
            text: "“Redesigned the ordering flow of a mock food-delivery app as a UX exercise. I ran five usability tests with classmates, cut the checkout from six steps to three, and documented the before/after in Figma.” Problem, action, result — in three lines.",
          },
        ],
      },
      {
        heading: "Host everything in one public place",
        blocks: [
          {
            type: "paragraph",
            text: "Pick one home base and keep it current: GitHub for code, Behance for design, a public Notion page or simple site for everything else. Put that single link on your CV. One maintained link beats five stale ones — dead links actively damage trust, so check them before every application round.",
          },
        ],
      },
      {
        heading: "Include one collaborative piece",
        blocks: [
          {
            type: "paragraph",
            text: "Solo tutorials prove you can follow instructions; collaboration proves you can work. A freelance gig, volunteer project, student team effort, or open-source contribution all count. Be precise about your own contribution — “built the payment form in a team of three” beats a vague team credit.",
          },
          {
            type: "list",
            items: [
              "Student club websites and event materials",
              "Volunteer design or social media for an NGO",
              "Small paid gigs for family businesses or shops",
              "Documented open-source fixes, however small",
            ],
          },
        ],
      },
      {
        heading: "Keep it alive with almost no effort",
        blocks: [
          {
            type: "paragraph",
            text: "A portfolio rots fast. Once a month, spend thirty minutes: remove anything outdated, fix any broken link, and add your newest piece at the top. Tie the habit to your application routine so the two never drift apart.",
          },
          {
            type: "callout",
            title: "Quality bar",
            text: "Before adding anything, ask: would I be comfortable walking an interviewer through this for five minutes? If not, it's practice material, not portfolio material — keep practicing, then publish.",
          },
        ],
      },
    ],
    nextStep: { label: "See what skills employers want", to: "/explore" },
    related: ["describe-projects-honestly", "first-tech-job", "build-cv-no-experience"],
  },
  {
    slug: "find-first-internship",
    cover: "/guides/find-first-internship.svg",
    coverAlt: "Illustration of a magnifying glass finding a highlighted opportunity among dots",
    title: "How to Find Your First Internship or Entry-Level Role",
    summary:
      "Where junior openings actually appear, how to approach employers directly, and how to keep momentum.",
    intro: [
      "Entry-level openings rarely behave like senior ones: many are filled through university channels, direct outreach, and timing rather than big job boards. Understanding where junior roles surface — and how to position yourself for them — matters more than sending the highest volume of applications.",
      "This guide covers the channels worth your time, how to approach employers who aren't advertising, and a weekly routine that keeps your search moving.",
    ],
    category: "job-search",
    featured: false,
    publishedAt: "2026-10-12",
    sections: [
      {
        heading: "Start where juniors are actually hired",
        blocks: [
          {
            type: "paragraph",
            text: "University career offices, department mailing lists, alumni groups, and student communities surface internships that never reach public boards. Tell professors and teaching assistants what you're looking for — referrals from someone an employer trusts skip the entire screening queue.",
          },
          {
            type: "list",
            items: [
              "Your university's career office and job mailing lists",
              "Department groups, alumni networks, and student communities",
              "Forsa's Explore page, filtered for internships and entry-level roles",
              "Company career pages for businesses you genuinely admire",
            ],
          },
        ],
      },
      {
        heading: "Approach employers who aren't advertising",
        blocks: [
          {
            type: "paragraph",
            text: "Small companies and startups often need help long before they post a role. A short, specific message — who you are, one relevant skill with proof, and a concrete offer like a two-week trial project — gets read far more often than a generic CV blast. Target ten such employers, not a hundred.",
          },
          {
            type: "example",
            label: "What to write",
            text: "“I'm a final-year design student. I redesigned a checkout flow as a class project [link]. I'd love to do a small trial task for your team — no strings attached.” Specific, low-risk for them, proof attached.",
          },
        ],
      },
      {
        heading: "Treat unpaid work with clear eyes",
        blocks: [
          {
            type: "paragraph",
            text: "Some internships in Lebanon are unpaid or stipend-only. That's a personal decision, but make it deliberately: set a time limit, define what skills you'll leave with, and confirm you'll get a reference. Never accept vagueness about duration or duties — legitimate hosts answer those questions directly.",
          },
        ],
      },
      {
        heading: "Run a weekly routine",
        blocks: [
          {
            type: "paragraph",
            text: "Motivation fades; routines don't. Fix two weekly blocks: one for finding and shortlisting openings, one for tailoring applications. End each week by updating a simple tracker — company, role, date, status — so next week starts with facts instead of fog.",
          },
          {
            type: "checklist",
            items: [
              "Review new internship and entry-level postings",
              "Send tailored applications, not copy-pasted ones",
              "Follow up on last week's applications once",
              "Add one new proof of skill to your portfolio",
            ],
          },
        ],
      },
      {
        heading: "Use rejections as data",
        blocks: [
          {
            type: "paragraph",
            text: "Silence after twenty applications usually means a targeting or presentation problem, not a worth problem. If nothing lands within a month, change one variable: narrower targeting, a rewritten summary, or a stronger portfolio piece — then measure again.",
          },
          {
            type: "callout",
            title: "Keep perspective",
            text: "Entry-level hiring is seasonal and lumpy. A quiet fortnight often reflects timing, not talent. The routine matters more than any single week.",
          },
        ],
      },
    ],
    nextStep: { label: "Browse entry-level openings", to: "/explore" },
    related: ["organize-job-search", "evaluate-job-opportunity", "professional-application-message"],
  },
  {
    slug: "describe-projects-honestly",
    cover: "/guides/describe-projects-honestly.svg",
    coverAlt: "Illustration of a shield carrying a check mark",
    title: "How to Describe Projects and Skills Honestly on Your CV",
    summary:
      "The line between strong framing and fabrication — and how to stay firmly on the right side of it.",
    intro: [
      "There's a healthy skill every job seeker needs: presenting real work in its best light. And there's a line past it — inventing experience, inflating titles, or claiming skills you can't demonstrate — that ends careers when discovered, because it always is, usually in the interview itself.",
      "This guide shows how to frame your genuine work powerfully without ever crossing into fabrication, and how to handle the gaps you're tempted to fill.",
    ],
    category: "cv",
    featured: false,
    publishedAt: "2026-10-12",
    sections: [
      {
        heading: "Strong framing vs. fabrication",
        blocks: [
          {
            type: "paragraph",
            text: "Framing selects and emphasizes true facts: choosing the most relevant project, quantifying real outcomes, using confident verbs. Fabrication adds facts that aren't there: months you didn't work, tools you never touched, degrees you didn't earn. The test is simple — could you defend every word for five minutes in an interview?",
          },
          {
            type: "example",
            label: "Same project, three versions",
            text: "Fabrication: “Led a team of developers building e-commerce platforms.” Risky: “E-commerce developer with extensive experience.” Honest and strong: “Built a two-page storefront for a family shop using HTML and CSS; orders now arrive by WhatsApp instead of phone.”",
          },
        ],
      },
      {
        heading: "Handle gaps by filling them, not hiding them",
        blocks: [
          {
            type: "paragraph",
            text: "A six-month gap with nothing to show invites suspicion; the same gap with one finished course and one small project reads as initiative. If your history has holes, the highest-return move is to create one recent, verifiable proof of skill — not to stretch dates and hope nobody checks. References get called more often than juniors expect.",
          },
        ],
      },
      {
        heading: "Calibrate skill levels truthfully",
        blocks: [
          {
            type: "paragraph",
            text: "Skill bars and percentages (“Photoshop: 90%”) mean nothing and invite ridicule. Describe proficiency in words tied to evidence instead: what you built with the tool, how long you used it, what you can do unsupervised today. “Built three complete sites with React over eight months” tells an employer exactly where you stand.",
          },
          {
            type: "list",
            items: [
              "Name the tool, the duration, and one finished output.",
              "Separate “used in coursework” from “used in production”.",
              "Drop anything you couldn't demo tomorrow — it only creates interview traps.",
            ],
          },
        ],
      },
      {
        heading: "Titles, dates, and degrees",
        blocks: [
          {
            type: "paragraph",
            text: "Use the title you actually held, with a clarifying scope if needed: “Social media volunteer” beats an invented “Marketing Manager”. Keep dates to month and year, never reorder overlapping roles to hide gaps, and list degrees exactly as awarded — including “in progress” where that's the truth.",
          },
          {
            type: "callout",
            title: "The background-check reality",
            text: "Employers verify education and employment far more routinely than applicants assume, and discrepancies — even small ones — read as dishonesty about everything else. Accuracy is not just ethical; it's strategic.",
          },
        ],
      },
      {
        heading: "When you're unsure, disclose",
        blocks: [
          {
            type: "paragraph",
            text: "Freelance work for a relative, a paused degree, a role that ended badly — these feel risky to state plainly, but hedged phrasing that unravels under one question is far riskier. State the fact briefly, then pivot to what you delivered or learned. Interviewers reward this candor far more than applicants expect.",
          },
        ],
      },
    ],
    nextStep: { label: "Review your wording with Forsa AI", to: "/ai?tool=cv" },
    related: ["build-cv-no-experience", "build-portfolio", "first-job-interview"],
  },
  {
    slug: "evaluate-job-opportunity",
    cover: "/guides/evaluate-job-opportunity.svg",
    coverAlt: "Illustration of a balanced scale for weighing opportunities",
    title: "How to Evaluate a Job Opportunity Before Applying",
    summary:
      "A practical checklist for judging postings, employers, and offers — so you apply with eyes open.",
    intro: [
      "Not every opening deserves your application, and a bad first job costs more than a slow search. Entry-level seekers often feel they can't afford to be selective — but a short evaluation routine before applying saves you from exploitative postings, phantom roles, and mismatches you'd discover too late.",
      "This guide gives you that routine: how to read a posting critically, check an employer, and spot the warning signs that matter most for juniors.",
    ],
    category: "job-search",
    featured: false,
    publishedAt: "2026-10-12",
    sections: [
      {
        heading: "Read the posting like a contract",
        blocks: [
          {
            type: "paragraph",
            text: "A serious posting names concrete duties, required skills, working arrangement, and how to apply. Vagueness is information: “various tasks,” no named contact, and pressure to decide fast are all reasons to pause, not rush.",
          },
          {
            type: "checklist",
            items: [
              "Duties described specifically, not just “assist the team”",
              "Skills listed that match the role's actual work",
              "Clear application channel (email, form, or platform)",
              "No request for money, “training fees,” or personal documents upfront",
            ],
          },
        ],
      },
      {
        heading: "Check the employer in ten minutes",
        blocks: [
          {
            type: "paragraph",
            text: "Look for a real web presence, a physical or clearly stated location, named people, and a plausible history. Search the company name plus words like “review” or “scam” — absence of information about an employer asking for your data is itself a finding.",
          },
          {
            type: "list",
            items: [
              "Website, social profiles, and named team members or founders",
              "Consistent story across their postings and profiles",
              "Other employees or ex-employees you could ask about",
            ],
          },
        ],
      },
      {
        heading: "Warning signs for juniors",
        blocks: [
          {
            type: "paragraph",
            text: "Entry-level seekers are targeted precisely because they're eager. Treat any of these as a hard stop until explained convincingly: requests for payment at any stage, interviews held only over chat apps with no video or visit, salaries far above market with no stated duties, and pressure to sign or pay immediately.",
          },
          {
            type: "callout",
            title: "Never pay to apply",
            text: "No legitimate employer charges application, training, or equipment fees. Any such request — however small or plausibly explained — means walking away and reporting the posting.",
          },
        ],
      },
      {
        heading: "Weigh fit, not just prestige",
        blocks: [
          {
            type: "paragraph",
            text: "A famous name with no mentorship and chaotic management teaches less than a small outfit with a patient supervisor. Ask what you'll learn, who you'll learn it from, and what your first month looks like. For a first role, the quality of supervision outweighs almost everything else.",
          },
        ],
      },
      {
        heading: "Decide with a simple scorecard",
        blocks: [
          {
            type: "paragraph",
            text: "After the checks above, score each opportunity on four questions: Is it legitimate? Will I learn marketable skills? Is the arrangement (pay, hours, location) workable for me? Am I genuinely interested in the work? Two or more weak answers means keep looking — applying anyway just spends energy better used elsewhere.",
          },
        ],
      },
    ],
    nextStep: { label: "Browse verified openings", to: "/explore" },
    related: ["find-first-internship", "organize-job-search", "professional-application-message"],
  },
  {
    slug: "learning-roadmap",
    cover: "/guides/learning-roadmap.svg",
    coverAlt: "Illustration of a dotted learning path with milestones leading to a flag",
    title: "How to Build a Practical Learning Roadmap for Your Career",
    summary:
      "Turn “I need to learn everything” into a sequenced plan with milestones you can actually finish.",
    intro: [
      "The most common career-planning failure isn't laziness — it's trying to learn everything at once and finishing nothing. Tutorials pile up, motivation spikes and crashes, and six months later the skill list looks the same.",
      "A roadmap fixes this by turning a vague ambition into a short sequence of milestones, each ending in finished, demonstrable work. This guide shows how to build one sized to your real weekly hours.",
    ],
    category: "career-growth",
    featured: false,
    publishedAt: "2026-10-12",
    sections: [
      {
        heading: "Start from the role, not the syllabus",
        blocks: [
          {
            type: "paragraph",
            text: "Pick one target role and work backward. Read five real postings for it and list the skills that repeat — that list, not a generic curriculum, is your syllabus. Everything you learn should answer the question: does this get me closer to what those postings ask for?",
          },
        ],
      },
      {
        heading: "Sequence three milestones",
        blocks: [
          {
            type: "paragraph",
            text: "Three milestones beat twelve. Each milestone should take two to six weeks at your real pace and end with something finished: a small project, a certification of completion, a published piece. Name each milestone after its deliverable, not its topic — “deployed portfolio site” motivates more than “learn CSS”.",
          },
          {
            type: "example",
            label: "Example sequence",
            text: "Milestone 1: a one-page personal site (HTML/CSS fundamentals). Milestone 2: an interactive project with real data (JavaScript + an API). Milestone 3: a small client-style project with documentation (workflow + communication). Each one is interview material the day it ships.",
          },
        ],
      },
      {
        heading: "Budget hours honestly",
        blocks: [
          {
            type: "paragraph",
            text: "Take the hours you truly have — after university, work, family, and rest — and plan for seventy percent of them. Life in Lebanon is unpredictable: power cuts, traffic, and obligations eat schedules. A plan that survives a bad week is a plan you'll still be following in month three.",
          },
          {
            type: "list",
            items: [
              "Fix two recurring weekly blocks rather than “whenever I can”.",
              "One rest day per week with zero learning guilt.",
              "Review progress monthly and adjust the plan, don't abandon it.",
            ],
          },
        ],
      },
      {
        heading: "Learn in public, lightly",
        blocks: [
          {
            type: "paragraph",
            text: "You don't need to become a content creator — but short public notes on what you built (“shipped X, learned Y”) compound into visibility and force you to articulate your work. A monthly post on LinkedIn or a short thread is enough to start.",
          },
        ],
      },
      {
        heading: "Know when you're job-ready",
        blocks: [
          {
            type: "paragraph",
            text: "You're ready to apply seriously when three things are true: you can explain your last two projects without notes, you can complete a small unfamiliar task in your stack within a day or two, and your CV and portfolio reflect both. Don't wait for confidence — it arrives after the first interviews, not before.",
          },
          {
            type: "callout",
            title: "A note on timelines",
            text: "Anyone promising you a job in a fixed number of weeks is selling something. Progress depends on your hours, your starting point, and the market — all of which differ. Judge your plan by finished milestones, not calendar dates.",
          },
        ],
      },
    ],
    nextStep: { label: "Build your roadmap with Forsa AI", to: "/ai?tool=roadmap" },
    related: ["build-portfolio", "first-tech-job", "find-first-internship"],
  },
  {
    slug: "first-tech-job",
    cover: "/guides/first-tech-job.svg",
    coverAlt: "Illustration of code brackets with a cursor over a dot grid",
    title: "What Actually Gets Junior Developers and Designers Hired",
    summary:
      "Fundamentals, debugging practice, and clear explanations matter more than the newest framework.",
    intro: [
      "Junior tech hiring rewards a narrower set of abilities than most learners expect. Employers aren't looking for encyclopedic framework knowledge — they're looking for someone who can read existing code, fix real problems, and explain their thinking without hand-waving.",
      "This guide distills what actually moves the needle for first tech roles, so you can aim your limited learning hours where they count.",
    ],
    category: "skills",
    featured: false,
    publishedAt: "2026-10-12",
    sections: [
      {
        heading: "Fundamentals over frameworks",
        blocks: [
          {
            type: "paragraph",
            text: "Employers hiring juniors test problem-solving and basics far more than the newest framework. Be solid on fundamentals in one stack — how the language really works, how data moves, how to read an error — before chasing a second framework.",
          },
        ],
      },
      {
        heading: "Practice reading and debugging, not just building",
        blocks: [
          {
            type: "paragraph",
            text: "Junior work is mostly reading, fixing, and extending existing code. Practice exactly that: clone a small open-source project, reproduce a real issue, and fix it. Document the process — that write-up doubles as portfolio material and interview evidence.",
          },
          {
            type: "list",
            items: [
              "Fix one real issue in a small open-source project.",
              "Reproduce bugs deliberately before fixing them.",
              "Read error messages fully instead of pasting them into search first.",
            ],
          },
        ],
      },
      {
        heading: "Learn to explain your thinking",
        blocks: [
          {
            type: "paragraph",
            text: "Technical interviews reward clear reasoning, not just correct answers. Narrate your approach before and while you solve: what you're assuming, what you'll try first, and how you'll check the result. Interviewers score the narration as much as the solution.",
          },
        ],
      },
      {
        heading: "Designers: process beats polish",
        blocks: [
          {
            type: "paragraph",
            text: "If you're aiming at design roles, show your process, not just final screens: the brief, two explored directions, why you chose one, and what you'd iterate next. Hiring designers look for judgment under constraints, and process shots are where judgment is visible.",
          },
          {
            type: "example",
            label: "What to include per project",
            text: "Brief in one line, two direction sketches, the final piece, and three lines on what you'd change with more time. Four projects presented this way outperform ten bare screenshots.",
          },
        ],
      },
      {
        heading: "Apply while learning",
        blocks: [
          {
            type: "paragraph",
            text: "Do not wait until you feel ready — that day never arrives on its own. Apply to junior roles and internships from your second or third project onward. Early applications are practice with upside: real interview questions calibrate your learning better than any curriculum.",
          },
          {
            type: "callout",
            title: "Rejection is calibration",
            text: "Treat each rejection as data about which skill to build next, not as a verdict. Candidates who iterate on feedback compress years of wandering into months of progress.",
          },
        ],
      },
    ],
    nextStep: { label: "See what skills employers want", to: "/explore" },
    related: ["build-portfolio", "learning-roadmap", "first-job-interview"],
  },
  {
    slug: "first-weeks-new-job",
    cover: "/guides/first-weeks-new-job.svg",
    coverAlt: "Illustration of a doorway with a rising sun and ascending steps",
    title: "How to Succeed in Your First Weeks at a New Job",
    summary:
      "Listen more than you speak, learn the unspoken rules, and become the reliable newcomer teams want to keep.",
    intro: [
      "Landing the job is only halftime. The first weeks set how colleagues perceive you for months: as someone reliable and easy to work with, or as someone who needs managing. The good news is that succeeding early has little to do with brilliance and everything to do with a handful of deliberate habits.",
      "This guide covers what to do — and what to avoid — from day one through your first month.",
    ],
    category: "workplace",
    featured: false,
    publishedAt: "2026-10-12",
    sections: [
      {
        heading: "Listen more than you speak",
        blocks: [
          {
            type: "paragraph",
            text: "Your first job in a new team is to understand how work actually gets done: who decides what, which tools matter, what “done” means here. Ask questions constantly, write the answers down, and resist proposing big changes until you understand why things are the way they are.",
          },
        ],
      },
      {
        heading: "Learn the unspoken rules",
        blocks: [
          {
            type: "paragraph",
            text: "Every workplace runs on norms nobody wrote down: how people signal availability, whether questions go to chat or in person, how blunt feedback is, when it's acceptable to leave. Watch for two weeks before judging anything — what looks inefficient often has a reason you'll discover.",
          },
          {
            type: "list",
            items: [
              "Notice how colleagues ask for help — copy the format that gets answers.",
              "Learn names and roles beyond your immediate team.",
              "Observe meeting culture before trying to change it.",
            ],
          },
        ],
      },
      {
        heading: "Make your work visible without bragging",
        blocks: [
          {
            type: "paragraph",
            text: "Managers can't reward what they can't see. Send a short weekly update to your supervisor: what you finished, what you're stuck on, what's next. Three lines, every week, no embellishment. Visibility plus honesty builds trust faster than any single achievement.",
          },
          {
            type: "example",
            label: "A good weekly update",
            text: "“Finished: product descriptions for 12 items. Stuck: waiting on supplier photos for the rest. Next: homepage banner draft by Thursday.” Factual, forward-looking, and over in thirty seconds.",
          },
        ],
      },
      {
        heading: "Handle mistakes like a professional",
        blocks: [
          {
            type: "paragraph",
            text: "You will make mistakes in the first month — everyone does. The professional move is fast, complete ownership: say what happened, say what you'll change, and fix what you can before being asked. Hiding a mistake that surfaces later costs multiples of the original error in trust.",
          },
          {
            type: "callout",
            title: "What not to do",
            text: "Don't blame tools, predecessors, or unclear instructions — even when they're partly at fault. Describe the fix, not the excuse; your manager already knows the context was imperfect.",
          },
        ],
      },
      {
        heading: "Build one ally at a time",
        blocks: [
          {
            type: "paragraph",
            text: "You don't need to befriend the whole office in week one. Identify one experienced colleague, be genuinely helpful to them, and learn from how they operate. One strong workplace relationship teaches you more about succeeding there than any onboarding document.",
          },
        ],
      },
    ],
    nextStep: { label: "Plan your next career step", to: "/ai?tool=roadmap" },
    related: ["organize-job-search", "learning-roadmap", "first-job-interview"],
  },
  {
    slug: "organize-job-search",
    cover: "/guides/organize-job-search.svg",
    coverAlt: "Illustration of a three-column task board with a completed item",
    title: "How to Organize Your Job Search So It Doesn't Dissolve Into Chaos",
    summary:
      "A simple weekly system — targets, tracking, batching, and follow-ups — that keeps applications moving.",
    intro: [
      "Most job searches fail structurally, not personally: applications scattered across tabs, no record of who was contacted when, follow-ups forgotten, and no sense of what's working. After a month, the whole effort dissolves into a blur of half-remembered postings.",
      "This guide gives you a lightweight system — a weekly target, one tracking sheet, batched work blocks, and a follow-up rhythm — that turns chaotic applying into a process you can actually steer.",
    ],
    category: "job-search",
    featured: false,
    publishedAt: "2026-10-12",
    sections: [
      {
        heading: "Set a weekly application target",
        blocks: [
          {
            type: "paragraph",
            text: "Five thoughtful applications beat twenty copy-pasted ones. Decide your number on Sunday based on your real availability, write it somewhere visible, and treat it as a commitment rather than an aspiration. Consistency compounds: five a week is over two hundred tailored applications a year.",
          },
        ],
      },
      {
        heading: "Keep one tracking sheet",
        blocks: [
          {
            type: "paragraph",
            text: "Company, role, date applied, contact, status, follow-up date — six columns in any spreadsheet or notebook. A month in, this sheet is the difference between a system and a blur: you'll know exactly who owes you a reply and which applications deserve a nudge.",
          },
          {
            type: "checklist",
            items: [
              "Company and role title",
              "Date applied and channel used",
              "Contact name if you have one",
              "Current status and next follow-up date",
            ],
          },
        ],
      },
      {
        heading: "Batch the boring parts",
        blocks: [
          {
            type: "paragraph",
            text: "Dedicate one block per week to finding and shortlisting postings, and a separate block to tailoring applications. Context-switching between hunting and writing wastes both: hunting needs breadth, writing needs depth, and mixing them produces shallow versions of each.",
          },
        ],
      },
      {
        heading: "Follow up on a schedule",
        blocks: [
          {
            type: "paragraph",
            text: "One polite follow-up seven to ten days after applying, referencing your original message. Then move on mentally — silence is data about that opportunity, not a verdict on you. Your tracker makes this mechanical instead of emotional.",
          },
          {
            type: "example",
            label: "Follow-up template",
            text: "“Hello [name], following up on my application for [role] on [date]. I'm very interested in [one specific reason]. Happy to share anything further — thank you for your time.” Short, specific, done.",
          },
        ],
      },
      {
        heading: "Review and adjust monthly",
        blocks: [
          {
            type: "paragraph",
            text: "Once a month, look at the sheet as a whole: response rate, which kinds of roles reply, where you stall. If nothing lands within two months, change one variable — narrower targeting, a rewritten summary, or a stronger portfolio piece — then measure again. A system you adjust beats a system you abandon.",
          },
          {
            type: "callout",
            title: "Protect your energy",
            text: "Searching while demoralized produces worse applications, which produce more silence. Rest days, exercise, and honest conversations with peers aren't breaks from the search — they're part of what keeps it working.",
          },
        ],
      },
    ],
    nextStep: { label: "Browse open opportunities", to: "/explore" },
    related: ["find-first-internship", "evaluate-job-opportunity", "learning-roadmap"],
  },
];

/* ---------------- helpers (pure, tested) ---------------- */

export function getGuideBySlug(slug) {
  return CAREER_GUIDES.find((guide) => guide.slug === slug) || null;
}

export function guidesByCategory(categoryId) {
  return CAREER_GUIDES.filter((guide) => guide.category === categoryId);
}

export function getCategoryById(id) {
  return GUIDE_CATEGORIES.find((category) => category.id === id) || null;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function guideSearchText(guide) {
  const parts = [
    guide.title,
    guide.summary,
    (guide.intro || []).join(" "),
    ...guide.sections.flatMap((section) => [
      section.heading,
      ...section.blocks.map((block) =>
        block.type === "list" || block.type === "checklist"
          ? block.items.join(" ")
          : block.text || ""
      ),
    ]),
  ];

  return normalizeText(parts.join(" "));
}

export function searchGuides(query) {
  const terms = normalizeText(query).split(" ").filter(Boolean);

  if (terms.length === 0) return [...CAREER_GUIDES];

  return CAREER_GUIDES.filter((guide) => {
    const haystack = guideSearchText(guide);
    return terms.every((term) => haystack.includes(term));
  });
}

export function getRelatedGuides(slug, count = 3) {
  const current = getGuideBySlug(slug);

  if (!current) return [];

  const others = CAREER_GUIDES.filter((guide) => guide.slug !== slug);
  const sameCategory = others.filter(
    (guide) => guide.category === current.category
  );
  const rest = others.filter((guide) => guide.category !== current.category);

  return [...sameCategory, ...rest].slice(0, count);
}

export function readingMinutes(guide) {
  const words = guideSearchText(guide).split(" ").filter(Boolean).length;

  return Math.max(2, Math.ceil(words / 200));
}

export function getFeaturedGuide() {
  return CAREER_GUIDES.find((guide) => guide.featured) || CAREER_GUIDES[0];
}
