import {
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaUsers,
} from "react-icons/fa";

const stats = [
  {
    icon: FaBriefcase,
    value: "120+",
    label: "Opportunities",
    text: "Jobs, gigs, internships",
  },
  {
    icon: FaBuilding,
    value: "35+",
    label: "Companies",
    text: "Local teams hiring",
  },
  {
    icon: FaUsers,
    value: "500+",
    label: "Applicants",
    text: "Students and freelancers",
  },
  {
    icon: FaCheckCircle,
    value: "Verified",
    label: "Trust layer",
    text: "Company verification",
  },
];

export default function LiveStats() {
  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-[var(--forsa-border)] bg-white shadow-sm">
        <div className="grid grid-cols-2 divide-x divide-y divide-[var(--forsa-border)] md:grid-cols-4 md:divide-y-0">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="group relative min-h-[150px] overflow-hidden p-4 transition hover:bg-[var(--forsa-bg)] sm:p-5 md:min-h-[170px] lg:p-6"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--forsa-gold-soft)]/40 blur-2xl opacity-0 transition duration-500 group-hover:opacity-100" />

                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--forsa-bg)] text-[var(--forsa-primary)] sm:h-11 sm:w-11">
                      <Icon className="text-sm" />
                    </div>

                    <span className="hidden rounded-full bg-white px-3 py-1 text-[11px] text-neutral-500 ring-1 ring-[var(--forsa-border)] sm:inline-flex">
                      Live
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">
                      {item.value}
                    </p>

                    <p className="mt-1 text-sm font-medium text-neutral-800">
                      {item.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-neutral-500 sm:text-sm">
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}