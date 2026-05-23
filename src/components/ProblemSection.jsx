const problems = [
  {
    title: "Facebook groups are messy",
    text: "Good posts get buried fast. Comments are chaotic. Serious opportunities are hard to identify.",
  },
  {
    title: "WhatsApp posts disappear",
    text: "Jobs shared in groups or channels are hard to search, save, filter, or check later.",
  },
];

export default function ProblemSection() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
      <div className="order-2 grid gap-4 lg:order-1">
        {problems.map((item, index) => (
          <div
            key={item.title}
            className="rounded-[26px] border border-neutral-200 bg-white p-5 sm:rounded-[28px] sm:p-6"
          >
            <p className="text-sm text-neutral-400">0{index + 1}</p>
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-neutral-600 sm:text-base">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      <div className="order-1 text-center lg:order-2 lg:text-left">
        <p className="text-sm font-medium text-neutral-500">Why Forsa</p>

        <h2 className="mx-auto mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl lg:mx-0">
          Lebanon already has opportunities. They are just scattered everywhere.
        </h2>

        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-neutral-600 sm:text-base lg:mx-0">
          Forsa organizes local work, projects, and talent into one simple place
          built for how people actually find work here.
        </p>
      </div>
    </section>
  );
}