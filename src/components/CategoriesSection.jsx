import {
  FaPenNib,
  FaBriefcase,
  FaBullhorn,
  FaGraduationCap,
} from "react-icons/fa";

const categories = [
  { icon: FaPenNib, title: "Design", text: "Branding, Canva posts, menus, visuals." },
  { icon: FaBriefcase, title: "Part-time", text: "Cafés, events, shops, weekend shifts." },
  { icon: FaBullhorn, title: "Marketing", text: "Social media, offers, outreach, campaigns." },
  { icon: FaGraduationCap, title: "Internships", text: "Student-friendly experience and training." },
];

export default function CategoriesSection() {
  return (
    <section className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
      {/* Kept identical layout proportions and mobile logic */}
      <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
        {categories.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="group rounded-2xl border border-[var(--forsa-border)] bg-white p-6 transition-all duration-300 ease-out hover:border-neutral-400 hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700 border border-neutral-100 transition-colors duration-300 group-hover:bg-[var(--forsa-primary)] group-hover:text-white group-hover:border-transparent">
                <Icon className="text-base" />
              </div>

              <h3 className="mt-6 text-base font-semibold tracking-tight text-neutral-950">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {item.text}
              </p>
            </div>
          );
        })}
      </div>

      <div className="order-1 text-center lg:sticky lg:top-28 lg:order-2 lg:text-left space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium tracking-wide text-neutral-500 uppercase">
          <span className="h-1 w-1 rounded-full bg-[var(--forsa-primary)]" />
          Categories
        </span>

        <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.15] lg:mx-0">
          Not only jobs.<br className="hidden sm:inline" /> Real local opportunities.
        </h2>

        <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-500 lg:mx-0">
          Forsa supports the work people actually search for in Lebanon: gigs,
          projects, part-time roles, internships, and collaborations.
        </p>
      </div>
    </section>
  );
}