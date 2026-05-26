import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaBriefcase, FaCheckCircle, FaCompass } from "react-icons/fa";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="text-center lg:text-left"
    >
      <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white/85 px-3.5 py-2 text-xs font-medium text-neutral-600 shadow-sm backdrop-blur lg:mx-0">
        <span className="h-2 w-2 rounded-full bg-[var(--forsa-gold)]" />
        Lebanon’s opportunity platform
      </div>

      <h1 className="mx-auto mt-5 max-w-4xl text-[44px] font-semibold leading-[0.9] tracking-[-0.075em] text-[var(--forsa-text)] sm:text-[64px] md:text-[82px] lg:mx-0 lg:text-[88px]">
        Find work.
        <br />
        Hire talent.
        <span className="block text-[var(--forsa-primary)]">Without chaos.</span>
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-[15px] leading-7 text-neutral-600 sm:text-lg sm:leading-8 lg:mx-0">
        Forsa helps students, freelancers, creators, and Lebanese businesses connect through clean profiles, verified companies, direct applications, and organized messages.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
        <button
          onClick={() => navigate("/auth")}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-6 py-3.5 text-sm font-medium text-white shadow-[0_14px_35px_rgba(18,60,47,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--forsa-primary-light)]"
        >
          Join Forsa
          <FaArrowRight className="text-xs transition group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => navigate("/explore")}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-6 py-3.5 text-sm font-medium transition hover:-translate-y-0.5 hover:border-[var(--forsa-primary)]"
        >
          <FaCompass className="text-xs" />
          Explore jobs
        </button>
      </div>
    </motion.div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="rounded-2xl border border-[var(--forsa-border)] bg-white/85 p-3 shadow-sm backdrop-blur">
      <div className="mb-2 flex justify-center text-[var(--forsa-primary)] lg:justify-start">
        {icon}
      </div>
      <p className="text-sm font-semibold tracking-[-0.02em]">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-neutral-500">{label}</p>
    </div>
  );
}