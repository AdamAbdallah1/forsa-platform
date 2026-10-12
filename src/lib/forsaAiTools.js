/*
 * Forsa AI's four guided career tools.
 *
 * This module is the single source of truth for tool metadata, form steps,
 * and prompt construction. The workspace page and the floating widget both
 * consume it, so business logic is never duplicated between surfaces.
 *
 * Nothing here invokes the provider. `buildMessages()` returns the exact
 * user-turn payload the caller sends with a single generation — one tool run
 * costs exactly one AI invocation.
 *
 * Anti-fabrication rules live here too: every builder only rearranges
 * user-supplied facts and states what is missing. The server-owned system
 * prompt carries the matching "never invent" instruction.
 */

export const TOOL_IDS = ["cv", "interview", "roadmap", "application"];

function required(value) {
  return String(value || "").trim().length > 0
    ? null
    : "This field is required.";
}

function minLength(min) {
  return (value) =>
    String(value || "").trim().length >= min
      ? null
      : `Please add a little more detail (at least ${min} characters).`;
}

function optional() {
  return null;
}

export const FORSA_AI_TOOLS = [
  {
    id: "cv",
    tool: "cv_feedback",
    title: "Improve my CV",
    shortTitle: "CV review",
    description:
      "Paste your CV and get a structured review: strengths, gaps, and stronger wording drawn only from your facts.",
    icon: "file",
    followUpLabel: "Follow-up question about your CV review",
    followUpPlaceholder: "Ask a follow-up about this review…",
    steps: [
      {
        id: "cvText",
        label: "Your CV or CV section",
        hint: "Paste the full text of your CV, or the section you want reviewed.",
        placeholder:
          "Paste your CV here — for example: Rami Haddad, Business graduate (AUB, 2024). Internship at Bank Audi, customer service (6 months)...",
        multiline: true,
        validate: minLength(80),
      },
      {
        id: "targetRole",
        label: "Target role or field",
        hint: "The job you are aiming for, so feedback stays relevant.",
        placeholder: "e.g. Junior marketing associate",
        multiline: false,
        validate: required,
      },
      {
        id: "jobDescription",
        label: "Job description (optional)",
        hint: "Paste a posting you are targeting and the review will compare against it.",
        placeholder: "Paste the job description here, or leave blank.",
        multiline: true,
        validate: optional,
      },
    ],
    buildMessages(data) {
      const parts = [
        "Please review my CV below.",
        "",
        `Target role: ${data.targetRole.trim()}`,
        "",
        "My CV:",
        data.cvText.trim(),
      ];

      if (String(data.jobDescription || "").trim()) {
        parts.push("", "Job description I am targeting:", String(data.jobDescription).trim());
      }

      parts.push(
        "",
        "Structure your review as: 1) Overall assessment, 2) Strong points, " +
          "3) Missing or unclear information, 4) Specific improvement suggestions " +
          "with example wording based ONLY on the facts I supplied. Do not invent " +
          "experience, degrees, skills, or metrics."
      );

      return [{ role: "user", content: parts.join("\n") }];
    },
  },
  {
    id: "interview",
    tool: "interview",
    title: "Practice interviews",
    shortTitle: "Interview prep",
    description:
      "Get a focused set of likely questions plus preparation guidance for your target role — one generation, no drip-feed.",
    icon: "mic",
    followUpLabel: "Answer the practice question",
    followUpPlaceholder: "Type your answer to the practice question here…",
    steps: [
      {
        id: "targetRole",
        label: "Target job or field",
        hint: "The role you are interviewing for.",
        placeholder: "e.g. Junior data analyst",
        multiline: false,
        validate: required,
      },
      {
        id: "experience",
        label: "Experience level",
        hint: "Where you are in your career right now.",
        placeholder: "e.g. Fresh graduate, 1 year of internships",
        multiline: false,
        validate: required,
      },
      {
        id: "mode",
        label: "Practice mode",
        hint: "What kind of questions should the set focus on?",
        options: [
          "Common interview questions",
          "Technical preparation",
          "Behavioral questions",
        ],
        validate: required,
      },
    ],
    buildMessages(data) {
      return [
        {
          role: "user",
          content: [
            `I am preparing for interviews as a ${data.targetRole.trim()}.`,
            `My experience level: ${data.experience.trim()}.`,
            `Practice mode: ${data.mode.trim()}.`,
            "",
            "Give me a focused set of 8 likely questions with brief guidance on " +
              "what a strong answer covers for each, then end with one practice " +
              "round: ask me the single most important question and wait for my answer.",
          ].join("\n"),
        },
      ];
    },
  },
  {
    id: "roadmap",
    tool: "career",
    title: "Build my career roadmap",
    shortTitle: "Roadmap",
    description:
      "A realistic learning and career plan with milestones, skills, projects, and job-readiness checkpoints.",
    icon: "compass",
    followUpLabel: "Follow-up question about your roadmap",
    followUpPlaceholder: "Ask a follow-up about this roadmap…",
    steps: [
      {
        id: "currentLevel",
        label: "Current level",
        hint: "Where you are today — be honest, the plan adapts.",
        placeholder: "e.g. Final-year computer science student",
        multiline: false,
        validate: required,
      },
      {
        id: "targetRole",
        label: "Target role",
        hint: "The role you want to be ready for.",
        placeholder: "e.g. Frontend developer",
        multiline: false,
        validate: required,
      },
      {
        id: "weeklyHours",
        label: "Hours per week",
        hint: "Realistic time you can dedicate to learning and building.",
        placeholder: "e.g. 8",
        multiline: false,
        validate: (value) => {
          if (!String(value || "").trim()) return "This field is required.";
          const hours = Number(String(value).trim());
          if (!Number.isFinite(hours) || hours <= 0 || hours > 80) {
            return "Enter a realistic number of hours (1–80).";
          }
          return null;
        },
      },
      {
        id: "deadline",
        label: "Deadline (optional)",
        hint: "A date you are aiming for, if you have one.",
        placeholder: "e.g. Ready to apply by March",
        multiline: false,
        validate: optional,
      },
    ],
    buildMessages(data) {
      const lines = [
        `My current level: ${data.currentLevel.trim()}.`,
        `My target role: ${data.targetRole.trim()}.`,
        `I can dedicate ${String(data.weeklyHours).trim()} hours per week.`,
      ];

      if (String(data.deadline || "").trim()) {
        lines.push(`My target timing: ${String(data.deadline).trim()}.`);
      }

      lines.push(
        "",
        "Build my career roadmap as: 1) Milestones in order, 2) Skills to develop, " +
          "3) Practical projects to build, 4) Learning resource categories, " +
          "5) Portfolio suggestions, 6) Job-readiness checkpoints. Be realistic " +
          "about pacing given my weekly hours. Do not promise salaries, guaranteed " +
          "timelines, or market statistics — say plainly where advice is general."
      );

      return [{ role: "user", content: lines.join("\n") }];
    },
  },
  {
    id: "application",
    tool: "application",
    title: "Prepare a job application",
    shortTitle: "Application",
    description:
      "Turn a job description and your background into a tailored cover letter — grounded only in facts you provide.",
    icon: "pen",
    followUpLabel: "Follow-up question about your application",
    followUpPlaceholder: "Ask a follow-up about this letter…",
    steps: [
      {
        id: "targetRole",
        label: "Role and company",
        hint: "What you are applying for, and where if known.",
        placeholder: "e.g. Marketing intern at a Beirut startup",
        multiline: false,
        validate: required,
      },
      {
        id: "jobDescription",
        label: "Job description (optional)",
        hint: "Paste it and the letter will mirror what the employer asks for.",
        placeholder: "Paste the job description here, or leave blank.",
        multiline: true,
        validate: optional,
      },
      {
        id: "background",
        label: "Your relevant background",
        hint: "Experience, projects, and qualifications to draw on. Only these facts will be used.",
        placeholder:
          "e.g. Business graduate, social media internship, ran a student club campaign...",
        multiline: true,
        validate: minLength(40),
      },
    ],
    buildMessages(data) {
      const parts = [
        `I am applying for: ${data.targetRole.trim()}.`,
        "",
        "My relevant background:",
        data.background.trim(),
      ];

      if (String(data.jobDescription || "").trim()) {
        parts.push("", "Job description:", String(data.jobDescription).trim());
      }

      parts.push(
        "",
        "Write a concise, professional cover letter using ONLY the background " +
          "above. Then add a short section explaining which of my qualifications " +
          "are most relevant and why. Do not invent qualifications, and do not " +
          "claim the application has been submitted anywhere."
      );

      return [{ role: "user", content: parts.join("\n") }];
    },
  },
];

export function getTool(id) {
  return FORSA_AI_TOOLS.find((tool) => tool.id === id) || null;
}

/**
 * Validate a tool's form data. Returns `{ fieldId: message }` — empty when
 * everything passes. Pure and synchronous so the UI can validate on submit
 * without any provider call.
 */
export function validateToolForm(tool, data) {
  const errors = {};

  for (const step of tool.steps) {
    const validate = step.validate || optional;
    const message = validate(data[step.id]);

    if (message) errors[step.id] = message;
  }

  return errors;
}
