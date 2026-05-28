import { motion } from "framer-motion";
import { FaBookmark, FaPaperPlane } from "react-icons/fa";
import { opportunities } from "../data/opportunities";

export default function MatchPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-md rounded-[32px] border border-neutral-200/70 bg-white/90 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.03)] backdrop-blur-xl sm:p-6 lg:max-w-none lg:w-[105%] "
    >
      <div className="space-y-6">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-neutral-100">
          <div>
            <h4 className="text-sm font-bold tracking-tight text-neutral-950 uppercase">
              Live opportunity feed
            </h4>
            <p className="mt-0.5 text-xs font-medium text-neutral-400">
              Clear posts · Searchable · Saved for later
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-neutral-950 px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
            Lebanon
          </span>
        </div>

        {/* Dynamic Items Stack */}
        <div className="space-y-4">
          {opportunities.slice(0, 2).map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="group rounded-2xl border border-neutral-100 bg-white p-4 transition-all duration-300 hover:border-neutral-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.015)]"
              >
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-500 border border-neutral-200/60 transition-all duration-300 group-hover:bg-[var(--forsa-primary)] group-hover:text-white group-hover:border-transparent">
                    <Icon className="text-sm" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h5 className="line-clamp-1 text-sm font-bold text-neutral-950 tracking-tight">
                          {item.title}
                        </h5>
                        <p className="mt-0.5 truncate text-xs font-medium text-neutral-400">
                          {item.company} · {item.location}
                        </p>
                      </div>

                      <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-700">
                        <FaBookmark className="text-[9px]" />
                      </button>
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-neutral-500 font-medium">
                      {item.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md border border-neutral-200/60 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
                        {item.type}
                      </span>
                      <span className="rounded-md border border-neutral-200/60 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
                        {item.pay || "Paid"}
                      </span>
                      {index === 0 && (
                        <span className="rounded-md bg-[var(--forsa-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--forsa-primary)]">
                          Best fit
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--forsa-primary)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(82,39,255,0.15)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_6px_20px_rgba(82,39,255,0.2)]">
          <FaPaperPlane className="text-[10px]" />
          Apply in one message
        </button>
      </div>
    </motion.div>
  );
}