const normalize = (value) => String(value || "").trim().toLowerCase();

const includesMatch = (a, b) => {
  const left = normalize(a);
  const right = normalize(b);

  return left && right && (left.includes(right) || right.includes(left));
};

export function calculateApplicantScore(thread) {
  const seeker = thread?.seeker || {};
  const opportunity = thread?.opportunity || thread || {};

  const seekerSkills = seeker.skills || [];
  const seekerGoals = seeker.lookingFor || [];

  const jobTags = thread?.tags || opportunity.tags || [];
  const jobType = opportunity.type || thread?.type || "";
  const jobLocation = opportunity.location || thread?.location || "";
  const seekerCity = seeker.city || "";

  let score = 20;
  const reasons = [];

  const matchedSkills = jobTags.filter((tag) =>
    seekerSkills.some((skill) => includesMatch(skill, tag))
  );

  if (matchedSkills.length > 0) {
    score += Math.min(40, matchedSkills.length * 12);
    reasons.push(`Skills match: ${matchedSkills.slice(0, 3).join(", ")}`);
  }

  const typeMatch = seekerGoals.some((goal) => includesMatch(goal, jobType));

  if (typeMatch) {
    score += 15;
    reasons.push(`Looking for ${jobType}`);
  }

  if (seekerCity && jobLocation && includesMatch(jobLocation, seekerCity)) {
    score += 15;
    reasons.push(`Same location: ${seekerCity}`);
  }

  if (thread?.cv?.url || thread?.cv?.name) {
    score += 10;
    reasons.push("CV attached");
  }

  if (thread?.answers && Object.keys(thread.answers).length > 0) {
    score += 10;
    reasons.push("Answered company questions");
  }

  return {
    score: Math.min(98, Math.max(0, score)),
    reasons: reasons.length ? reasons : ["Basic profile match"],
  };
}