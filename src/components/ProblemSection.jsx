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
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="order-2 grid gap-3 lg:order-1">
        {problems.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-[26px] border border-[var(--forsa-border)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-primary)] text-white">
                  <Icon />
                </div>

                <div>
                  <p className="text-xs text-neutral-400">0{index + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">
                    {item.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="order-1 text-center lg:order-2 lg:text-left">
        <p className="text-sm font-medium text-neutral-500">Why Forsa</p>

        <h2 className="mx-auto mt-3 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl md:text-5xl lg:mx-0">
          Lebanon already has opportunities. They are just scattered.
        </h2>

        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-neutral-600 sm:text-base lg:mx-0">
          Forsa turns scattered posts into a clean opportunity network for
          people who want to work, hire, collaborate, and grow locally.
        </p>
      </div>
    </section>
  );
}
