import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowRight, FaSearch, FaMapMarkerAlt, FaChevronDown,
  FaBuilding, FaClock, FaBriefcase, FaCode, FaGlobe, FaLaptopCode,
} from "react-icons/fa";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import ctaHero from "../assets/cta-hero.lottie";
import SEO from "../components/SEO";
import WhyForsa from "../components/WhyForsa";
import HomeNavbar from "../components/HomeNavbar";
import TalentCompanySection from "../components/TalentCompanySection";
import Footer from "../components/Footer";
import { getActivePosts } from "../lib/postService";

const getRelativeTime = (value) => {
  if (!value) return "Posted recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Posted recently";
  const diff = Math.max(0, Date.now() - date.getTime());
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 1) return "Posted just now";
  if (m < 60) return `Posted ${m}m ago`;
  if (h < 24) return `Posted ${h}h ago`;
  if (d === 1) return "Posted yesterday";
  if (d < 30) return `Posted ${d}d ago`;
  return `Posted ${Math.floor(d / 30)}mo ago`;
};

const getOpportunityIcon = (post) => {
  const v = `${post?.category || ""} ${post?.type || ""} ${post?.title || ""}`.toLowerCase();
  if (v.includes("marketing") || v.includes("content")) return FaGlobe;
  if (v.includes("developer") || v.includes("software") || v.includes("engineer") || v.includes("tech")) return FaCode;
  if (v.includes("design")) return FaLaptopCode;
  return FaBriefcase;
};

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [livePosts, setLivePosts] = useState([]);
  const [livePostsLoading, setLivePostsLoading] = useState(true);

  const goToLogin = () => {
  console.log("🔥 LOGIN HANDLER FIRED");
  window.location.href = "/auth?mode=login";
};

