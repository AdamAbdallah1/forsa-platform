import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaUser,
  FaBuilding,
  FaCompass,
  FaComments,
} from "react-icons/fa";

const FLOW_ITEMS = [
  {
    label: "Talent",
    title: "Show what you can do.",
    description:
      "Create a profile around your skills, interests, and goals.",
    icon: FaUser,
    color: "purple",
  },
  {
    label: "Discover",
    title: "Find what fits.",
    description:
      "Explore opportunities that match where you want to go.",
    icon: FaCompass,
    color: "blue",
  },
  {
    label: "Teams",
    title: "Meet the right people.",
    description:
      "Connect with companies looking for people like you.",
    icon: FaBuilding,
    color: "emerald",
  },
];

const COLOR_STYLES = {
  purple: {
    icon: "bg-purple-50 text-[var(--forsa-primary)] border-purple-100",
    number: "text-[var(--forsa-primary)]",
  },
  blue: {
    icon: "bg-blue-50 text-blue-600 border-blue-100",
    number: "text-blue-600",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 border-emerald-100",
    number: "text-emerald-600",
  },
};

export default function TalentCompanySection() {
  const navigate = useNavigate();

  return (
    <section className="relative bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-neutral-200/80 pb-10 md:flex-row md:items-end">
          <div className="max-w-2xl">
       

            <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
              From potential to opportunity.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base">
              Forsa makes the connection between capable people and the teams
              that need them simpler, clearer, and more direct.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="group inline-flex w-fit shrink-0 items-center gap-2 text-xs font-bold text-neutral-700 transition-colors hover:text-[var(--forsa-primary)]"
          >
            Get started
            <FaArrowRight className="text-[9px] transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Flow */}
        <div className="relative mt-10">
          {/* Desktop connecting line */}
          <div
            aria-hidden="true"
            className="absolute left-[16.66%] right-[16.66%] top-[34px] hidden h-px bg-gradient-to-r from-purple-200 via-blue-200 to-emerald-200 lg:block"
          />

          <div className="grid gap-4 lg:grid-cols-3 lg:gap-0">
            {FLOW_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const styles = COLOR_STYLES[item.color];

              return (
                <div
                  key={item.label}
                  className="group relative px-0 lg:px-8"
                >
                  {/* Step number / icon */}
                  <div className="relative flex items-center gap-4">
                    <div
                      className={`relative z-10 flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm transition-transform duration-300 group-hover:-translate-y-1 ${styles.icon}`}
                    >
                      <Icon className="text-lg" />
                    </div>

                    <div className="lg:hidden">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-[0.14em] ${styles.number}`}
                      >
                        0{index + 1}
                      </span>

                      <p className="mt-0.5 text-xs font-semibold text-neutral-400">
                        {item.label}
                      </p>
                    </div>

                    <span
                      className={`absolute -top-3 left-14 hidden text-[10px] font-bold lg:block ${styles.number}`}
                    >
                      0{index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="mt-5 pl-[84px] lg:pl-0">
                    <span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400 lg:block">
                      {item.label}
                    </span>

                    <h3 className="mt-1 text-lg font-bold tracking-[-0.02em] text-neutral-950 sm:text-xl">
                      {item.title}
                    </h3>

                    <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500">
                      {item.description}
                    </p>
                  </div>

                  {/* Mobile connector */}
                  {index < FLOW_ITEMS.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="ml-[33px] mt-5 h-5 w-px bg-neutral-200 lg:hidden"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Small closing bar */}
        
      </div>
    </section>
  );
}