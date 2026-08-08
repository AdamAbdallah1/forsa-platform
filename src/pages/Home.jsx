import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import ctaHero from "../assets/cta-hero.lottie";
import forsaHero from "../assets/forsa-hero.lottie";

import SEO from "../components/SEO";
import FoldText from "../components/FoldText";
import WhyForsa from "../components/WhyForsa";
import HomeNavbar from "../components/HomeNavbar";
import TalentCompanySection from "../components/TalentCompanySection";
import Footer from "../components/Footer";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900">
      <SEO />
      <HomeNavbar />

      <main>
        {/* =====================================================
            HERO
        ====================================================== */}
        <section className="relative overflow-hidden">
          {/* Subtle background glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-160px] -z-10 h-[420px] w-[620px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--forsa-primary) 7%, transparent), transparent 70%)",
            }}
          />

          <div className="mx-auto max-w-6xl px-5 pb-14 pt-10 sm:px-8 sm:pb-16 sm:pt-14 lg:pb-18 lg:pt-16">
            <div className="grid items-center gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-4">
              {/* =================================================
                  LEFT — COPY
              ================================================== */}
              <div className="relative z-10 max-w-xl text-center lg:text-left">
                {/* Eyebrow */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-4 flex justify-center lg:justify-start"
                >

                </motion.div>

                {/* Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="text-4xl font-bold leading-[1] tracking-[-0.05em] text-neutral-950 sm:text-5xl lg:text-[4.35rem]"
                >
                  <span className="block">
                    Find the opportunity
                  </span>

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

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.12,
                  }}
                  className="mx-auto mt-5 max-w-lg text-sm leading-6 text-neutral-500 sm:text-base sm:leading-7 lg:mx-0"
                >
                  Discover jobs, internships, freelance work, and
                  projects from teams looking for talented people like
                  you.
                </motion.p>

                {/* Buttons */}
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

                {/* Opportunity types */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.28,
                  }}
                  className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-medium text-neutral-400 lg:justify-start"
                >
                  <span>Jobs</span>

                  <span className="h-1 w-1 rounded-full bg-neutral-300" />

                  <span>Internships</span>

                  <span className="h-1 w-1 rounded-full bg-neutral-300" />

                  <span>Freelance</span>

                  <span className="h-1 w-1 rounded-full bg-neutral-300" />

                  <span>Projects</span>
                </motion.div>
              </div>

              {/* =================================================
                  RIGHT — LOTTIE
              ================================================== */}
              <motion.div
                initial={{ opacity: 0, x: 18, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  duration: 0.65,
                  delay: 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative flex items-center justify-center lg:justify-end"
              >
                {/* Illustration glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] blur-3xl"
                  style={{
                    backgroundColor: "var(--forsa-primary)",
                  }}
                />

                {/* Lottie */}
                <div className="relative z-10 h-[280px] w-full max-w-[390px] sm:h-[330px] sm:max-w-[430px] lg:h-[390px] lg:max-w-[450px]">
                  <DotLottieReact
                    src={forsaHero}
                    loop
                    autoplay
                    className="block h-full w-full"
                  />
                </div>
              </motion.div>
            </div>

            {/* Divider */}
            <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
          </div>
        </section>

        {/* =====================================================
            WHY FORSA
        ====================================================== */}
        <WhyForsa />

        {/* =====================================================
            TALENT / TEAMS
        ====================================================== */}
        <TalentCompanySection />

        {/* =====================================================
            FINAL CTA
        ====================================================== */}
        <section className="border-t border-neutral-100 bg-neutral-50">
  <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-16 text-center sm:px-8 sm:py-20">
    {/* CTA Animation */}
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative mb-3 h-[150px] w-[150px] sm:h-[170px] sm:w-[170px]"
    >
      {/* Soft Forsa glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[110px] w-[110px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-3xl"
        style={{
          backgroundColor: "var(--forsa-primary)",
        }}
      />

      <DotLottieReact
        src={ctaHero}
        loop
        autoplay
        className="relative z-10 h-full w-full"
      />
    </motion.div>

    {/* Eyebrow */}
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

    {/* Heading */}
    <motion.h2
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.05 }}
      className="mt-3 text-2xl font-bold tracking-[-0.035em] text-neutral-950 sm:text-3xl"
    >
      Ready to find your next opportunity?
    </motion.h2>

    {/* Description */}
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-500"
    >
      Create your Forsa profile and discover opportunities that match
      where you want to go.
    </motion.p>

    {/* CTA */}
    <motion.button
      type="button"
      onClick={() => navigate("/auth")}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.16 }}
      className="group mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold text-white shadow-[0_7px_22px_rgba(82,39,255,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(82,39,255,0.2)]"
      style={{
        backgroundColor: "var(--forsa-primary)",
      }}
    >
      Get started

      <FaArrowRight className="text-[9px] transition-transform duration-200 group-hover:translate-x-1" />
    </motion.button>
  </div>
</section>
      </main>

      <Footer />
    </div>
  );
}