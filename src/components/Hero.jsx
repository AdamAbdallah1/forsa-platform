import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { FaArrowRight, FaCompass } from "react-icons/fa";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="text-center lg:text-left"
    >
      <div className="mx-auto w-fit rounded-full border border-[var(--forsa-border)] bg-white/80 px-3.5 py-2 text-xs font-medium text-neutral-600 shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur lg:mx-0">
        Lebanon’s modern opportunity network
      </div>

      <h1 className="mx-auto mt-5 max-w-3xl text-[42px] font-semibold leading-[0.95] tracking-[-0.06em] text-[#111] sm:text-[56px] md:text-[70px] lg:mx-0 lg:text-[74px]">
        Work, gigs, and talent without the group chaos.
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-[15px] leading-7 text-neutral-600 sm:text-lg sm:leading-8 lg:mx-0">
        Forsa helps Lebanese students, freelancers, creators, and small
        businesses find each other through clean profiles, clear posts, and
        direct applications.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
        <button
          onClick={() => navigate("/auth")}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--forsa-green)] px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-[var(--forsa-green-light)]"
        >
          Join Forsa
          <FaArrowRight className="text-xs transition group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => navigate("/explore")}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:border-neutral-500"
        >
          <FaCompass className="text-xs" />
          Explore first
        </button>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-2 text-center sm:max-w-md lg:text-left">
        <Stat value="1 place" label="for local work" />
        <Stat value="Fast" label="applications" />
        <Stat value="Built" label="for Lebanon" />
      </div>
    </motion.div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-[var(--forsa-border)] bg-white/80 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <p className="text-sm font-semibold tracking-[-0.02em]">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-neutral-500">{label}</p>
    </div>
  );
}
