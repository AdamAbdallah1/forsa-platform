import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaSearch,
  FaMapMarkerAlt,
  FaChevronDown,
} from "react-icons/fa";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import ctaHero from "../assets/cta-hero.lottie";
import SEO from "../components/SEO";
import FoldText from "../components/FoldText";
import WhyForsa from "../components/WhyForsa";
import HomeNavbar from "../components/HomeNavbar";
import TalentCompanySection from "../components/TalentCompanySection";
import Footer from "../components/Footer";

export default function Home() {
  const navigate = useNavigate();
  const goToLogin = () => {
  navigate("/auth?mode=login");
};

const goToSignup = () => {
  navigate("/auth?mode=signup");
};

  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    const query = searchQuery.trim();
    const selectedLocation = location.trim();

    if (query) {
      params.set("q", query);
    }

    if (selectedLocation) {
      params.set("location", selectedLocation);
    }

    const queryString = params.toString();

    navigate(queryString ? `/explore?${queryString}` : "/explore");
  };

  const handleQuickTag = (tag) => {
    navigate(`/explore?q=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-neutral-900 selection:bg-[var(--forsa-primary)] selection:text-white">
      <SEO />

      <HomeNavbar />

      <main className="relative">
        <section className="relative flex min-h-[calc(100svh-64px)] flex-col items-center overflow-hidden px-4 pb-8 pt-4 sm:min-h-[calc(100svh-72px)] sm:px-6 sm:pb-10 sm:pt-6 lg:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[28%] -z-0 h-[300px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-60 sm:top-1/3 sm:h-[500px] sm:w-[700px] sm:opacity-70"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--forsa-primary) 10%, transparent), transparent 70%)",
            }}
          />

          <div className="relative z-10 flex w-full max-w-5xl flex-1 flex-col items-center justify-center py-5 text-center sm:py-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex max-w-full items-center justify-center rounded-full border border-neutral-200/80 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold text-neutral-600 sm:text-[11px]"
            >
              <span>The Early-Career & Opportunity Ecosystem</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mx-auto mt-5 max-w-4xl text-[2rem] font-bold leading-[1.04] tracking-[-0.055em] text-neutral-950 sm:mt-6 sm:text-5xl sm:leading-[0.98] lg:text-[4.25rem]"
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
              className="mx-auto mt-4 max-w-[34rem] px-3 text-sm leading-6 text-neutral-500 sm:mt-6 sm:px-0 sm:text-base sm:leading-7"
            >
              Discover jobs, internships, projects, and early-career
              opportunities that match where you're going.
            </motion.p>

            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.19,
              }}
              className="mt-6 flex w-full max-w-3xl flex-col gap-1.5 rounded-2xl border border-neutral-200/90 bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300 focus-within:shadow-[0_12px_40px_rgb(82,39,255,0.12)] sm:mt-8 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:p-2"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-0">
                <FaSearch className="shrink-0 text-sm text-neutral-400" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Job title, keyword, or skill..."
                  aria-label="Search jobs, keywords, or skills"
                  className="w-full min-w-0 bg-transparent text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
                />
              </div>

              <div className="hidden h-6 w-px bg-neutral-200 sm:block" />

              <div className="relative flex min-w-0 flex-1 items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-0">
                <FaMapMarkerAlt className="shrink-0 text-sm text-neutral-400" />

                <div className="relative flex min-w-0 w-full items-center">
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    aria-label="Select location"
                    className="z-10 w-full cursor-pointer appearance-none truncate bg-transparent pr-7 text-sm font-semibold text-neutral-800 outline-none"
                  >
                    <option value="">All Locations</option>
                    <option value="Beirut">Beirut</option>
                    <option value="Mount Lebanon">Mount Lebanon</option>
                    <option value="Tripoli">Tripoli</option>
                    <option value="Sidon">Sidon</option>
                    <option value="Zahle">Zahle</option>
                    <option value="Remote">Remote</option>
                  </select>

                  <FaChevronDown className="pointer-events-none absolute right-1 text-[10px] text-neutral-400" />
                </div>
              </div>

              <button
                type="submit"
                className="group inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-95 active:scale-[0.98] sm:w-auto sm:rounded-full"
                style={{
                  backgroundColor: "var(--forsa-primary)",
                }}
              >
                Search

                <FaArrowRight className="text-[9px] transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.45,
                delay: 0.25,
              }}
              className="mt-4 flex max-w-full flex-wrap items-center justify-center gap-1.5 px-1 text-xs text-neutral-500 sm:gap-2"
            >
              <span className="mr-0.5 font-medium text-neutral-400">
                Popular:
              </span>

              {[
                "Software Engineer",
                "Graphic Design",
                "Marketing",
                "Remote Internship",
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTag(tag)}
                  className="min-h-9 rounded-full border border-neutral-200/80 bg-neutral-50/80 px-3 py-1.5 text-[11px] font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-100 active:scale-[0.97]"
                >
                  {tag}
                </button>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.3,
              }}
              className="mt-5 flex w-full max-w-sm items-center justify-center gap-2.5 sm:hidden"
            >
              <button
  type="button"
  onClick={goToLogin}
  className="min-h-11 flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98]"
>
Login
</button>

<button
  type="button"
  onClick={goToSignup}
  className="min-h-11 flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-95 active:scale-[0.98]"
  style={{
    backgroundColor: "var(--forsa-primary)",
  }}
>
  Get Started
</button> 
            </motion.div>
          </div>
        </section>

        <div className="relative z-10 -my-3 flex justify-center">
          <div className="h-8 w-px bg-gradient-to-b from-[var(--forsa-primary)]/40 to-transparent" />
        </div>

        <WhyForsa />

        <div className="relative z-10 -my-3 flex justify-center">
          <div className="h-8 w-px bg-gradient-to-b from-neutral-200 to-neutral-300" />
        </div>

        <TalentCompanySection />

        <section className="relative overflow-hidden border-t border-neutral-200/60 bg-gradient-to-b from-white via-neutral-50/50 to-neutral-100/60 py-12 sm:py-16 lg:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[240px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-50 sm:h-[350px] sm:w-[550px] sm:opacity-60"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--forsa-primary) 12%, transparent), transparent 70%)",
            }}
          />

          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-8 lg:px-10">
            <div className="rounded-3xl border border-neutral-200/90 bg-white/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)] backdrop-blur-md sm:p-8 lg:p-12">
              <div className="grid w-full items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="mx-auto h-[150px] w-full max-w-[220px] sm:h-[220px] sm:max-w-[300px]"
                >
                  <DotLottieReact
                    src={ctaHero}
                    loop
                    autoplay
                    aria-label="Illustration showing career opportunities"
                    className="h-full w-full"
                  />
                </motion.div>

                <div className="text-center lg:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--forsa-primary)]"
                  >
                    <span>Ready to get started?</span>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: 0.05,
                    }}
                    className="mt-1 text-2xl font-bold tracking-[-0.035em] text-neutral-950 sm:text-3xl lg:text-4xl"
                  >
                    Take the next step in your journey
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: 0.1,
                    }}
                    className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-500 sm:text-base lg:mx-0"
                  >
                    Whether you're seeking your next role or building a team,
                    Forsa provides direct access to opportunities and verified
                    talent.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: 0.16,
                    }}
                    className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row lg:justify-start"
                  >
                    <button
                      type="button"
                      onClick={goToSignup}
                      className="group inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 sm:w-auto"
                      style={{
                        backgroundColor: "var(--forsa-primary)",
                        boxShadow:
                          "0 8px 24px -4px color-mix(in srgb, var(--forsa-primary) 35%, transparent)",
                      }}
                    >
                      Get Started

                      <FaArrowRight className="text-[9px] transition-transform duration-200 group-hover:translate-x-1" />
                    </button>

                    <button
                      type="button"
                      onClick={goToLogin}

                      className="inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full border border-neutral-200 bg-neutral-50/80 px-6 py-3 text-sm font-bold text-neutral-800 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-100 active:scale-[0.98] sm:w-auto"
                    >
                      Login
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}