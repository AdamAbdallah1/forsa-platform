import { FaIdCard, FaSearch, FaPaperPlane } from "react-icons/fa";

const steps = [
  {
    icon: FaIdCard,
    number: "01",
    title: "Build your profile",
    text: "Add your city, skills, goals, and CV metadata so every application feels ready.",
  },
  {
    icon: FaSearch,
    number: "02",
    title: "Find the right fit",
    text: "Browse internships, freelance gigs, part-time roles, and local projects with simple filters.",
  },
  {
    icon: FaPaperPlane,
    number: "03",
    title: "Apply directly",
    text: "Send a short message, attach your CV metadata, and track everything from your profile.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div className="text-center lg:text-left space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium tracking-wide text-neutral-500 uppercase">
          <span className="h-1 w-1 rounded-full bg-[var(--forsa-primary)]" />
          How it works
        </span>

        <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.15] lg:mx-0">
          A job app that feels simple, local, and human.
        </h2>

        <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-500 lg:mx-0">
          No complicated dashboards. No endless forms. Just the basics people
          need to connect fast.
        </p>
      </div>

      <div className="grid gap-4">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <div
              key={step.number}
              className="group rounded-2xl border border-[var(--forsa-border)] bg-white p-6 transition-all duration-300 hover:border-neutral-400 hover:shadow-[0_8px_30px_rgba(0,0,0,0.01)]"
            >
              <div className="flex items-start gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-600 border border-neutral-100 transition-colors duration-300 group-hover:bg-[var(--forsa-primary)] group-hover:text-white group-hover:border-transparent">
                  <Icon className="text-sm" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">{step.number}</p>
                  <h3 className="text-base font-semibold tracking-tight text-neutral-950 sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-500">
                    {step.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}