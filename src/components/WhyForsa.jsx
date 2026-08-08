import { motion } from "framer-motion";
import {
  FaCompass,
  FaUserCircle,
  FaComments,
  FaArrowRight,
} from "react-icons/fa";

const FEATURES = [
  {
    icon: FaCompass,
    eyebrow: "01",
    title: "Find what fits.",
    description:
      "Discover opportunities based on what you're looking for — from your first internship to your next project.",
  },
  {
    icon: FaUserCircle,
    eyebrow: "02",
    title: "Show what you bring.",
    description:
      "Build a profile around your skills, experience, and goals so teams can understand you beyond a résumé.",
  },
  {
    icon: FaComments,
    eyebrow: "03",
    title: "Start a conversation.",
    description:
      "Connect with the people behind the opportunity and take the next step without unnecessary friction.",
  },
];

export default function WhyForsa() {
  return (
    <section className="relative overflow-hidden border-y border-purple-100/80 bg-[#faf9ff]">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-purple-200/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:py-28">
        {/* Section heading */}
        <div className="max-w-3xl">

          <h2 className="mt-5 text-3xl font-bold tracking-[-0.045em] text-neutral-950 sm:text-4xl lg:text-[3.25rem] lg:leading-[1.08]">
            Opportunity should feel{" "}
            <span className="text-[var(--forsa-primary)]">personal.</span>
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-500 sm:text-base">
            Forsa gives talent and teams a simpler way to discover each other,
            understand what fits, and move forward.
          </p>
        </div>

        {/* Feature grid */}
        <div className="mt-14 grid overflow-hidden rounded-3xl border border-purple-100/80 bg-white shadow-[0_20px_60px_-40px_rgba(91,33,182,0.25)] md:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.eyebrow}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
                className={`group relative p-7 sm:p-8 lg:p-9 ${
                  index !== FEATURES.length - 1
                    ? "border-b border-purple-100/80 md:border-b-0 md:border-r"
                    : ""
                }`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[var(--forsa-primary)] transition-transform duration-300 group-hover:-translate-y-0.5">
                    <Icon className="text-sm" />
                  </div>

                  <span className="font-mono text-[10px] font-medium tracking-widest text-neutral-300">
                    {feature.eyebrow}
                  </span>
                </div>

                {/* Copy */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold tracking-[-0.025em] text-neutral-950 sm:text-xl">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-neutral-500">
                    {feature.description}
                  </p>
                </div>

                {/* Subtle hover indicator */}
                <div className="mt-8 flex items-center gap-2 text-[11px] font-semibold text-neutral-300 transition-colors group-hover:text-[var(--forsa-primary)]">
                  <span>Forsa</span>

                  <FaArrowRight className="text-[8px] transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom statement */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-neutral-400">
            Designed for students, early-career professionals, freelancers,
            founders, and growing teams.
          </p>
        </div>
      </div>
    </section>
  );
}