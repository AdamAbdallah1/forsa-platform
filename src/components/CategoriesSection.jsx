import {
  FaPenNib,
  FaBriefcase,
  FaBullhorn,
  FaGraduationCap,
} from "react-icons/fa";

const categories = [
  { icon: FaPenNib, title: "Design", text: "Branding, canvas structures, menus, asset creation." },
  { icon: FaBriefcase, title: "Part-time", text: "Cafés, local hubs, events, retail operations." },
  { icon: FaBullhorn, title: "Marketing", text: "Social engines, target outreach, growth systems." },
  { icon: FaGraduationCap, title: "Internships", text: "Student-optimized trajectories and professional tracks." },
];

export default function CategoriesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-20">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        
        {/* Dynamic Multi-Column Grid */}
        <div className="order-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:order-1">
          {categories.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group rounded-2xl border border-neutral-200/70 bg-white p-6 transition-all duration-300 ease-out hover:border-neutral-400 hover:shadow-[0_12px_30px_rgba(0,0,0,0.02)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700 border border-neutral-200/50 transition-colors duration-300 group-hover:bg-[var(--forsa-primary)] group-hover:text-white group-hover:border-transparent">
                  <Icon className="text-sm" />
                </div>

                <h3 className="mt-5 text-base font-bold tracking-tight text-neutral-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-neutral-500 font-medium">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* Floating Headers */}
        <div className="order-1 text-center lg:sticky lg:top-28 lg:order-2 lg:text-left space-y-4 max-w-xl mx-auto lg:mx-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--forsa-primary)]" />
            Categories
          </span>

          <h2 className="text-3xl font-bold tracking-[-0.04em] text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.1]">
            Not only jobs.<br className="hidden sm:inline" /> Real local opportunities.
          </h2>

          <p className="text-base leading-relaxed text-neutral-500 font-medium">
            Forsa maps cleanly to how people actually navigate work in Lebanon: agile freelance gigs, structured projects, specialized part-time loops, and direct internships.
          </p>
        </div>
      </div>
    </section>
  );
}