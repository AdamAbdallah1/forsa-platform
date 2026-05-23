import { motion } from "framer-motion";
import { opportunities } from "../data/opportunities";

export default function MatchPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.1 }}
      className="mx-auto w-full max-w-md rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm lg:max-w-none"
    >
      <div className="mb-4 flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-sm font-medium">Latest opportunities</p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Real local-style posts, without the group chaos.
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[#f7f7f5] px-3 py-1 text-xs text-neutral-500">
          Lebanon
        </span>
      </div>

      <div className="space-y-3">
        {opportunities.slice(0, 3).map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-neutral-200 bg-[#fbfbfa] p-3"
            >
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
                  <Icon />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="line-clamp-2 font-medium leading-tight">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        {item.company} · {item.location}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs">
                      {item.type}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}