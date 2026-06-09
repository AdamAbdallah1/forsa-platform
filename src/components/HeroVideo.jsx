import { motion } from "framer-motion";
import { FaSearch, FaBriefcase, FaMapMarkerAlt } from "react-icons/fa";

export default function HeroVideo() {
  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-[2rem] border border-white/40 shadow-[0_30px_80px_rgba(15,23,42,0.22)]"
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative aspect-[4/3] min-h-[420px] lg:min-h-[520px]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/forsa-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/40 to-black/15" />

        <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
          <div>
            <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              Built for Lebanon
            </span>

            <h2 className="mt-5 max-w-md text-4xl font-bold leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
              Opportunities that move faster.
            </h2>

            <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-white/75 sm:text-base">
              Search jobs, internships, freelance gigs, and local projects without messy groups or random posts.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/95 p-2 shadow-xl backdrop-blur-md">
              <div className="flex flex-1 items-center gap-3 px-3 text-sm text-neutral-500">
                <FaSearch className="text-neutral-400" />
                Search opportunities...
              </div>

              <button className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white">
                Search
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/15 p-4 text-white backdrop-blur-md">
                <FaBriefcase className="mb-3 text-white/80" />
                <p className="text-sm font-semibold">Internships</p>
                <p className="text-xs text-white/65">Student-friendly roles</p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/15 p-4 text-white backdrop-blur-md">
                <FaMapMarkerAlt className="mb-3 text-white/80" />
                <p className="text-sm font-semibold">Near you</p>
                <p className="text-xs text-white/65">Lebanon-based posts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}