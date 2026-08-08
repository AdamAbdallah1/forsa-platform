import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  FaCompass,
  FaUserCircle,
  FaComments,
  FaArrowRight,
} from "react-icons/fa";

import whyHero from "../assets/why-hero.lottie";

const FEATURES = [
  {
    icon: FaCompass,
    number: "01",
    title: "Find what fits.",
    description:
      "Discover opportunities based on what you're looking for — from your first internship to your next project.",
  },
  {
    icon: FaUserCircle,
    number: "02",
    title: "Show what you bring.",
    description:
      "Build a profile around your skills, experience, and goals so teams can understand you beyond a résumé.",
  },
  {
    icon: FaComments,
    number: "03",
    title: "Start a conversation.",
    description:
      "Connect with the people behind the opportunity and take the next step without unnecessary friction.",
  },
];

export default function WhyForsa() {
  return (
    <section className="relative overflow-hidden border-t border-neutral-100 bg-neutral-50/50">
      {/* Subtle background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.045] blur-3xl"
        style={{
          backgroundColor: "var(--forsa-primary)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        {/* =====================================================
            INTRO — ANIMATION LEFT / COPY RIGHT
        ====================================================== */}
        <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          {/* Animation */}
          <motion.div
            initial={{ opacity: 0, x: -18, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex items-center justify-center"
          >
            {/* Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] blur-3xl"
              style={{
                backgroundColor: "var(--forsa-primary)",
              }}
            />

            {/* Lottie */}
            <div className="relative z-10 h-[240px] w-full max-w-[320px] sm:h-[280px] sm:max-w-[360px] lg:h-[310px] lg:max-w-[390px]">
              <DotLottieReact
                src={whyHero}
                loop
                autoplay
                className="h-full w-full"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.6,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="max-w-xl"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-px w-7"
                style={{
                  backgroundColor: "var(--forsa-primary)",
                }}
              />

              <span
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{
                  color: "var(--forsa-primary)",
                }}
              >
                Why Forsa
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.045em] text-neutral-950 sm:text-4xl lg:text-[3rem]">
              Opportunity should feel{" "}
              <span style={{ color: "var(--forsa-primary)" }}>
                personal.
              </span>
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-500 sm:text-base sm:leading-7">
              Forsa gives talent and teams a simpler way to discover each
              other, understand what fits, and move forward.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-neutral-400">
              <span>Talent</span>
              <span className="text-neutral-300">•</span>
              <span>Teams</span>
              <span className="text-neutral-300">•</span>
              <span>Opportunities</span>
            </div>
          </motion.div>
        </div>

        {/* =====================================================
            FEATURES
        ====================================================== */}
        <div className="mt-14 grid overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_18px_50px_-35px_rgba(82,39,255,0.2)] md:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.number}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.07,
                }}
                className={`group relative p-6 sm:p-7 ${
                  index !== FEATURES.length - 1
                    ? "border-b border-neutral-100 md:border-b-0 md:border-r"
                    : ""
                }`}
              >
                {/* Number */}
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--forsa-primary) 7%, white)",
                      color: "var(--forsa-primary)",
                    }}
                  >
                    <Icon className="text-xs" />
                  </div>

                  <span className="font-mono text-[9px] font-medium tracking-[0.16em] text-neutral-300">
                    {feature.number}
                  </span>
                </div>

                {/* Text */}
                <div className="mt-6">
                  <h3 className="text-base font-semibold tracking-[-0.02em] text-neutral-950 sm:text-lg">
                    {feature.title}
                  </h3>

                  <p className="mt-2.5 text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                    {feature.description}
                  </p>
                </div>

                {/* Hover indicator */}
                <div className="mt-6 flex items-center gap-1.5 text-[10px] font-semibold text-neutral-300 transition-colors duration-200 group-hover:text-[var(--forsa-primary)]">
                  <span>Forsa</span>

                  <FaArrowRight className="text-[7px] transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-6 flex items-center justify-center"
        >
          <p className="text-center text-[11px] leading-5 text-neutral-400">
            Built for students, early-career professionals, freelancers,
            founders, and growing teams.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
