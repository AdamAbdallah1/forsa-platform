import Hero from "../components/Hero";
import MatchPreview from "../components/MatchPreview";
import ProblemSection from "../components/ProblemSection";
import HowItWorks from "../components/HowItWorks";
import CategoriesSection from "../components/CategoriesSection";
import OnboardingPreview from "../components/OnboardingPreview";
import CTASection from "../components/CTASection";

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-14 pt-8 sm:pb-16 sm:pt-10 lg:min-h-screen lg:grid-cols-[1fr_0.9fr] lg:pb-12">
        <Hero />
        <MatchPreview />
      </section>

      <ProblemSection />
      <HowItWorks />
      <CategoriesSection />
      <OnboardingPreview />
      <CTASection />
    </>
  );
}