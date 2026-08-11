import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  FaCompass,
  FaUserCircle,
  FaComments,
  FaArrowRight,
  FaMagic,
} from "react-icons/fa";

import whyHero from "../assets/why-hero.lottie";

const FEATURES = [
  {
    icon: FaCompass,
    number: "01",
    title: "Find what fits.",
    description:
      "Discover opportunities tailored to your exact career goals — from your first internship to high-impact projects.",
  },
  {
    icon: FaUserCircle,
    number: "02",
    title: "Show what you bring.",
    description:
      "Build a modern profile focused on proof of skills and real work, letting employers see your genuine value.",
  },
  {
    icon: FaComments,
    number: "03",
    title: "Start a conversation.",
    description:
      "Direct communication channels between candidate and employer with zero unnecessary recruitment noise.",
  },
];

export default function WhyForsa() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-neutral-50/80 to-white py-16 sm:py-20 lg:py-24">
      {/* Background Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05] blur-3xl"
        style={{
          backgroundColor: "var(--forsa-primary)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* HERO/INTRO BLOCK */}
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Animation */}
          <motion.div
            initial={{ opacity: 0, x: -18, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center"
          >
            <div className="relative z-10 h-[240px] w-full max-w-[320px] sm:h-[280px] sm:max-w-[360px] lg:h-[310px] lg:max-w-[390px]">
              <DotLottieReact
                src={whyHero}
                loop
                autoplay
                className="h-full w-full drop-shadow-sm"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >

            <h2 className="mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.045em] text-neutral-950 sm:text-4xl lg:text-[2.85rem]">
              Opportunity should feel{" "}
              <span style={{ color: "var(--forsa-primary)" }}>
                personal.
              </span>
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-500 sm:text-base sm:leading-7">
              Forsa removes outdated hiring clutter, giving talent and teams a clearer, direct path to align, connect, and build together.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-neutral-500">
              <span className="rounded-md bg-neutral-100/80 px-2.5 py-1">Talent First</span>
              <span className="text-neutral-300">•</span>
              <span className="rounded-md bg-neutral-100/80 px-2.5 py-1">Direct Access</span>
              <span className="text-neutral-300">•</span>
              <span className="rounded-md bg-neutral-100/80 px-2.5 py-1">Verified Roles</span>
            </div>
          </motion.div>
        </div>

        {/* FEATURES GRID */}
        <div className="mt-16 grid overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_12px_40px_-15px_rgba(0,0,0,0.05)] md:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.number}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className={`group relative p-7 sm:p-8 transition-colors duration-300 hover:bg-neutral-50/50 ${
                  index !== FEATURES.length - 1
                    ? "border-b border-neutral-100 md:border-b-0 md:border-r"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--forsa-primary) 8%, white)",
                      color: "var(--forsa-primary)",
                    }}
                  >
                    <Icon className="text-sm" />
                  </div>

                  <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-neutral-300 group-hover:text-[var(--forsa-primary)] transition-colors">
                    {feature.number}
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-base font-bold tracking-[-0.02em] text-neutral-950 sm:text-lg">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 transition-colors duration-200 group-hover:text-[var(--forsa-primary)]">
                  <span>Explore experience</span>
                  <FaArrowRight className="text-[8px] transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* BOTTOM STATEMENT */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 flex items-center justify-center"
        >
          <p className="text-center text-xs font-medium leading-5 text-neutral-400">
            Tailored for students, early-career professionals, founders, and growing companies.
          </p>
        </motion.div>
      </div>
    </section>
  );
}