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
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="text-center lg:text-left">
        <p className="text-sm font-medium text-neutral-500">How it works</p>

        <h2 className="mx-auto mt-3 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl md:text-5xl lg:mx-0">
          A job app that feels simple, local, and human.
        </h2>

        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-neutral-600 sm:text-base lg:mx-0">
          No complicated dashboards. No endless forms. Just the basics people
          need to connect fast.
        </p>
      </div>

      <div className="grid gap-3">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <div
              key={step.number}
              className="rounded-[26px] border border-[var(--forsa-border)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-primary)] text-white">
                  <Icon className="text-sm" />
                </div>

                <div>
                  <p className="text-xs text-neutral-400">{step.number}</p>
                  <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">
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
