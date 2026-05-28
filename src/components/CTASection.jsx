import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-25 pt-20">
      <div className="relative overflow-hidden rounded-[36px] bg-[var(--forsa-primary)] p-8 text-white shadow-[0_24px_60px_rgba(82,39,255,0.25)] sm:p-12 md:p-16">
        {/* Subtle, premium backdrop light glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute left-10 bottom-0 h-48 w-48 rounded-full bg-black/15 blur-2xl" />

        <div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-center">
          <div className="text-center lg:text-left space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
              Start with Forsa
            </span>

            <h2 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl lg:text-5xl lg:leading-[1.05]">
              Build your profile. Find the opportunity. Send the message.
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-purple-100 font-medium max-w-xl mx-auto lg:mx-0">
              A cleaner ecosystem built intentionally for Lebanon’s ecosystem of students, freelancers, local creators, and small business networks.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row justify-center lg:shrink-0 w-full sm:w-auto">
            <button
              onClick={() => navigate("/auth")}
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-bold text-neutral-950 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-50"
            >
              Join Forsa
              <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => navigate("/explore")}
              className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/40"
            >
              Explore first
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}