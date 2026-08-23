import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaSearch,
  FaMapMarkerAlt,
  FaChevronDown,
  FaBuilding,
  FaClock,
  FaLaptopCode,
  FaCode,
  FaGlobe,
} from "react-icons/fa";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import ctaHero from "../assets/cta-hero.lottie";
import SEO from "../components/SEO";
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
    <div className="min-h-screen overflow-x-hidden bg-white text-[#111113] selection:bg-[#5B3DF5] selection:text-white font-['Inter',sans-serif]">
      <SEO />
      <HomeNavbar />

      <main className="relative">
        <section className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20 bg-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[350px] opacity-40"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 0%, rgba(91, 61, 245, 0.08) 0%, rgba(255, 255, 255, 0) 100%)",
            }}
          />

          <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-2 rounded-full border border-[#E8E8EC] bg-[#F8F8FA] px-3 py-0.5 text-[11px] font-semibold tracking-wide text-[#6B6B73] uppercase"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#5B3DF5]" />
                The Early-Career Opportunity Platform
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.04 }}
                className="mt-3 text-2xl font-bold tracking-tight text-[#111113] sm:text-4xl lg:text-5xl font-['Sora',sans-serif] leading-[1.1]"
              >
                Find where your next{" "}
                <span className="text-[#5B3DF5]">opportunity</span> starts.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 }}
                className="mt-2.5 text-xs sm:text-sm lg:text-base leading-normal text-[#6B6B73] max-w-2xl mx-auto font-normal"
              >
                Jobs, internships, freelance work, and early-career opportunities across Lebanon in one structured ecosystem.
              </motion.p>

              <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12 }}
                className="mt-5 rounded-xl border border-[#E8E8EC] bg-white p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-200 focus-within:border-[#5B3DF5]/40 focus-within:shadow-[0_4px_20px_rgba(91,61,245,0.08)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-2.5 px-3 py-2 sm:py-1">
                    <FaSearch className="text-xs text-[#6B6B73] shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Role, skill, or keywords..."
                      aria-label="Search jobs, keywords, or skills"
                      className="w-full bg-transparent text-xs font-medium text-[#111113] placeholder-[#6B6B73] outline-none"
                    />
                  </div>

                  <div className="hidden h-6 w-px bg-[#E8E8EC] sm:block" />
                  <div className="h-px w-full bg-[#E8E8EC] sm:hidden" />

                  <div className="flex flex-1 items-center gap-2.5 px-3 py-2 sm:py-1">
                    <FaMapMarkerAlt className="text-xs text-[#6B6B73] shrink-0" />
                    <div className="relative w-full">
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        aria-label="Select location"
                        className="w-full cursor-pointer appearance-none bg-transparent pr-5 text-xs font-medium text-[#111113] outline-none"
                      >
                        <option value="">All Locations</option>
                        <option value="Beirut">Beirut</option>
                        <option value="Mount Lebanon">Mount Lebanon</option>
                        <option value="Tripoli">Tripoli</option>
                        <option value="Sidon">Sidon</option>
                        <option value="Zahle">Zahle</option>
                        <option value="Remote">Remote</option>
                      </select>
                      <FaChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-[#6B6B73]" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-1.5 sm:mt-0 flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#5B3DF5] px-5 py-2.5 text-xs font-semibold text-white transition-all duration-150 hover:bg-[#4930D4] active:scale-[0.99]"
                  >
                    <span>Search</span>
                    <FaArrowRight className="text-[10px]" />
                  </button>
                </div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.16 }}
                className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px]"
              >
                <span className="text-[#6B6B73] font-medium">Quick search:</span>
                {[
                  { label: "Jobs", query: "Full-time" },
                  { label: "Internships", query: "Internship" },
                  { label: "Freelance", query: "Freelance" },
                  { label: "Projects", query: "Project" },
                  { label: "Remote", query: "Remote" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuickTag(item.query)}
                    className="rounded-md border border-[#E8E8EC] bg-[#F8F8FA] px-2 py-0.5 text-[11px] font-medium text-[#111113] transition-colors hover:border-neutral-300 hover:bg-neutral-100"
                  >
                    {item.label}
                  </button>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.18 }}
                className="mt-4 flex items-center justify-center gap-2.5 sm:hidden"
              >
                <button
                  type="button"
                  onClick={goToLogin}
                  className="flex-1 rounded-lg border border-[#E8E8EC] bg-white py-2 text-xs font-semibold text-[#111113]"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={goToSignup}
                  className="flex-1 rounded-lg bg-[#5B3DF5] py-2 text-xs font-semibold text-white"
                >
                  Get Started
                </button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="mt-6 sm:mt-8 lg:mt-10"
            >
              <div className="relative mx-auto max-w-4xl rounded-xl  bg-[#F8F8FA] p-2.5 sm:p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between  pb-2 px-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-neutral-300" />
                    <span className="h-2 w-2 rounded-full bg-neutral-300" />
                    <span className="h-2 w-2 rounded-full bg-neutral-300" />
                    <span className="ml-1.5 text-[11px] font-medium text-[#6B6B73]">
                      Forsa Live Feed
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#5B3DF5] bg-[#5B3DF5]/10 px-2 py-0.5 rounded">
                    Verified Opportunities
                  </span>
                </div>

                <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#E8E8EC] bg-white p-3 shadow-xs">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E8E8EC] bg-[#F8F8FA] text-[#5B3DF5]">
                          <FaCode className="text-xs" />
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-[#111113]">
                            Frontend Developer
                          </h3>
                          <p className="text-[11px] text-[#6B6B73] flex items-center gap-1 mt-0.5">
                            <FaBuilding className="text-[9px]" /> Tech Corp · Beirut
                          </p>
                        </div>
                      </div>
                      <span className="rounded bg-[#F8F8FA] px-1.5 py-0.5 text-[10px] font-medium text-[#111113]">
                        Full-time
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-[#E8E8EC] pt-2 text-[11px] text-[#6B6B73]">
                      <div className="flex gap-1">
                        <span className="rounded border border-[#E8E8EC] bg-[#F8F8FA] px-1.5 py-0.5 text-[10px]">
                          React
                        </span>
                        <span className="rounded border border-[#E8E8EC] bg-[#F8F8FA] px-1.5 py-0.5 text-[10px]">
                          TypeScript
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px]">
                        <FaClock className="text-[9px]" /> Posted 2h ago
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E8E8EC] bg-white p-3 shadow-xs">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E8E8EC] bg-[#F8F8FA] text-[#5B3DF5]">
                          <FaLaptopCode className="text-xs" />
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-[#111113]">
                            Marketing Intern
                          </h3>
                          <p className="text-[11px] text-[#6B6B73] flex items-center gap-1 mt-0.5">
                            <FaGlobe className="text-[9px]" /> Growth Studio · Remote
                          </p>
                        </div>
                      </div>
                      <span className="rounded bg-[#5B3DF5]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#5B3DF5]">
                        Internship
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-[#E8E8EC] pt-2 text-[11px] text-[#6B6B73]">
                      <div className="flex gap-1">
                        <span className="rounded border border-[#E8E8EC] bg-[#F8F8FA] px-1.5 py-0.5 text-[10px]">
                          SEO
                        </span>
                        <span className="rounded border border-[#E8E8EC] bg-[#F8F8FA] px-1.5 py-0.5 text-[10px]">
                          Content
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px]">
                        <FaClock className="text-[9px]" /> Posted 5h ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <WhyForsa />

        <div className="relative z-10 -my-3 flex justify-center">
          <div className="h-8 w-px bg-gradient-to-b from-neutral-200 to-neutral-300" />
        </div>

        <TalentCompanySection />

        <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[240px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-50 sm:h-[350px] sm:w-[550px] sm:opacity-60"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--forsa-primary) 12%, transparent), transparent 70%)",
            }}
          />

          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-8 lg:px-10">
            <div className="rounded-3xl  sm:p-8 lg:p-12">
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
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5B3DF5]"
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