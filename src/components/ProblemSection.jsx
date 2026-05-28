import { FaFacebookF, FaWhatsapp } from "react-icons/fa";

const problems = [
  {
    icon: FaFacebookF,
    title: "Good posts disappear",
    text: "Facebook groups move fast. Serious opportunities get buried under comments, spam, and endless repeated posts.",
  },
  {
    icon: FaWhatsapp,
    title: "WhatsApp is not searchable",
    text: "Jobs shared in community groups are highly dynamic but impossible to save, filter, compare, or track safely.",
  },
];

export default function ProblemSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-20">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        
        {/* Visual Cards Layout */}
        <div className="order-2 grid gap-4 lg:order-1">
          {problems.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group rounded-2xl border border-neutral-200/70 bg-white p-5 sm:p-6 transition-all duration-300 hover:border-neutral-400 hover:shadow-[0_12px_30px_rgba(0,0,0,0.015)]"
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-600 border border-neutral-200/50 transition-colors duration-300 group-hover:bg-neutral-950 group-hover:text-white group-hover:border-transparent">
                    <Icon className="text-base" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">0{index + 1}</p>
                    <h3 className="text-base font-bold tracking-tight text-neutral-950 sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-500 font-medium">
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Text Presentation Column */}
        <div className="order-1 text-center lg:order-2 lg:text-left space-y-4 max-w-xl mx-auto lg:mx-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--forsa-primary)] animation-pulse" />
            Why Forsa
          </span>

          <h2 className="text-3xl font-bold tracking-[-0.04em] text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.1]">
            Lebanon already has opportunities. They are just scattered.
          </h2>

          <p className="text-base leading-relaxed text-neutral-500 font-medium">
            Forsa turns fragmented social media channels into a clean, searchable opportunity network optimized for students, local talent, and scaling builders.
          </p>
        </div>
      </div>
    </section>
  );
}