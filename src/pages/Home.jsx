import { createElement, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowRight, FaSearch, FaMapMarkerAlt, FaChevronDown,
  FaBuilding, FaClock, FaBriefcase, FaCode, FaGlobe, FaLaptopCode,
  FaCompass, FaUserCircle, FaComments,
} from "react-icons/fa";

import SEO from "../components/SEO";
import HomeNavbar from "../components/HomeNavbar";
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

const initialsOf = (value) =>
  String(value || "F")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getPostSkills = (posts) => {
  const skills = [];

  (posts || []).forEach((post) => {
    (post.tags || []).forEach((tag) => {
      const value = String(tag).trim();

      if (value && !skills.includes(value)) skills.push(value);
    });
  });

  return skills.slice(0, 3);
};

const renderOpportunityIcon = (post, className) =>
  createElement(post ? getOpportunityIcon(post) : FaBriefcase, { className });

const STAGES = [
  {
    number: "01",
    title: "Discover",
    copy: "Find opportunities worth pursuing.",
    detail: "Jobs, internships, freelance work, and early-career opportunities from companies and teams across Lebanon.",
    chips: ["Jobs", "Internships", "Freelance"],
    cta: "Explore opportunities",
    to: "/jobs-in-lebanon",
    Icon: FaCompass,
  },
  {
    number: "02",
    title: "Build",
    copy: "Put your work forward.",
    detail: "Create a professional presence around your skills, experience, projects, and the direction you want your career to take.",
    chips: ["Skills", "Experience", "Projects"],
    cta: "Build your profile",
    to: "/auth?mode=signup",
    Icon: FaUserCircle,
  },
  {
    number: "03",
    title: "Connect",
    copy: "Get closer to the people behind the opportunity.",
    detail: "Move beyond endless applications and discover the companies, teams, and people building what comes next in Lebanon.",
    chips: ["Companies", "Teams", "People"],
    cta: "Meet companies & teams",
    to: "/companies",
    Icon: FaComments,
  },
];

