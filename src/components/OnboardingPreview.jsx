import { FaCheck, FaFileAlt, FaMapMarkerAlt } from "react-icons/fa";

const skills = ["React", "Design", "Marketing", "Video editing", "Sales"];
const lookingFor = ["Internship", "Freelance", "Part-time", "Remote", "Project"];

export default function OnboardingPreview() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-20">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        
        {/* Info Column */}
        <div className="text-center lg:text-left space-y-4 max-w-xl mx-auto lg:mx-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--forsa-primary)]" />
            Profile setup
          </span>

          <h2 className="text-3xl font-bold tracking-[-0.04em] text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.1]">
            A profile that works like your mini CV.
          </h2>

          <p className="text-base leading-relaxed text-neutral-500 font-medium">
            Perfectly lightweight for student profiles. Clear and readable for corporate scanning. Crafted specifically to capture professional intent instantly.
          </p>
        </div>

        {/* UI Mockup Container */}
        <div className="mx-auto w-full max-w-md rounded-[32px] border border-neutral-200/70 bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.02)] lg:max-w-none">
          <div className="rounded-[24px] bg-neutral-50/70 border border-neutral-100 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/40">
              <div>
                <p className="text-xs font-bold uppercase tracking-tight text-neutral-950">Opportunity profile</p>
                <p className="mt-0.5 text-[11px] font-medium text-neutral-400">Verified and ready to deploy</p>
              </div>

              <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-0.5 text-[11px] font-bold text-emerald-700">
                82% Completed
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <Row icon={<FaMapMarkerAlt />} title="Location" text="Beirut · Remote" />
              <Row icon={<FaFileAlt />} title="CV metadata" text="Adam_CV.pdf attached" />
              <ChipGroup title="Skills" items={skills} />
              <ChipGroup title="Looking for" items={lookingFor} />
            </div>

            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--forsa-primary)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(82,39,255,0.15)] transition-all duration-300 hover:brightness-110">
              <FaCheck className="text-[10px]" />
              Profile ready
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ icon, title, text }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-200/40 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-50 border border-neutral-200/50 text-neutral-400 text-xs">
        {icon}
      </div>

      <div>
        <p className="text-[9px] font-bold tracking-wider text-neutral-400 uppercase">{title}</p>
        <p className="text-sm font-bold text-neutral-800 mt-0.5 tracking-tight">{text}</p>
      </div>
    </div>
  );
}

function ChipGroup({ title, items }) {
  return (
    <div className="rounded-xl border border-neutral-200/40 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <p className="text-[9px] font-bold tracking-wider text-neutral-400 uppercase mb-2.5">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-md border border-neutral-200/40 bg-neutral-50/50 px-2.5 py-1 text-xs font-semibold text-neutral-600"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}