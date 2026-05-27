import Hero from "../components/Hero";
import MatchPreview from "../components/MatchPreview";
import ProblemSection from "../components/ProblemSection";
import HowItWorks from "../components/HowItWorks";
import CategoriesSection from "../components/CategoriesSection";
import Grainient from "../components/ui/Grainient";
import CurvedLoop from "../components/CurvedLoop";
import OnboardingPreview from "../components/OnboardingPreview";
import CTASection from "../components/CTASection";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)] antialiased overflow-x-hidden">
      {/* Premium Hero Wrapper */}
      <section className="relative min-h-[780px] overflow-hidden sm:min-h-[860px] lg:min-h-[calc(100vh-72px)] flex items-center">
        {/* Ambient Layers */}
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
            className="opacity-80"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-neutral-50/10 via-neutral-50/70 to-[var(--forsa-bg)]" />
        <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.5),transparent_60%)]" />

        {/* Content Layout */}
        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Hero />
          <MatchPreview />
        </div>
      </section>

      {/* Fluid Decorative Marquee Loop */}
      <div className="py-4 border-y border-[var(--forsa-border)] bg-white/40 backdrop-blur-sm">
        <CurvedLoop
          marqueeText="Find work ✦ Hire talent ✦ Apply faster ✦ Verified companies ✦ Built for Lebanon ✦"
          speed={0.5}
          curveAmount={35}
          direction="left"
          interactive={false}
        />
      </div>

      {/* Feature Blueprint Stack */}
      <div className="space-y-4 sm:space-y-8 md:space-y-12">
        <ProblemSection />
        <HowItWorks />
        <CategoriesSection />
        <OnboardingPreview />
        <CTASection />
      </div>
    </main>
  );
}