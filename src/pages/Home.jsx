import Hero from "../components/Hero";
import MatchPreview from "../components/MatchPreview";
import ProblemSection from "../components/ProblemSection";
import HowItWorks from "../components/HowItWorks";
import CategoriesSection from "../components/CategoriesSection";
import OnboardingPreview from "../components/OnboardingPreview";
import CTASection from "../components/CTASection";

export default function Home() {
  return (
    <main className="bg-[#f7f7f5] text-[#111111]">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:min-h-screen lg:grid-cols-[1fr_0.92fr] lg:gap-12 lg:pb-16">
          <Hero />
          <MatchPreview />
        </div>
      </section>

      <ProblemSection />
      <HowItWorks />
      <CategoriesSection />
      <OnboardingPreview />
      <CTASection />
    </main>
  );
}
