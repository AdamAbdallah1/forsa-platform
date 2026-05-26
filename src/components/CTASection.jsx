import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 pb-28 sm:px-6 sm:py-20 lg:pb-20">
      <div className="overflow-hidden rounded-[32px] border border-[var(--forsa-border)] bg-[var(--forsa-primary)] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.10)] sm:p-8 md:p-12">
        <div className="relative">
          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="text-center md:text-left">
              <p className="text-sm text-neutral-400">Start with Forsa</p>

              <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl md:mx-0 md:text-5xl">
                Build your profile. Find the opportunity. Send the message.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-300 sm:text-base md:mx-0">
                A cleaner place for Lebanon’s students, freelancers, creators,
                and small businesses to connect.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
              <button
                onClick={() => navigate("/auth")}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-neutral-200"
              >
                Join Forsa
                <FaArrowRight className="text-xs transition group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => navigate("/explore")}
                className="rounded-full border border-white/20 bg-transparent px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Explore first
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
