import Hero from "../components/Hero";
import MatchPreview from "../components/MatchPreview";
import ProblemSection from "../components/ProblemSection";
import LiveStats from "../components/LiveStats";
import HowItWorks from "../components/HowItWorks";
import CategoriesSection from "../components/CategoriesSection";
import OnboardingPreview from "../components/OnboardingPreview";
import CTASection from "../components/CTASection";
import AppHeader from "../components/AppHeader";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)]">

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70">
</div>
<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(250,250,250,0.72),rgba(250,250,250,0.95)_65%,var(--forsa-bg))]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/80 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-[360px] w-[360px] rounded-full bg-[var(--forsa-gold-soft)]/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-[360px] w-[360px] rounded-full bg-[var(--forsa-primary)]/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:min-h-[calc(100vh-72px)] lg:grid-cols-[1fr_0.92fr] lg:gap-14 lg:pb-20">
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