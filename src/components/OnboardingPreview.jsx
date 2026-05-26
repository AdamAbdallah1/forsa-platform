import { FaCheck, FaFileAlt, FaMapMarkerAlt } from "react-icons/fa";

const skills = ["React", "Design", "Marketing", "Video editing", "Sales"];
const lookingFor = ["Internship", "Freelance", "Part-time", "Remote", "Project"];

export default function OnboardingPreview() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="text-center lg:text-left">
        <p className="text-sm font-medium text-neutral-500">Profile setup</p>

        <h2 className="mx-auto mt-3 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl md:text-5xl lg:mx-0">
          A profile that works like your mini CV.
        </h2>

        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-neutral-600 sm:text-base lg:mx-0">
          Simple enough for students. Useful enough for businesses. Built to
          help people understand you fast.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md rounded-[30px] border border-[var(--forsa-border)] bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.06)] lg:max-w-none">
        <div className="rounded-[24px] bg-[#f7f7f5] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Opportunity profile</p>
              <p className="mt-1 text-xs text-neutral-500">Ready to apply</p>
            </div>

            <span className="rounded-full bg-[var(--forsa-green)] px-3 py-1 text-xs text-white">
              82%
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            <Row icon={<FaMapMarkerAlt />} title="Location" text="Beirut · Remote" />
            <Row icon={<FaFileAlt />} title="CV metadata" text="Adam_CV.pdf attached" />
            <ChipGroup title="Skills" items={skills} />
            <ChipGroup title="Looking for" items={lookingFor} />
          </div>

          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--forsa-green)] px-5 py-3 text-sm font-medium text-white">
            <FaCheck className="text-xs" />
            Profile ready
          </button>
        </div>
      </div>
    </section>
  );
}

function Row({ icon, title, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--forsa-green)] text-sm text-white">
        {icon}
      </div>

      <div>
        <p className="text-xs text-neutral-500">{title}</p>
        <p className="text-sm font-medium">{text}</p>
      </div>
    </div>
  );
}

function ChipGroup({ title, items }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="mb-3 text-xs text-neutral-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[var(--forsa-border)] bg-white px-3 py-1.5 text-xs"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
