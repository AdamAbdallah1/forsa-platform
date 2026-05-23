const skills = ["React", "Design", "Marketing", "Video editing", "Sales"];
const lookingFor = ["Internship", "Freelance", "Part-time", "Remote", "Project"];

export default function OnboardingPreview() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14 sm:py-16 lg:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="text-center lg:text-left">
          <p className="text-sm font-medium text-neutral-500">Profile setup</p>

          <h2 className="mx-auto mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:mx-0">
            Tell people what you can do.
          </h2>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-600 sm:text-base lg:mx-0">
            Forsa keeps profiles simple: your skills, your city, and what kind
            of opportunity you’re looking for.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-5 lg:max-w-none">
          <div className="rounded-[24px] bg-[#f7f7f5] p-4 sm:p-5">
            <p className="text-sm font-medium">Create your profile</p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Help businesses and people understand what fits you.
            </p>

            <div className="mt-6 space-y-6">
              <ChipGroup title="Your skills" items={skills} />
              <ChipGroup title="Looking for" items={lookingFor} />
            </div>

            <button className="mt-7 w-full rounded-full bg-black px-5 py-3 text-sm font-medium text-white">
              Find opportunities
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChipGroup({ title, items }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}