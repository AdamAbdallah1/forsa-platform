import { motion } from "framer-motion";
import Hero from "../components/Hero";
import ProblemSection from "../components/ProblemSection";
import SEO from "../components/SEO";
import HowItWorks from "../components/HowItWorks";
import CategoriesSection from "../components/CategoriesSection";
import Footer from "../components/Footer";
import CurvedLoop from "../components/CurvedLoop";
import OnboardingPreview from "../components/OnboardingPreview";
import CTASection from "../components/CTASection";

const sectionContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const fadeInUpVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfbfd] text-neutral-950 antialiased selection:bg-[var(--forsa-primary)] selection:text-white">
      <SEO title="Find work. Hire talent." />

      <section className="relative flex min-h-[760px] items-center overflow-hidden px-4 pt-24 pb-16 sm:min-h-[820px] sm:px-6 lg:min-h-[calc(100vh-72px)] lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(151,84,222,0.18),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(82,39,255,0.12),transparent_30%),linear-gradient(to_bottom,#ffffff,#fbfbfd)]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--forsa-primary)]/10 blur-3xl" />

        <motion.div
          className="relative z-10 mx-auto w-full max-w-7xl"
          initial="hidden"
          animate="visible"
          variants={sectionContainerVariants}
        >
          <motion.div variants={fadeInUpVariant}>
            <Hero />
          </motion.div>
        </motion.div>
      </section>

      <motion.div
        className="border-y border-neutral-200/70 bg-white/70 py-4 backdrop-blur-xl"
        initial={{ opacity: 0, scaleY: 0.9 }}
        whileInView={{ opacity: 1, scaleY: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <CurvedLoop
          marqueeText="Find work ✦ Hire talent ✦ Apply faster ✦ Verified companies ✦ Built for Lebanon ✦"
          speed={0.4}
          curveAmount={22}
          direction="left"
          interactive={false}
        />
      </motion.div>

      <div className="my-16 space-y-24 sm:my-24 sm:space-y-32 md:space-y-40">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <ProblemSection />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <HowItWorks />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <CategoriesSection />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.99 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ type: "spring", stiffness: 55, damping: 14, mass: 1.2 }}
        >
          <OnboardingPreview />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 24 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <CTASection />
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}