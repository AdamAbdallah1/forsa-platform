import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 pb-28 sm:py-24">
      <div className="relative overflow-hidden rounded-3xl bg-[var(--forsa-primary)] p-8 text-white shadow-[0_20px_50px_rgba(82,39,255,0.25)] sm:p-12 md:p-16">
        {/* Subtle, premium backdrop light glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute left-10 bottom-0 h-44 w-44 rounded-full bg-black/10 blur-2xl" />

        <div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div className="text-center lg:text-left space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white uppercase backdrop-blur-sm">
              Start with Forsa
            </span>

            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:mx-0 lg:text-5xl lg:leading-[1.15]">
              Build your profile. Find the opportunity. Send the message.
            </h2>

            <p className="mx-auto max-w-xl text-sm leading-relaxed text-neutral-200 sm:text-base lg:mx-0">
              A cleaner place for Lebanon’s students, freelancers, creators, and small businesses to connect natively.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row justify-center lg:shrink-0">
            <button
              onClick={() => navigate("/auth")}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-neutral-950 transition-all duration-300 hover:bg-neutral-100"
            >
              Join Forsa
              <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => navigate("/explore")}
              className="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/40"
            >
              Explore first
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}