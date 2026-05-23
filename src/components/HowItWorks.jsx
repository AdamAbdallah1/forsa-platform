const steps = [
  {
    number: "01",
    title: "Create a profile",
    text: "Add your city, skills, and whether you are looking for work or hiring.",
  },
  {
    number: "02",
    title: "Browse opportunities",
    text: "Find internships, freelance gigs, part-time work, and small local projects.",
  },
  {
    number: "03",
    title: "Save or apply",
    text: "Save posts, apply with a message, and attach your CV metadata.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
      <div className="text-center lg:text-left">
        <p className="text-sm font-medium text-neutral-500">How it works</p>

        <h2 className="mx-auto mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl lg:mx-0">
          A cleaner way to find local work in Lebanon.
        </h2>

        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-neutral-600 sm:text-base lg:mx-0">
          No complex job board. No noisy feed. Just clear posts, simple
          profiles, and direct action.
        </p>
      </div>

      <div className="grid gap-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className="rounded-[26px] border border-neutral-200 bg-white p-5 sm:rounded-[28px] sm:p-6"
          >
            <p className="text-sm text-neutral-400">{step.number}</p>
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] sm:mt-6">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-neutral-600 sm:text-base">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}