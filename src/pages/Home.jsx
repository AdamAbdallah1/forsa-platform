import Hero from "../components/Hero";
import MatchPreview from "../components/MatchPreview";
import ProblemSection from "../components/ProblemSection";
import HowItWorks from "../components/HowItWorks";
import CategoriesSection from "../components/CategoriesSection";
import Grainient from "../components/ui/Grainient";
import CurvedLoop from "../components/CurvedLoop";
import OnboardingPreview from "../components/OnboardingPreview";
import CTASection from "../components/CTASection";
import WorkFlowOrbit from "../components/WorkFlowOrbit";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)]">
      <section className="relative min-h-[760px] overflow-hidden sm:min-h-[820px] lg:min-h-[calc(100vh-72px)]">
  <div className="pointer-events-none absolute inset-0 z-0">
    <Grainient
      color1="#ff9ffc"
      color2="#5227ff"
      color3="#b497cf"
      timeSpeed={0.18}
      grainAmount={0.08}
      contrast={1.35}
      saturation={1}
      zoom={0.9}
      className="opacity-90"
    />
  </div>

  <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_bottom,rgba(250,250,250,0.18),rgba(250,250,250,0.82)_68%,var(--forsa-bg))]" />

  <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45),transparent_55%)]" />

  <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 px-5 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:min-h-[calc(100vh-72px)] lg:grid-cols-[1fr_0.92fr] lg:gap-14 lg:pb-20">
    <Hero />
    <MatchPreview />
  </div>
</section>
<CurvedLoop
  marqueeText="Find work ✦ Hire talent ✦ Apply faster ✦ Verified companies ✦ Built for Lebanon ✦"
  speed={0.6}
  curveAmount={42}
  direction="left"
  interactive={false}
/>
      <ProblemSection />
      <HowItWorks />
      <CategoriesSection />
      <OnboardingPreview />
      <CTASection />
    </main>
  );
}