const goToSignup = () => {
  console.log("🔥 SIGNUP HANDLER FIRED");
  window.location.href = "/auth?mode=signup";
};

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const posts = await getActivePosts();
        if (!active) return;
        setLivePosts(
          [...posts]
            .filter((p) => p?.status !== "closed")
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 2)
        );
      } catch (e) {
        console.error("Homepage live feed error:", e);
        if (active) setLivePosts([]);
      } finally {
        if (active) setLivePostsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (searchQuery.trim()) p.set("q", searchQuery.trim());
    if (location.trim()) p.set("location", location.trim());
    navigate(p.toString() ? `/explore?${p}` : "/explore");
  };

  const handleQuickTag = (tag) => navigate(`/explore?q=${encodeURIComponent(tag)}`);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfbfd] text-[#111113] font-['Geist',sans-serif] selection:bg-[#5B3DF5] selection:text-white">
      <SEO />
      <HomeNavbar />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-[#ececf1] bg-[#fbfbfd]">
          <div className="absolute inset-0 pointer-events-none opacity-70"
            style={{backgroundImage:"linear-gradient(rgba(91,61,245,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(91,61,245,.045) 1px,transparent 1px)",backgroundSize:"56px 56px",maskImage:"linear-gradient(to bottom,black,transparent 82%)"}} />
          <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#5B3DF5]/[0.07] blur-[110px] pointer-events-none" />

          <div className="relative mx-auto max-w-[1200px] px-4 pb-12 pt-8 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="inline-flex items-center gap-2 rounded-full border border-[#dedbeF] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#696773] shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5B3DF5] shadow-[0_0_0_4px_rgba(91,61,245,.10)]" />
                Lebanon's opportunity network
              </motion.div>

              <motion.h1 initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.05}} className="mt-5 font-['Sora',sans-serif] text-[clamp(2.5rem,11vw,4.25rem)] font-bold leading-[1.03] tracking-[-.055em] sm:text-6xl lg:text-[68px]">
                The next opportunity<br />
                <span className="text-[#5B3DF5]">starts here.</span>
              </motion.h1>

              <motion.p initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.1}} className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#696773] sm:text-base">
                Discover jobs, internships, freelance work, and early-career opportunities — built around real people, real teams, and real work.
              </motion.p>

              <motion.form onSubmit={handleSearch} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.15}} className="mx-auto mt-7 max-w-3xl rounded-2xl border border-[#dedee5] bg-white p-1.5 text-left shadow-[0_16px_50px_rgba(20,16,50,.08)]">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3 px-3 py-2.5">
                    <FaSearch className="text-xs text-[#777681]" />
                    <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Role, skill, or keyword..." className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-[#9998a2]" />
                  </div>
                  <div className="hidden h-7 w-px bg-[#e8e8ed] sm:block" />
                  <div className="flex flex-1 items-center gap-3 border-t border-[#e8e8ed] px-3 py-2.5 sm:border-0">
                    <FaMapMarkerAlt className="text-xs text-[#777681]" />
                    <div className="relative w-full">
                      <select value={location} onChange={e=>setLocation(e.target.value)} className="w-full appearance-none bg-transparent pr-5 text-sm font-medium outline-none">
                        <option value="">All locations</option><option>Beirut</option><option>Mount Lebanon</option><option>Tripoli</option><option>Sidon</option><option>Zahle</option><option>Remote</option>
                      </select>
                      <FaChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[9px] text-[#777681]" />
                    </div>
                  </div>
                  <button type="submit" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5B3DF5] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4930D4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] focus-visible:ring-offset-2 sm:w-auto">
                    Search <FaArrowRight className="text-[10px]" />
                  </button>
                </div>
              </motion.form>

              <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px]">
                <span className="py-1 text-[#777681]">Popular:</span>
                {["Full-time","Internship","Freelance","Remote"].map((x)=><button type="button" key={x} onClick={()=>handleQuickTag(x)} className="rounded-full border border-[#e2e1e8] bg-white px-2.5 py-1 font-medium transition hover:border-[#5B3DF5]/30 hover:bg-[#f7f5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] focus-visible:ring-offset-2">{x}</button>)}
              </div>
            </div>

            {/* Product preview */}
            <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:.25,duration:.55}} className="mx-auto mt-9 max-w-5xl sm:mt-12">
              <div className="rounded-2xl border border-[#dedee5] bg-white p-2 shadow-[0_30px_80px_rgba(25,20,55,.10)]">
                <div className="flex items-center justify-between border-b border-[#eeeeF2] px-3 py-2">
                  <div className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#5B3DF5]"/><i className="h-2 w-2 rounded-full bg-[#d9d9df]"/><i className="h-2 w-2 rounded-full bg-[#d9d9df]"/><span className="ml-2 text-[10px] font-semibold text-[#777681]">forsa / opportunities</span></div>
                  <span className="rounded-full bg-[#5B3DF5]/8 px-2 py-1 text-[9px] font-bold text-[#5B3DF5]">LIVE</span>
                </div>
                {livePostsLoading ? <div className="grid gap-3 p-3 sm:grid-cols-2">{[1,2].map(i=><div key={i} className="h-28 animate-pulse rounded-xl bg-[#f5f5f8]"/>)}</div>
                : livePosts.length === 0 ? <div className="p-8 text-center text-xs text-[#777681] sm:p-10">New opportunities are being added. <button type="button" onClick={()=>navigate("/explore")} className="font-semibold text-[#5B3DF5]">Explore Forsa →</button></div>
                : <div className="grid gap-3 p-3 sm:grid-cols-2">{livePosts.map(post=>{const Icon=getOpportunityIcon(post);const company=post.company||post.ownerName||"Local company";const tags=(post.tags||[]).filter(Boolean).slice(0,2);return <button key={post.id} onClick={()=>navigate(`/explore?post=${encodeURIComponent(post.id)}`)} className="group rounded-xl border border-[#e8e8ed] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#5B3DF5]/30 hover:shadow-lg"><div className="flex justify-between gap-3"><div className="flex min-w-0 gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f5f3ff] text-[#5B3DF5]">{post.companyLogo?<img src={post.companyLogo} alt="" className="h-full w-full object-cover"/>:<Icon className="text-xs"/>}</div><div className="min-w-0"><h3 className="truncate text-sm font-semibold group-hover:text-[#5B3DF5]">{post.title||"Untitled opportunity"}</h3><p className="mt-1 truncate text-[11px] text-[#777681]"><FaBuilding className="mr-1 inline text-[9px]"/>{company} · {post.location||"Lebanon"}</p></div></div><span className="shrink-0 rounded-full bg-[#f5f5f8] px-2 py-1 text-[9px] font-semibold">{post.type||"Opportunity"}</span></div><div className="mt-4 flex justify-between border-t border-[#eeeeF2] pt-3 text-[10px] text-[#777681]"><div className="flex gap-1">{tags.map(t=><span key={t} className="rounded bg-[#f7f7f9] px-2 py-1">{t}</span>)}</div><span><FaClock className="mr-1 inline"/>{getRelativeTime(post.createdAt)}</span></div></button>})}</div>}
              </div>
            </motion.div>
          </div>
        </section>

        <WhyForsa />
        <TalentCompanySection />

        <section className="relative overflow-hidden border-y border-[#ececf1] bg-[#f6f4ff] py-16 sm:py-20">
          <div className="absolute inset-0 opacity-40" style={{backgroundImage:"radial-gradient(rgba(91,61,245,.16) 1px,transparent 1px)",backgroundSize:"22px 22px"}}/>
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-8 lg:grid-cols-[.8fr_1.2fr]">
            <DotLottieReact src={ctaHero} loop autoplay className="mx-auto h-48 w-full max-w-xs sm:h-60"/>
            <div className="text-center lg:text-left">
              <span className="text-[11px] font-bold uppercase tracking-[.15em] text-[#5B3DF5]">Build your next move</span>
              <h2 className="mt-2 font-['Sora',sans-serif] text-3xl font-bold tracking-[-.04em] sm:text-4xl">Your next opportunity is closer than you think.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#696773]">Join Forsa to discover opportunities or connect with the people building the next generation of Lebanese companies.</p>
              <Link
                to="/jobs-in-lebanon"
                className="mt-5 inline-flex font-semibold text-[#5B3DF5] hover:underline"
              >
                Find jobs in Lebanon →
              </Link>
              <div className="mt-7 grid gap-3 sm:flex sm:flex-row lg:justify-start">
                <button type="button" onClick={goToSignup} className="rounded-full bg-[#5B3DF5] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#4930D4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] focus-visible:ring-offset-2">Get Started <FaArrowRight className="ml-2 inline text-[9px]"/></button>
                <button type="button" onClick={goToLogin} className="rounded-full border border-[#dedde5] bg-white px-6 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] focus-visible:ring-offset-2">Login</button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}