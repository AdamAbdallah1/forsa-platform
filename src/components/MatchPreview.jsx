import { motion } from "framer-motion";
import { FaBookmark, FaPaperPlane } from "react-icons/fa";
import { opportunities } from "../data/opportunities";

export default function MatchPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-md rounded-3xl border border-[var(--forsa-border)] bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.02)] sm:p-6 lg:max-w-none"
    >
      <div className="space-y-5">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-neutral-950">
              Live opportunity feed
            </h4>
            <p className="mt-0.5 text-xs text-neutral-400">
              Clear posts. Searchable. Saved for later.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-white uppercase">
            Lebanon
          </span>
        </div>

        {/* Dynamic Items Stack */}
        <div className="space-y-3.5">
          {opportunities.slice(0, 2).map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="group rounded-2xl border border-[var(--forsa-border)] bg-white p-4 transition-all duration-300 hover:border-neutral-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.01)]"
              >
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-600 border border-neutral-100 transition-colors duration-300 group-hover:bg-[var(--forsa-primary)] group-hover:text-white group-hover:border-transparent">
                    <Icon className="text-sm" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h5 className="line-clamp-1 text-sm font-semibold text-neutral-950">
                          {item.title}
                        </h5>
                        <p className="mt-0.5 truncate text-xs text-neutral-400">
                          {item.company} · {item.location}
                        </p>
                      </div>

                      <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-700">
                        <FaBookmark className="text-[10px]" />
                      </button>
                    </div>

                    <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                      {item.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md border border-neutral-100 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                        {item.type}
                      </span>
                      <span className="rounded-md border border-neutral-100 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                        {item.pay || "Paid"}
                      </span>
                      {index === 0 && (
                        <span className="rounded-md bg-[var(--forsa-primary)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--forsa-primary)]">
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

        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--forsa-primary)] px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:brightness-110">
          <FaPaperPlane className="text-[10px]" />
          Apply in one message
        </button>
      </div>
    </motion.div>
  );
}