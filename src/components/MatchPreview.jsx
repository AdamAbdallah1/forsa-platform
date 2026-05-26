import { motion } from "framer-motion";
import { FaBookmark, FaPaperPlane, FaSearch } from "react-icons/fa";
import { opportunities } from "../data/opportunities";

export default function MatchPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
      className="mx-auto w-full max-w-md rounded-[30px] border border-[var(--forsa-border)] bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.06)] lg:max-w-none"
    >


      <div className="px-2 pb-2 pt-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-[-0.02em]">
              Live opportunity feed
            </p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Clear posts. Searchable. Saved for later.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-[var(--forsa-green)] px-3 py-1 text-xs text-white">
            Lebanon
          </span>
        </div>

        <div className="space-y-3">
          {opportunities.slice(0, 2).map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="rounded-[22px] border border-[var(--forsa-border)] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-green)] text-white">
                    <Icon />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-sm font-semibold leading-tight">
                          {item.title}
                        </h3>
                        <p className="mt-1 truncate text-xs text-neutral-500">
                          {item.company} · {item.location}
                        </p>
                      </div>

                      <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--forsa-border)] bg-white text-neutral-500">
                        <FaBookmark className="text-xs" />
                      </button>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-600">
                      {item.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs text-neutral-600">
                        {item.type}
                      </span>
                      <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs text-neutral-600">
                        {item.pay || "Paid"}
                      </span>
                      {index === 0 && (
                        <span className="rounded-full bg-[var(--forsa-green)] px-3 py-1 text-xs text-white">
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

        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--forsa-green)] px-5 py-3 text-sm font-medium text-white">
          <FaPaperPlane className="text-xs" />
          Apply in one message
        </button>
      </div>
    </motion.div>
  );
}
