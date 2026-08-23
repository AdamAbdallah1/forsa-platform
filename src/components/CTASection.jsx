import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24 font-['Inter',sans-serif]">
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-[#E8E8EC] bg-[#F8F8FA] p-8 sm:p-12 lg:p-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-50"
            style={{
              background:
                "radial-gradient(100% 100% at 100% 0%, rgba(91, 61, 245, 0.08) 0%, rgba(255, 255, 255, 0) 100%)",
            }}
          />

          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#5B3DF5]/20 bg-[#5B3DF5]/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#5B3DF5]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5B3DF5]" />
                Start with Forsa
              </span>

              <h2 className="mt-4 text-2xl font-bold leading-[1.12] tracking-tight text-[#111113] sm:text-3xl lg:text-4xl font-['Sora',sans-serif]">
                Build your profile. Find opportunity. Connect directly.
              </h2>

              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#6B6B73] max-w-xl mx-auto lg:mx-0">
                A structured, modern talent ecosystem built specifically for Lebanon’s students, graduates, freelancers, and growing companies.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row justify-center lg:shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#5B3DF5] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#4930D4] active:scale-[0.99]"
              >
                <span>Join Forsa</span>
                <FaArrowRight className="text-xs transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/explore")}
                className="inline-flex items-center justify-center rounded-xl border border-[#E8E8EC] bg-white px-6 py-3.5 text-sm font-semibold text-[#111113] transition-all duration-150 hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]"
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