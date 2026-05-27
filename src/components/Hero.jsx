import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaCompass } from "react-icons/fa";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="text-center lg:text-left space-y-6 sm:space-y-8"
    >
      <h1 className="mx-auto max-w-4xl text-[40px] font-bold leading-[0.95] tracking-tight text-neutral-950 sm:text-[64px] md:text-[80px] lg:mx-0 lg:text-[84px]">
        Find work.
        <br />
        Hire talent.
        <span className="block text-[var(--forsa-primary)] mt-1">Without chaos.</span>
      </h1>

      <p className="mx-auto max-w-xl text-base leading-relaxed text-neutral-500 sm:text-lg lg:mx-0">
        Forsa helps students, freelancers, creators, and Lebanese businesses connect through clean profiles, verified companies, direct applications, and organized messages.
      </p>

      <div className="flex flex-col gap-3.5 sm:flex-row sm:justify-center lg:justify-start">
        <button
          onClick={() => navigate("/auth")}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-7 py-3.5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(82,39,255,0.2)] transition-all duration-300 ease-out hover:brightness-110 hover:shadow-[0_15px_35px_rgba(82,39,255,0.3)]"
        >
          Join Forsa
          <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
        </button>

        <button
          onClick={() => navigate("/explore")}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-7 py-3.5 text-sm font-medium text-neutral-700 transition-all duration-300 ease-out hover:border-neutral-400 hover:text-neutral-900"
        >
          <FaCompass className="text-xs text-neutral-400" />
          Explore jobs
        </button>
      </div>
    </motion.div>
  );
}