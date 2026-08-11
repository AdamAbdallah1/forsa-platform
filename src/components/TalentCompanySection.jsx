import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaUser,
  FaBuilding,
  FaCompass,
  FaCheckCircle,
} from "react-icons/fa";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import talentHero from "../assets/talent-hero.lottie";

const FLOW_ITEMS = [
  {
    step: "01",
    label: "Talent Profile",
    title: "Show what you can do.",
    description: "Create a portfolio-grade profile focused on skills, real accomplishments, and interests.",
    icon: FaUser,
    accent: "purple",
  },
  {
    step: "02",
    label: "Smart Discovery",
    title: "Find what fits.",
    description: "Algorithmic and search-driven discovery tuned to where you want your career to head.",
    icon: FaCompass,
    accent: "blue",
  },
  {
    step: "03",
    label: "Direct Connection",
    title: "Meet the right team.",
    description: "Direct outreach to verified companies actively seeking emerging talent.",
    icon: FaBuilding,
    accent: "emerald",
  },
];

const STYLES = {
  purple: {
    badge: "bg-purple-50 text-[var(--forsa-primary)] border-purple-100",
    line: "border-[var(--forsa-primary)]",
  },
  blue: {
    badge: "bg-blue-50 text-blue-600 border-blue-100",
    line: "border-blue-500",
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
    line: "border-emerald-500",
  },
};

export default function TalentCompanySection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* INTRO GRID */}
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >


            <h2 className="mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.045em] text-neutral-950 sm:text-4xl lg:text-[2.85rem]">
              From potential to{" "}
              <span style={{ color: "var(--forsa-primary)" }}>
                opportunity.
              </span>
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-500 sm:text-base sm:leading-7">
              Forsa makes the connection between capable candidates and forward-thinking companies direct, simple, and reliable.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center lg:justify-end"
          >
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

        {/* THREE-STEP CONNECTED FLOW */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-6 sm:p-10"
        >
          <div className="grid gap-8 md:grid-cols-3 md:gap-6">
            {FLOW_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const style = STYLES[item.accent];

              return (
                <div key={item.step} className="relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${style.badge}`}>
                        <Icon className="text-sm" />
                      </div>
                      <span className="font-mono text-xs font-bold text-neutral-400">
                        {item.step}
                      </span>
                    </div>

                    <div className="mt-5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {item.label}
                      </span>
                      <h3 className="mt-1 text-base font-bold tracking-tight text-neutral-950 sm:text-lg">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-neutral-500 sm:text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}