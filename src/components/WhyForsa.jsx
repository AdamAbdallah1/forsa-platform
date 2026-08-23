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
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24 font-['Inter',sans-serif]"> 
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative z-10 h-[220px] w-full max-w-[300px] sm:h-[260px] sm:max-w-[340px] lg:h-[290px] lg:max-w-[370px]">
              <DotLottieReact
                src={whyHero}
                loop
                autoplay
                className="h-full w-full"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="max-w-xl"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B3DF5]">
              Why Forsa
            </span>

            <h2 className="mt-2 text-2xl font-bold leading-[1.12] tracking-tight text-[#111113] sm:text-3xl lg:text-4xl font-['Sora',sans-serif]">
              Opportunity should feel{" "}
              <span className="text-[#5B3DF5]">personal.</span>
            </h2>

            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#6B6B73]">
              Forsa removes outdated hiring clutter, giving talent and teams a clearer, direct path to align, connect, and build together.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium text-[#6B6B73]">
              <span className="rounded-md border border-[#E8E8EC] bg-white px-2.5 py-1 text-[#111113]">
                Talent First
              </span>
              <span className="rounded-md border border-[#E8E8EC] bg-white px-2.5 py-1 text-[#111113]">
                Direct Access
              </span>
              <span className="rounded-md border border-[#E8E8EC] bg-white px-2.5 py-1 text-[#111113]">
                Verified Roles
              </span>
            </div>
          </motion.div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.number}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="group relative rounded-xl border border-[#E8E8EC] bg-white p-6 transition-all duration-200 hover:border-[#5B3DF5]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#5B3DF5]/15 bg-[#5B3DF5]/5 text-[#5B3DF5]">
                    <Icon className="text-sm" />
                  </div>

                  <span className="font-mono text-xs font-semibold tracking-wider text-[#6B6B73]">
                    {feature.number}
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className="text-base font-semibold text-[#111113] font-['Sora',sans-serif]">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#6B6B73]">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[#5B3DF5]">
                  <span>Explore experience</span>
                  <FaArrowRight className="text-[10px] transition-transform duration-150 group-hover:translate-x-1" />
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-10 flex items-center justify-center"
        >
          <p className="text-center text-xs font-medium text-[#6B6B73]">
            Tailored for students, early-career professionals, founders, and growing companies.
          </p>
        </motion.div>
      </div>
    </section>
  );
}