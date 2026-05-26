import {
  FaLaptopCode,
  FaPenNib,
  FaCamera,
  FaBriefcase,
  FaBullhorn,
  FaGraduationCap,
} from "react-icons/fa";

const categories = [
  { icon: FaLaptopCode, title: "Tech", text: "Websites, dashboards, frontend, support." },
  { icon: FaPenNib, title: "Design", text: "Branding, Canva posts, menus, visuals." },
  { icon: FaCamera, title: "Content", text: "Reels, photography, captions, creators." },
  { icon: FaBriefcase, title: "Part-time", text: "Cafés, events, shops, weekend shifts." },
  { icon: FaBullhorn, title: "Marketing", text: "Social media, offers, outreach, campaigns." },
  { icon: FaGraduationCap, title: "Internships", text: "Student-friendly experience and training." },
];

export default function CategoriesSection() {
  return (
    <section className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="order-2 grid gap-3 sm:grid-cols-2 lg:order-1">
        {categories.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="group rounded-[26px] border border-[var(--forsa-border)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] sm:p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--forsa-primary)] text-white transition group-hover:scale-105">
                <Icon className="text-sm" />
              </div>

              <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em]">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-7 text-neutral-600">
                {item.text}
              </p>
            </div>
          );
        })}
      </div>

      <div className="order-1 text-center lg:sticky lg:top-28 lg:order-2 lg:text-left">
        <p className="text-sm font-medium text-neutral-500">Categories</p>

        <h2 className="mx-auto mt-3 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl md:text-5xl lg:mx-0">
          Not only jobs. Real local opportunities.
        </h2>

        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-neutral-600 sm:text-base lg:mx-0">
          Forsa supports the work people actually search for in Lebanon: gigs,
          projects, part-time roles, internships, and collaborations.
        </p>
      </div>
    </section>
  );
}