function MiniTalentCard({ skills }) {
  return (
    <div className="rounded-2xl border border-[#e7e6ec] bg-white p-4 shadow-[0_18px_45px_rgba(20,16,50,.08)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1efff] text-[#5B3DF5]">
            <FaUserCircle />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">Talent profile</p>
            <p className="text-[10px] text-[#777681]">On Forsa</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[#5B3DF5]/8 px-2 py-0.5 text-[9px] font-bold text-[#5B3DF5]">
          Open to work
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <span
            key={skill}
            className="rounded-md bg-[#f6f4ff] px-2 py-1 text-[9px] font-semibold text-[#5B3DF5]"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniOpportunityCard({ post }) {
  const title = post?.title || "Open role";
  const company = post?.company || post?.ownerName || "Local company";
  const location = post?.location || "Lebanon";
  const type = post?.type || "Opportunity";

  return (
    <div className="rounded-2xl border border-[#e7e6ec] bg-white p-4 shadow-[0_30px_70px_rgba(25,20,55,.14)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f3ff] text-[#5B3DF5]">
            {renderOpportunityIcon(post, "text-xs")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="truncate text-[10px] text-[#777681]">
              {company} · {location}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[#f5f5f8] px-2 py-1 text-[9px] font-semibold">
          {type}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#eeeeF2] pt-2.5 text-[10px] text-[#777681]">
        <span>{post ? getRelativeTime(post.createdAt) : "Posted recently"}</span>
        <span className="font-semibold text-[#5B3DF5]">View on Forsa</span>
      </div>
    </div>
  );
}

function MiniCompanyCard({ post }) {
  const company = post?.company || post?.ownerName || "Local company";
  const location = post?.location || "Lebanon";

  return (
    <div className="rounded-2xl border border-[#e7e6ec] bg-white p-4 shadow-[0_18px_45px_rgba(20,16,50,.08)]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1efff] text-[10px] font-bold text-[#5B3DF5]">
          {initialsOf(company)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{company}</p>
          <p className="text-[10px] text-[#777681]">{location}</p>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-[#5B3DF5]/8 px-2 py-1 text-[9px] font-bold text-[#5B3DF5]">
          Active
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-[#eeeeF2] bg-[#fbfbfd] p-2.5">
        <p className="text-[10px] font-semibold">Open roles on Forsa</p>
        <p className="mt-0.5 text-[9px] leading-4 text-[#777681]">
          Meet the people behind the opportunity.
        </p>
      </div>
    </div>
  );
}

const networkLineProps = {
  stroke: "url(#forsaNetLine)",
  strokeWidth: 0.35,
  strokeLinecap: "round",
  fill: "none",
};

function NetworkComposition({ posts }) {
  const reduce = useReducedMotion();
  const post = posts && posts[0];
  const skills = getPostSkills(posts);
  const skillList = skills.length
    ? skills
    : ["Design", "React", "Data Entry", "Social Media"];

  const chrome = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <i className="h-2 w-2 rounded-full bg-[#5B3DF5]" />
        <i className="h-2 w-2 rounded-full bg-[#d9d9df]" />
        <i className="h-2 w-2 rounded-full bg-[#d9d9df]" />
        <span className="ml-2 font-mono text-[10px] font-semibold text-[#777681]">
          forsa / network
        </span>
      </div>
      <span className="rounded-full bg-[#5B3DF5]/8 px-2 py-1 text-[9px] font-bold text-[#5B3DF5]">
        LIVE
      </span>
    </div>
  );

  return (
    <div>
      {chrome}

      <div className="mt-3 hidden lg:block">
        <div className="relative h-[460px]">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="forsaNetLine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#5B3DF5" stopOpacity="0.45" />
                <stop offset="1" stopColor="#5B3DF5" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {!reduce && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <motion.line
                  {...networkLineProps}
                  x1="16"
                  y1="20"
                  x2="50"
                  y2="52"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, ease: "easeInOut" }}
                />
                <motion.line
                  {...networkLineProps}
                  x1="50"
                  y1="52"
                  x2="84"
                  y2="80"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, delay: 0.15, ease: "easeInOut" }}
                />
                <motion.line
                  {...networkLineProps}
                  x1="16"
                  y1="20"
                  x2="84"
                  y2="80"
                  strokeOpacity="0.4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, delay: 0.3, ease: "easeInOut" }}
                />
              </motion.g>
            )}
          </svg>

          <div className="absolute left-[16%] top-[20%] w-[252px] -translate-x-1/2 -translate-y-1/2 -rotate-2">
            <MiniTalentCard skills={skillList} />
          </div>

          <div className="absolute left-1/2 top-1/2 z-10 w-[268px] -translate-x-1/2 -translate-y-1/2">
            <MiniOpportunityCard post={post} />
          </div>

          <div className="absolute left-[84%] top-[80%] w-[252px] -translate-x-1/2 -translate-y-1/2 rotate-2">
            <MiniCompanyCard post={post} />
          </div>
        </div>
      </div>

      <div className="mt-3 pb-2 lg:hidden">
        <MiniTalentCard skills={skillList} />

        <div className="mx-auto flex h-10 w-px items-start justify-center bg-gradient-to-b from-[#5B3DF5]/40 to-[#5B3DF5]/10">
          <span className="mt-9 h-1.5 w-1.5 rounded-full bg-[#5B3DF5]" />
        </div>

        <MiniOpportunityCard post={post} />

        <div className="mx-auto flex h-10 w-px items-start justify-center bg-gradient-to-b from-[#5B3DF5]/40 to-[#5B3DF5]/10">
          <span className="mt-9 h-1.5 w-1.5 rounded-full bg-[#5B3DF5]" />
        </div>

        <MiniCompanyCard post={post} />
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [livePosts, setLivePosts] = useState([]);
  const [livePostsLoading, setLivePostsLoading] = useState(true);

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

        <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-28">
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(rgba(91,61,245,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(91,61,245,.04) 1px,transparent 1px)",
              backgroundSize: "52px 52px",
              maskImage:
                "linear-gradient(to bottom,transparent,black 12%,black 88%,transparent)",
            }}
          />

          <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#dedbeF] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#696773] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5B3DF5] shadow-[0_0_0_4px_rgba(91,61,245,.10)]" />
                Lebanese career community
              </span>

              <h2 className="mt-5 font-['Sora',sans-serif] text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.03] tracking-[-.05em] sm:text-6xl">
                More than <span className="text-[#5B3DF5]">finding a job.</span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#696773] sm:text-base">
                Forsa brings opportunities, people, and companies into one place
                — giving ambitious people in Lebanon a clearer way to discover
                what they can do next.
              </p>
            </div>

            <div className="mt-14 grid items-start gap-12 lg:mt-20 lg:grid-cols-[.9fr_1.1fr] lg:gap-14">
              <div>
                {STAGES.map((stage, i) => {
                  const Icon = stage.Icon;

                  return (
                    <motion.div
                      key={stage.number}
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className={`group py-6 lg:py-7 ${
                        i === 0 ? "" : "border-t border-[#e7e6ec]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[#9998a2]">
                          {stage.number}
                        </span>
                        <div className="flex gap-1.5">
                          {stage.chips.map((chip) => (
                            <span
                              key={chip}
                              className="rounded-full border border-[#e5e4ea] bg-[#fafafd] px-2 py-0.5 text-[9px] font-semibold text-[#777681]"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1efff] text-[#5B3DF5]">
                          <Icon className="text-xs" />
                        </span>
                        <h3 className="font-['Sora',sans-serif] text-xl font-semibold tracking-[-.03em]">
                          {stage.title}
                        </h3>
                      </div>

                      <p className="mt-2 text-sm font-medium text-[#111113]">
                        {stage.copy}
                      </p>

                      <p className="mt-1 max-w-md text-xs leading-5 text-[#777681] sm:text-sm">
                        {stage.detail}
                      </p>

                      <Link
                        to={stage.to}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#5B3DF5] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] focus-visible:ring-offset-2"
                      >
                        {stage.cta}
                        <FaArrowRight className="text-[10px] transition group-hover:translate-x-0.5" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <div>
                <NetworkComposition posts={livePosts} />
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-[#ececf1] bg-[#fbfbfd] py-16 sm:py-20">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(rgba(91,61,245,.14) 1px,transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-8">
            <span className="text-[11px] font-bold uppercase tracking-[.15em] text-[#5B3DF5]">
              Your next move
            </span>

            <h2 className="mt-3 font-['Sora',sans-serif] text-3xl font-bold leading-tight tracking-[-.04em] sm:text-4xl">
              There&apos;s more to your next move.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#696773] sm:text-base">
              Discover opportunities, meet companies, and build your place in
              the Lebanese career community.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/jobs-in-lebanon"
                className="inline-flex items-center gap-2 rounded-full bg-[#5B3DF5] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#4930D4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] focus-visible:ring-offset-2"
              >
                Explore opportunities
                <FaArrowRight className="text-[10px]" />
              </Link>

              <Link
                to="/auth?mode=signup"
                className="inline-flex items-center gap-2 rounded-full border border-[#dedde5] bg-white px-6 py-3 text-sm font-semibold text-[#111113] transition hover:border-[#5B3DF5]/30 hover:bg-[#f7f5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] focus-visible:ring-offset-2"
              >
                Join Forsa
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}