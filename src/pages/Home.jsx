import { motion } from "framer-motion";
import Hero from "../components/Hero";
import MatchPreview from "../components/MatchPreview";
import ProblemSection from "../components/ProblemSection";
import SEO from "../components/CEO";
import HowItWorks from "../components/HowItWorks";
import CategoriesSection from "../components/CategoriesSection";
import Grainient from "../components/ui/Grainient";
import Footer from "../components/Footer";
import CurvedLoop from "../components/CurvedLoop";
import OnboardingPreview from "../components/OnboardingPreview";
import CTASection from "../components/CTASection";

// Production variants for orchestrated section transitions
const sectionContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const fadeInUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)] antialiased overflow-x-hidden selection:bg-[var(--forsa-primary)] selection:text-white">
      
      {/* Premium Hero Wrapper */}
      <section className="relative min-h-[820px] sm:min-h-[880px] lg:min-h-[calc(100vh-72px)] flex items-center pt-20 pb-16 lg:py-0">
        {/* Ambient Layers */}
        <SEO title="Find work. Hire talent." />
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
            className="opacity-75"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-neutral-50/5 via-neutral-50/60 to-[var(--forsa-bg)]" />
        <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.6),transparent_70%)]" />

        {/* Content Layout */}
        <motion.div 
          className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
          initial="hidden"
          animate="visible"
          variants={sectionContainerVariants}
        >
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            <motion.div variants={fadeInUpVariant}>
              <Hero />
            </motion.div>
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.97 },
                visible: { 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { duration: 0.9, cubicBezier: [0.16, 1, 0.3, 1] } 
                }
              }}
            >
              <MatchPreview />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Fluid Decorative Marquee Loop */}
      <motion.div 
        className="py-5 border-y border-neutral-200/60 bg-white/30 backdrop-blur-md"
        initial={{ opacity: 0, scaleY: 0.8 }}
        whileInView={{ opacity: 1, scaleY: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <CurvedLoop
          marqueeText="Find work ✦ Hire talent ✦ Apply faster ✦ Verified companies ✦ Built for Lebanon ✦"
          speed={0.4}
          curveAmount={28}
          direction="left"
          interactive={false}
        />
      </motion.div>

      {/* Feature Blueprint Stack */}
      <div className="space-y-24 sm:space-y-32 md:space-y-40 my-16 sm:my-24">
        
        {/* Asymmetric Side Entry: Problem Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <ProblemSection />
        </motion.div>

        {/* Crisp Stagger Slide Entry: How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <HowItWorks />
        </motion.div>

        {/* Opposite Side Entry: Categories Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <CategoriesSection />
        </motion.div>

        {/* Custom Spring Bounce Entry: Onboarding Preview */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.99 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ 
            type: "spring",
            stiffness: 55,
            damping: 14,
            mass: 1.2
          }}
        >
          <OnboardingPreview />
        </motion.div>

        {/* Elite Scale Anchor Entry: CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 25 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <CTASection />
        </motion.div>

      </div>
      <Footer />
    </main>
  );
}