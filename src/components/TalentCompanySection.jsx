import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBuilding,
  FaCompass,
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
  },
  {
    step: "02",
    label: "Smart Discovery",
    title: "Find what fits.",
    description: "Algorithmic and search-driven discovery tuned to where you want your career to head.",
    icon: FaCompass,
  },
  {
    step: "03",
    label: "Direct Connection",
    title: "Meet the right team.",
    description: "Direct outreach to verified companies actively seeking emerging talent.",
    icon: FaBuilding,
  },
];

export default function TalentCompanySection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24 font-['Inter',sans-serif]">
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45 }}
            className="max-w-xl"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B3DF5]">
              How Forsa Works
            </span>

            <h2 className="mt-2 text-2xl font-bold leading-[1.12] tracking-tight text-[#111113] sm:text-3xl lg:text-4xl font-['Sora',sans-serif]">
              From potential to{" "}
              <span className="text-[#5B3DF5]">opportunity.</span>
            </h2>

            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#6B6B73]">
              Forsa makes the connection between capable candidates and forward-thinking companies direct, simple, and reliable.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            <div className="relative z-10 h-[210px] w-full max-w-[290px] sm:h-[250px] sm:max-w-[330px] lg:h-[280px] lg:max-w-[360px]">
              <DotLottieReact
                src={talentHero}
                loop
                autoplay
                className="h-full w-full"
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mt-14 rounded-2xl p-6 sm:p-8"
        >
          <div className="grid gap-6 md:grid-cols-3">
            {FLOW_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.step}
                  className="flex flex-col justify-between rounded-xl border border-[#E8E8EC] bg-white p-5 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8E8EC] bg-[#F8F8FA] text-[#5B3DF5]">
                        <Icon className="text-sm" />
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#6B6B73]">
                        {item.step}
                      </span>
                    </div>

                    <div className="mt-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B73]">
                        {item.label}
                      </span>
                      <h3 className="mt-1 text-base font-semibold text-[#111113] font-['Sora',sans-serif]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#6B6B73]">
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