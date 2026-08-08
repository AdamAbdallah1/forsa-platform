import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import ctaHero from "../assets/cta-hero.lottie";
import heroBanner from "../assets/hero-banner.jpg";

import SEO from "../components/SEO";
import FoldText from "../components/FoldText";
import WhyForsa from "../components/WhyForsa";
import HomeNavbar from "../components/HomeNavbar";
import TalentCompanySection from "../components/TalentCompanySection";
import Footer from "../components/Footer";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <SEO />

      <HomeNavbar />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-180px] -z-10 h-[420px] w-[620px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--forsa-primary) 6%, transparent), transparent 70%)",
            }}
          />

          <div className="mx-auto flex min-h-[calc(100svh-72px)] max-w-7xl items-center px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-8">
            <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
              <div className="relative z-10 max-w-2xl text-center lg:text-left">
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="text-4xl font-bold leading-[0.98] tracking-[-0.055em] text-neutral-950 sm:text-5xl lg:text-[4.15rem]"
                >
                  <span className="block">Find the opportunity</span>

                  <span className="mt-1 block">
                    <FoldText
                      text="that fits you."
                      splitBy="word"
                      hinge="top"
                      trigger="mount"
                      duration={0.55}
                      stagger={0.07}
                      ease="power3.out"
                      perspective={900}
                      creaseShading={0.12}
                      fontSize="inherit"
                      fontWeight={700}
                      color="var(--forsa-primary)"
                      className="inline-block"
                    />
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.12,
                  }}
                  className="mx-auto mt-5 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base sm:leading-7 lg:mx-0"
                >
                  Discover relevant jobs, internships, projects, and
                  early-career opportunities based on where you're going.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.19,
                  }}
                  className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center lg:justify-start"
                >
                  <button
                    type="button"
                    onClick={() => navigate("/explore")}
                    className="group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-semibold text-white shadow-[0_7px_22px_rgba(82,39,255,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(82,39,255,0.22)]"
                    style={{
                      backgroundColor: "var(--forsa-primary)",
                    }}
                  >
                    Explore opportunities

                    <FaArrowRight className="text-[9px] transition-transform duration-200 group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-3 text-xs font-semibold text-neutral-800 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    I'm hiring
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.28,
                  }}
                  className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-medium text-neutral-400 lg:justify-start"
                >
                  <span>Jobs</span>

                  <span className="h-1 w-1 rounded-full bg-neutral-300" />

                  <span>Internships</span>

                  <span className="h-1 w-1 rounded-full bg-neutral-300" />

                  <span>Projects</span>

                  <span className="h-1 w-1 rounded-full bg-neutral-300" />

                  <span>Early careers</span>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 18, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  duration: 0.65,
                  delay: 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex w-full items-center justify-center lg:justify-end"
              >
                <div className="relative w-full max-w-[400px] sm:max-w-[430px] lg:max-w-[455px]">
                  <div className="relative overflow-hidden rounded-[1.25rem]">
  <img
    src={heroBanner}
    alt="Young professionals beginning their careers"
    className="block aspect-[4/4.5] w-full object-cover"
  />
</div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
          </div>
        </section>

        <WhyForsa />

        <TalentCompanySection />

        <section className="border-t border-neutral-100 bg-neutral-50">
          <div className="mx-auto flex min-h-[420px] max-w-6xl items-center px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
            <div className="grid w-full items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mx-auto h-[190px] w-full max-w-[270px] sm:h-[220px] sm:max-w-[300px]"
              >
                <DotLottieReact
                  src={ctaHero}
                  loop
                  autoplay
                  className="h-full w-full"
                />
              </motion.div>

              <div className="text-center lg:text-left">
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{
                    color: "var(--forsa-primary)",
                  }}
                >
                  Your next move starts here
                </motion.p>

                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.45,
                    delay: 0.05,
                  }}
                  className="mt-3 text-2xl font-bold tracking-[-0.035em] text-neutral-950 sm:text-3xl"
                >
                  Ready to find your next opportunity?
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.45,
                    delay: 0.1,
                  }}
                  className="mt-3 max-w-lg text-sm leading-6 text-neutral-500 lg:mx-0"
                >
                  Create your Forsa profile and discover opportunities
                  that match where you want to go.
                </motion.p>

                <motion.button
                  type="button"
                  onClick={() => navigate("/auth")}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.45,
                    delay: 0.16,
                  }}
                  className="group mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold text-white shadow-[0_7px_22px_rgba(82,39,255,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(82,39,255,0.2)]"
                  style={{
                    backgroundColor: "var(--forsa-primary)",
                  }}
                >
                  Get started

                  <FaArrowRight className="text-[9px] transition-transform duration-200 group-hover:translate-x-1" />
                </motion.button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}