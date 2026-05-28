import { FaIdCard, FaSearch, FaPaperPlane } from "react-icons/fa";

const steps = [
  {
    icon: FaIdCard,
    number: "01",
    title: "Build your profile",
    text: "Add your city, specific skills, and CV data so every discovery feels naturally contextualized.",
  },
  {
    icon: FaSearch,
    number: "02",
    title: "Find the right fit",
    text: "Browse internships, local freelance gigs, part-time setups, and fast projects with simple filters.",
  },
  {
    icon: FaPaperPlane,
    number: "03",
    title: "Apply directly",
    text: "Send a focused message, securely link your CV metadata, and organize all updates right from your panel.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-20">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        
        {/* Description Header Column */}
        <div className="text-center lg:text-left space-y-4 max-w-xl mx-auto lg:mx-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--forsa-primary)]" />
            How it works
          </span>

          <h2 className="text-3xl font-bold tracking-[-0.04em] text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.1]">
            A job network that feels simple, local, and human.
          </h2>

          <p className="text-base leading-relaxed text-neutral-500 font-medium">
            No bloated onboarding loops or endlessly long application forms. Just the native mechanics needed to interface with companies instantly.
          </p>
        </div>

        {/* Steps Column Stack */}
        <div className="grid gap-4">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="group rounded-2xl border border-neutral-200/70 bg-white p-5 sm:p-6 transition-all duration-300 hover:border-neutral-400 hover:shadow-[0_12px_30px_rgba(0,0,0,0.015)]"
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-600 border border-neutral-200/50 transition-colors duration-300 group-hover:bg-[var(--forsa-primary)] group-hover:text-white group-hover:border-transparent">
                    <Icon className="text-sm" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">{step.number}</p>
                    <h3 className="text-base font-bold tracking-tight text-neutral-950 sm:text-lg">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-500 font-medium">
                      {step.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}