import { FaCheck, FaFileAlt, FaMapMarkerAlt } from "react-icons/fa";

const skills = ["React", "Design", "Marketing", "Video editing", "Sales"];
const lookingFor = ["Internship", "Freelance", "Part-time", "Remote", "Project"];

export default function OnboardingPreview() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div className="text-center lg:text-left space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium tracking-wide text-neutral-500 uppercase">
          <span className="h-1 w-1 rounded-full bg-[var(--forsa-primary)]" />
          Profile setup
        </span>

        <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.15] lg:mx-0">
          A profile that works like your mini CV.
        </h2>

        <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-500 lg:mx-0">
          Simple enough for students. Useful enough for businesses. Built to
          help people understand you fast.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md rounded-3xl border border-[var(--forsa-border)] bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.02)] lg:max-w-none">
        <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-950">Opportunity profile</p>
              <p className="mt-0.5 text-xs text-neutral-400">Ready to apply</p>
            </div>

            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              82% Completed
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            <Row icon={<FaMapMarkerAlt />} title="Location" text="Beirut · Remote" />
            <Row icon={<FaFileAlt />} title="CV metadata" text="Adam_CV.pdf attached" />
            <ChipGroup title="Skills" items={skills} />
            <ChipGroup title="Looking for" items={lookingFor} />
          </div>

          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--forsa-primary)] px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:brightness-110">
            <FaCheck className="text-[10px]" />
            Profile ready
          </button>
        </div>
      </div>
    </section>
  );
}

function Row({ icon, title, text }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-200/60 bg-white p-3.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 border border-neutral-100 text-neutral-500 text-xs">
        {icon}
      </div>

      <div>
        <p className="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">{title}</p>
        <p className="text-sm font-medium text-neutral-800 mt-0.5">{text}</p>
      </div>
    </div>
  );
}

function ChipGroup({ title, items }) {
  return (
    <div className="rounded-xl border border-neutral-200/60 bg-white p-4">
      <p className="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase mb-3">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-md border border-neutral-100 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}