import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="text-center lg:text-left"
    >

      <p className="mx-auto mb-4 w-fit rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-600 lg:mx-0">
        Built for Lebanese students, freelancers, and small businesses.
      </p>

      <h1 className="mx-auto max-w-2xl text-[38px] font-semibold leading-[0.98] tracking-[-0.05em] sm:text-[48px] md:text-[60px] lg:mx-0 lg:text-[64px]">
        Find work without digging through Facebook groups.
      </h1>

      <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8 lg:mx-0">
        Forsa helps students, freelancers, and small businesses connect through
        jobs, internships, gigs, and local projects.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
        <button
          onClick={() => navigate("/auth")}
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Create your profile
        </button>

        <button
          onClick={() => navigate("/explore")}
          className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-medium transition hover:border-neutral-500"
        >
          Explore opportunities
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-neutral-500 lg:justify-start">
        {["Internships", "Freelance gigs", "Part-time work"].map((item) => (
          <span
            key={item}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5"
          >
            {item}
          </span>
        ))}
      </div>
    </motion.div>
  );
}