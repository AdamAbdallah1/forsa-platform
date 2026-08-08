import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaUser,
  FaBuilding,
  FaCompass,
} from "react-icons/fa";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import talentHero from "../assets/talent-hero.lottie";

const FLOW_ITEMS = [
  {
    label: "Talent",
    title: "Show what you can do.",
    description:
      "Create a profile around your skills, interests, and goals.",
    icon: FaUser,
    color: "purple",
  },
  {
    label: "Discover",
    title: "Find what fits.",
    description:
      "Explore opportunities that match where you want to go.",
    icon: FaCompass,
    color: "blue",
  },
  {
    label: "Teams",
    title: "Meet the right people.",
    description:
      "Connect with companies looking for people like you.",
    icon: FaBuilding,
    color: "emerald",
  },
];

const COLOR_STYLES = {
  purple: {
    icon: "bg-purple-50 text-[var(--forsa-primary)] border-purple-100",
    number: "text-[var(--forsa-primary)]",
  },
  blue: {
    icon: "bg-blue-50 text-blue-600 border-blue-100",
    number: "text-blue-600",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 border-emerald-100",
    number: "text-emerald-600",
  },
};

export default function TalentCompanySection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden border-t border-neutral-100 bg-white">
      {/* Subtle background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-180px] top-[-120px] h-[420px] w-[420px] rounded-full opacity-[0.035] blur-3xl"
        style={{
          backgroundColor: "var(--forsa-primary)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        {/* =====================================================
            INTRO — CONTENT LEFT / ANIMATION RIGHT
        ====================================================== */}
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="max-w-xl"
          >
            <div className="flex items-center gap-3">

            </div>

            <h2 className="mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.045em] text-neutral-950 sm:text-4xl lg:text-[3rem]">
              From potential to{" "}
              <span style={{ color: "var(--forsa-primary)" }}>
                opportunity.
              </span>
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-500 sm:text-base sm:leading-7">
              Forsa makes the connection between capable people and the
              teams that need them simpler, clearer, and more direct.
            </p>

            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="group mt-6 inline-flex items-center gap-2 text-xs font-bold text-neutral-700 transition-colors hover:text-[var(--forsa-primary)]"
            >
              Get started
              <FaArrowRight className="text-[8px] transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* Animation */}
          <motion.div
            initial={{ opacity: 0, x: 18, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.65,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            {/* Soft glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-3xl"
              style={{
                backgroundColor: "var(--forsa-primary)",
              }}
            />

            {/* Lottie */}
            <div className="relative z-10 h-[230px] w-full max-w-[310px] sm:h-[270px] sm:max-w-[350px] lg:h-[300px] lg:max-w-[380px]">
              <DotLottieReact
                src={talentHero}
                loop
                autoplay
                className="h-full w-full"
              />
            </div>
          </motion.div>
        </div>

        {/* =====================================================
            FLOW
        ====================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-12 border-t border-neutral-100 pt-10"
        >
          <div className="grid gap-8 md:grid-cols-3 md:gap-0">
            {FLOW_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const styles = COLOR_STYLES[item.color];

              return (
                <div
                  key={item.label}
                  className={`group relative ${
                    index !== FLOW_ITEMS.length - 1
                      ? "md:border-r md:border-neutral-100 md:pr-8"
                      : ""
                  } ${
                    index !== 0
                      ? "md:pl-8"
                      : ""
                  }`}
                >
                  {/* Top */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:-translate-y-0.5 ${styles.icon}`}
                      >
                        <Icon className="text-xs" />
                      </div>

                      <span
                        className={`text-[9px] font-bold uppercase tracking-[0.15em] ${styles.number}`}
                      >
                        0{index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                      {item.label}
                    </p>

                    <h3 className="mt-1.5 text-base font-semibold tracking-[-0.02em] text-neutral-950 sm:text-lg">
                      {item.title}
                    </h3>

                    <p className="mt-2 max-w-xs text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Closing statement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10 flex justify-center border-t border-neutral-100 pt-6"
        >
          <p className="text-center text-[11px] leading-5 text-neutral-400">
            One platform. Better connections. More possibilities.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

