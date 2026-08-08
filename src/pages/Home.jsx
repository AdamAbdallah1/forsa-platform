import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

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
        {/* HERO */}
        <section className="relative overflow-hidden">
          {/* Very subtle Forsa atmosphere */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-120px] -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--forsa-primary) 10%, transparent), transparent 68%)",
            }}
          />

          <div className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-20 pt-16 text-center sm:px-8 sm:pb-24 sm:pt-24 lg:pt-28">
            
            {/* Heading */}
            <div className="max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="text-5xl font-bold leading-[1.02] tracking-[-0.05em] text-neutral-950 sm:text-6xl lg:text-7xl"
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
                    creaseShading={0.18}
                    fontSize="inherit"
                    fontWeight={700}
                    color="var(--forsa-primary)"
                    className="inline-block"
                  />
                </span>
              </motion.h1>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mt-7 max-w-2xl text-base leading-7 text-neutral-500 sm:text-lg"
            >
              Discover jobs, internships, freelance work, and projects from
              teams looking for talented people like you.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"
            >
              <button
                type="button"
                onClick={() => navigate("/explore")}
                className="group inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(82,39,255,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(82,39,255,0.22)]"
                style={{
                  backgroundColor: "var(--forsa-primary)",
                }}
              >
                Explore opportunities

                <FaArrowRight className="text-[10px] transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-7 py-3.5 text-sm font-semibold text-neutral-800 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50"
              >
                I'm hiring
              </button>
            </motion.div>

            {/* Opportunity types */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-neutral-400"
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
        </section>

        {/* WHY FORSA */}
        <WhyForsa />

        {/* TALENT / TEAMS */}
        <TalentCompanySection />

        {/* FINAL CTA */}
        <section className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-24">


            <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-neutral-950 sm:text-4xl">
              Ready to find your next opportunity?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-neutral-500">
              Create your Forsa profile and discover opportunities that match
              where you want to go.
            </p>

            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="group mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(82,39,255,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(82,39,255,0.2)]"
              style={{
                backgroundColor: "var(--forsa-primary)",
              }}
            >
              Get started

              <FaArrowRight className="text-[10px] transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
