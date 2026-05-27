import { FaFacebookF, FaWhatsapp } from "react-icons/fa";

const problems = [
  {
    icon: FaFacebookF,
    title: "Good posts disappear",
    text: "Facebook groups move fast. Serious opportunities get buried under comments, spam, and repeated posts.",
  },
  {
    icon: FaWhatsapp,
    title: "WhatsApp is not searchable",
    text: "Jobs shared in chats are hard to save, filter, compare, or find again when you need them.",
  },
];

export default function ProblemSection() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
      {/* Structural placement left unchanged */}
      <div className="order-2 grid gap-4 lg:order-1">
        {problems.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="group rounded-2xl border border-[var(--forsa-border)] bg-white p-6 transition-all duration-300 hover:border-neutral-400 hover:shadow-[0_8px_30px_rgba(0,0,0,0.01)]"
            >
              <div className="flex items-start gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-600 border border-neutral-100 transition-colors duration-300 group-hover:bg-neutral-900 group-hover:text-white group-hover:border-transparent">
                  <Icon className="text-base" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">0{index + 1}</p>
                  <h3 className="text-base font-semibold tracking-tight text-neutral-950 sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-500">
                    {item.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="order-1 text-center lg:order-2 lg:text-left space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium tracking-wide text-neutral-500 uppercase">
          <span className="h-1 w-1 rounded-full bg-[var(--forsa-primary)]" />
          Why Forsa
        </span>

        <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.15] lg:mx-0">
          Lebanon already has opportunities. They are just scattered.
        </h2>

        <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-500 lg:mx-0">
          Forsa turns scattered posts into a clean opportunity network for
          people who want to work, hire, collaborate, and grow locally.
        </p>
      </div>
    </section>
  );
}