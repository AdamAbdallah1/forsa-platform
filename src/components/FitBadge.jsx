export default function FitBadge({
  score = 0,
  matchingSkills = [],
  matchingType,
}) {
  const percentage = score <= 0 ? 0 : Math.min(95, 55 + score * 12);
  const skillsText =
    matchingSkills.length > 0 ? matchingSkills.slice(0, 2).join(", ") : null;

  if (score <= 0) {
    return (
      <div className="min-h-[92px] rounded-2xl bg-[#f7f7f5] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-neutral-500">Forsa Fit</p>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-500">
            New
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-600">
          Complete your profile to get better matches.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[92px] rounded-2xl bg-black p-3 text-white">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-neutral-300">Forsa Fit</p>

        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-black">
          {percentage}%
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {skillsText && (
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-neutral-100">
            {skillsText}
          </span>
        )}

        {matchingType && (
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-neutral-100">
            {matchingType}
          </span>
        )}
      </div>

      {!skillsText && !matchingType && (
        <p className="mt-3 text-sm leading-6 text-neutral-300">
          Good match based on your profile.
        </p>
      )}
    </div>
  );
}