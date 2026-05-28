import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaCompass } from "react-icons/fa";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="text-center lg:text-left space-y-6 sm:space-y-8 max-w-2xl mx-auto lg:mx-0 pt-15"
    >
      <h1 className="text-[44px] font-bold leading-[0.92] tracking-[-0.05em] text-neutral-950 sm:text-[68px] md:text-[84px] lg:text-[88px]">
        Find work.
        <br />
        Hire talent.
        <span className="block text-[var(--forsa-primary)] mt-2 drop-shadow-[0_2px_10px_rgba(82,39,255,0.05)]">Without chaos.</span>
      </h1>

      <p className="text-base sm:text-lg leading-relaxed text-neutral-500 font-medium max-w-xl mx-auto lg:mx-0">
        Forsa helps students, freelancers, creators, and Lebanese businesses connect through clean profiles, verified companies, direct applications, and organized messages.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start pt-2">
        <button
          onClick={() => navigate("/auth")}
          className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[var(--forsa-primary)] px-8 py-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(82,39,255,0.25)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_16px_35px_rgba(82,39,255,0.35)]"
        >
          Join Forsa
          <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
        </button>

        <button
          onClick={() => navigate("/explore")}
          className="inline-flex items-center justify-center gap-2.5 rounded-full border border-neutral-200/80 bg-white/80 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-neutral-700 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-neutral-400 hover:text-neutral-900 hover:shadow-sm"
        >
          <FaCompass className="text-sm text-neutral-400" />
          Explore jobs
        </button>
      </div>
    </motion.div>
  );
}