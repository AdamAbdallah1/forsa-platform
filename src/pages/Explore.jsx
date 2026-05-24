import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { showToast } from "../lib/Toast";
import {
  FaBriefcase,
  FaBookmark,
  FaRegBookmark,
  FaPaperPlane,
  FaLock,
  FaFileAlt,
  FaSearch,
  FaMapMarkerAlt,
  FaTimes,
  FaCheck,
  FaBolt,
  FaStar,
  FaSlidersH,
  FaArrowRight,
  FaUserCircle,
  FaShareAlt,
  FaFlag,
  FaShieldAlt,
  FaWhatsapp,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import FitBadge from "../components/FitBadge";
import { opportunities } from "../data/opportunities";

const safeJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalize = (value) => String(value || "").trim().toLowerCase();

const getProfileStrength = (account, profile) => {
  const checks = [
    Boolean(account?.name),
    Boolean(account?.email),
    Boolean(account?.city),
    (profile.skills || []).length >= 2,
    (profile.lookingFor || []).length > 0,
    Boolean(profile.cv),
  ];

  const completed = checks.filter(Boolean).length;
  const missing = [];

  if (!profile.skills?.length || profile.skills.length < 2) missing.push("add 2+ skills");
  if (!profile.lookingFor?.length) missing.push("choose work interests");
  if (!profile.cv) missing.push("attach CV");

  return {
    score: Math.round((completed / checks.length) * 100),
    missing,
  };
};

const calculateMatchScore = (post, profile, account) => {
  const skills = (profile?.skills || []).map(normalize);
  const lookingFor = (profile?.lookingFor || []).map(normalize);
  const tags = (post?.tags || []).map(normalize);
  const postType = normalize(post?.type);
  const postLocation = normalize(post?.location);
  const accountCity = normalize(account?.city);

  if (!skills.length && !lookingFor.length && !accountCity) return 0;

  let score = 35;

  const matchedTags = tags.filter((tag) => skills.includes(tag));
  if (tags.length > 0) {
    score += Math.min(35, Math.round((matchedTags.length / tags.length) * 35));
  }

  const goalMatch = lookingFor.some((item) => {
    return (
      item === postType ||
      item === `${postType} work` ||
      item === `${postType} job` ||
      item.includes(postType) ||
      postType.includes(item)
    );
  });

  if (goalMatch) score += 18;
  if (accountCity && postLocation.includes(accountCity)) score += 10;
  if (post?.featured) score += 4;
  if (post?.urgent) score += 3;

  return Math.min(98, Math.max(0, score));
};

const getMatchMeta = (post, profile) => {
  const skills = (profile?.skills || []).map(normalize);
  const matchingSkills = (post.tags || []).filter((tag) => skills.includes(normalize(tag)));
  const lookingFor = profile?.lookingFor || [];
  const matchingType = lookingFor.some((item) => {
    const value = normalize(item);
    const type = normalize(post.type);
    return value === type || value === `${type} work` || value === `${type} job` || value.includes(type);
  });

  return { matchingSkills, matchingType };
};

const getPostAnalytics = () => safeJson("forsaPostAnalytics", {});

const updatePostAnalytics = (postId, field) => {
  const analytics = getPostAnalytics();
  const current = analytics[postId] || {
    views: 0,
    saves: 0,
    applications: 0,
    shares: 0,
    reports: 0,
  };

  analytics[postId] = {
    ...current,
    [field]: (current[field] || 0) + 1,
  };

  writeJson("forsaPostAnalytics", analytics);
};

const buildPostUrl = (postId) => {
  const base = window.location.href.split("#")[0];
  return `${base}#/explore?post=${encodeURIComponent(postId)}`;
};

const readSharedPostId = (searchParams, location) => {
  const fromRouter = searchParams.get("post");
  if (fromRouter) return fromRouter;

  const hash = window.location.hash || "";
  const queryString = hash.includes("?") ? hash.split("?")[1] : "";
  const fromHash = new URLSearchParams(queryString).get("post");
  if (fromHash) return fromHash;

  const fromLocation = new URLSearchParams(location.search || "").get("post");
  return fromLocation;
};

const cleanPostForStorage = (post) => ({
  ...post,
  icon: undefined,
});

const types = ["All", "Internship", "Freelance", "Part-time", "Project", "Remote"];
const sortOptions = ["Best match", "Newest", "Urgent"];

export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const account = safeJson("forsaAccount", null);
  const savedProfile = safeJson("forsaProfile", {
    skills: [],
    lookingFor: [],
    cv: null,
  });

  const isLoggedIn = Boolean(account);
  const isHiring = account?.accountType === "hiring";
  const canInteract = isLoggedIn && !isHiring;
  const profileStrength = getProfileStrength(account, savedProfile);

  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applyOpportunity, setApplyOpportunity] = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [sortBy, setSortBy] = useState("Best match");
  const [savedJobs, setSavedJobs] = useState(safeJson("forsaSavedJobs", []));
  const [recentlyViewed, setRecentlyViewed] = useState(safeJson("forsaRecentlyViewed", []));

  const allOpportunities = useMemo(() => {
    const userPosts = safeJson("forsaPosts", []).filter((post) => post.status !== "closed");

    const normalizedPosts = userPosts.map((post) => ({
      ...post,
      icon: FaBriefcase,
      tags: post.tags || [],
      company: post.company || "Local poster",
      location: post.location || "Lebanon",
      type: post.type || "Project",
      pay: post.pay || "Not specified",
      contact: post.contact || "Not specified",
      description: post.description || "No description provided.",
      ownerEmail: post.ownerEmail || post.contact || null,
      createdAt: post.createdAt || post.id || Date.now(),
      source: "community",
    }));

    const normalizedSeed = opportunities.map((item) => ({
      ...item,
      tags: item.tags || [],
      ownerEmail: item.ownerEmail || null,
      createdAt: item.createdAt || item.id || 0,
      source: "featured",
    }));

    return [...normalizedPosts, ...normalizedSeed];
  }, []);

  const appliedIds = useMemo(() => {
    if (!account?.email) return new Set();

    return new Set(
      safeJson("forsaMessages", [])
        .filter((thread) => thread.seeker?.email === account.email)
        .map((thread) => thread.opportunityId)
    );
  }, [account?.email]);

  const rankedOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = allOpportunities.filter((item) => {
      const searchText = `${item.title} ${item.company} ${item.location} ${(item.tags || []).join(" ")}`.toLowerCase();
      const matchesSearch = query.length === 0 || searchText.includes(query);
      const matchesType = activeType === "All" || item.type === activeType;
      return matchesSearch && matchesType;
    });

    const scored = filtered.map((item) => {
      const matchScore = calculateMatchScore(item, savedProfile, account);
      const { matchingSkills, matchingType } = getMatchMeta(item, savedProfile);
      const recencyScore = item.createdAt ? Math.min(15, new Date(item.createdAt).getTime() / 100000000000) : 0;
      const rankScore =
        matchScore +
        (item.featured ? 20 : 0) +
        (item.urgent ? 14 : 0) +
        recencyScore;

      return {
        ...item,
        matchScore,
        score: Math.max(0, Math.round((matchScore - 35) / 16)),
        matchingSkills,
        matchingType,
        rankScore,
      };
    });

    if (sortBy === "Newest") {
      return scored.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (sortBy === "Urgent") {
      return scored.sort(
        (a, b) =>
          Number(Boolean(b.urgent)) - Number(Boolean(a.urgent)) ||
          b.matchScore - a.matchScore ||
          new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    return scored.sort((a, b) => b.rankScore - a.rankScore);
  }, [allOpportunities, search, activeType, sortBy, savedProfile, account]);

  const recommendedOpportunities = useMemo(() => {
    if (!canInteract) return [];
    return rankedOpportunities
      .filter((item) => item.matchScore >= 58)
      .slice(0, 6);
  }, [rankedOpportunities, canInteract]);

  useEffect(() => {
    const postId = readSharedPostId(searchParams, location);
    if (!postId) return;

    const found = allOpportunities.find((item) => String(item.id) === String(postId));

    if (!found) {
      showToast("This post is not available on this device yet", "info");
      return;
    }

    openDetails(found, { replaceUrl: true });
  }, [searchParams, location.search, location.hash, allOpportunities]);

  const stats = useMemo(() => {
    return {
      total: rankedOpportunities.length,
      urgent: rankedOpportunities.filter((item) => item.urgent).length,
      saved: savedJobs.length,
      applied: appliedIds.size,
    };
  }, [rankedOpportunities, savedJobs.length, appliedIds]);

  const isSaved = (id) => savedJobs.some((job) => job.id === id);

  const requireSeekerAccount = (action) => {
    if (!isLoggedIn) {
      setAuthModal(action);
      return false;
    }

    if (isHiring) {
      setAuthModal("seeker-only");
      return false;
    }

    return true;
  };

  const trackRecentlyViewed = (item) => {
    const stored = safeJson("forsaRecentlyViewed", []);
    const updated = [
      {
        ...cleanPostForStorage(item),
        viewedAt: new Date().toISOString(),
      },
      ...stored.filter((post) => String(post.id) !== String(item.id)),
    ].slice(0, 12);

    setRecentlyViewed(updated);
    writeJson("forsaRecentlyViewed", updated);
  };

  const toggleSave = (item) => {
    if (!requireSeekerAccount("save")) return;

    const alreadySaved = isSaved(item.id);
    const updated = alreadySaved
      ? savedJobs.filter((job) => job.id !== item.id)
      : [{ ...cleanPostForStorage(item), savedAt: new Date().toISOString() }, ...savedJobs];

    setSavedJobs(updated);
    writeJson("forsaSavedJobs", updated);

    if (!alreadySaved) updatePostAnalytics(item.id, "saves");

    showToast(alreadySaved ? "Removed from saved jobs" : "Saved to profile");
  };

  const openApply = (item) => {
    if (!requireSeekerAccount("contact")) return;

    const hasProfile = savedProfile.skills.length > 0 && savedProfile.lookingFor.length > 0;

    if (!hasProfile) {
      showToast("Complete your profile first", "info");
      navigate("/onboarding");
      return;
    }

    setApplyOpportunity(item);
  };

  function openDetails(item, options = {}) {
    const enhancedItem = {
      ...item,
      matchScore: item.matchScore ?? calculateMatchScore(item, savedProfile, account),
      ...getMatchMeta(item, savedProfile),
    };

    updatePostAnalytics(item.id, "views");
    trackRecentlyViewed(enhancedItem);
    setSelectedOpportunity(enhancedItem);
    setSearch("");
    setActiveType("All");

    const nextPath = `/explore?post=${encodeURIComponent(item.id)}`;
    if (location.pathname + location.search !== nextPath) {
      navigate(nextPath, { replace: Boolean(options.replaceUrl) });
    }
  }

  const shareOpportunity = async (item) => {
    const url = buildPostUrl(item.id);

    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: `${item.title} at ${item.company}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Post link copied");
      }

      updatePostAnalytics(item.id, "shares");
    } catch {
      showToast("Share cancelled", "info");
    }
  };

  const shareToWhatsApp = (item) => {
    const url = buildPostUrl(item.id);
    const text = `Check this opportunity on Forsa:\n${item.title}\n${item.company}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    updatePostAnalytics(item.id, "shares");
  };

  const reportOpportunity = (item) => {
    const reason = window.prompt("Report reason: fake post, unclear pay, spam, unsafe, or other");

    if (!reason?.trim()) return;

    const reports = safeJson("forsaReports", []);
    writeJson("forsaReports", [
      {
        id: Date.now(),
        postId: item.id,
        title: item.title,
        company: item.company,
        reason: reason.trim(),
        reporterEmail: account?.email || "guest",
        createdAt: new Date().toISOString(),
      },
      ...reports,
    ]);

    updatePostAnalytics(item.id, "reports");
    showToast("Report submitted", "info");
  };

  const submitApplication = ({ item, message, attachCv, answers }) => {
    const messages = safeJson("forsaMessages", []);
    const existing = messages.find(
      (thread) => thread.opportunityId === item.id && thread.seeker?.email === account.email
    );

    const now = new Date().toISOString();

    const threadPayload = {
      id: existing?.id || Date.now(),
      opportunityId: item.id,
      ownerEmail: item.ownerEmail || item.contact || null,
      title: item.title,
      company: item.company,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      lastMessage: message,
      status: existing?.status || "pending",
      cv: attachCv ? savedProfile.cv : null,
      answers,
questions: item.questions || [],
      seeker: {
        name: account.name,
        email: account.email,
        city: account.city,
        skills: savedProfile.skills,
        lookingFor: savedProfile.lookingFor,
        lastSeen: now,
      },
      opportunity: {
        title: item.title,
        company: item.company,
        location: item.location,
        type: item.type,
        pay: item.pay,
        contact: item.contact,
      },
      conversation: [
  ...(existing?.conversation || []),
  {
    id: Date.now(),
    from: account.name,
    role: "seeker",
    text: message,
    createdAt: now,
    cv: attachCv ? savedProfile.cv : null,
    answers,
  },
],
    };

    const updatedMessages = existing
      ? messages.map((thread) => (thread.id === existing.id ? threadPayload : thread))
      : [threadPayload, ...messages];

    writeJson("forsaMessages", updatedMessages);

    const notifications = safeJson("forsaNotifications", []);
    writeJson("forsaNotifications", [
      {
        id: Date.now() + 1,
        type: "new_application",
        title: "New application received",
        text: `${account.name} applied to ${item.title}`,
        targetEmail: item.ownerEmail || item.contact || null,
        createdAt: now,
        read: false,
      },
      ...notifications,
    ]);

    updatePostAnalytics(item.id, "applications");

    setApplyOpportunity(null);
    showToast(existing ? "Application updated" : "Application sent");
    navigate("/messages");
  };

  return (
    <section className="min-h-screen">
      <AppHeader />

      <div className="mx-auto max-w-[1180px] px-4 pb-28 sm:px-6 lg:pb-20">
        <HeroBar
          isHiring={isHiring}
          isLoggedIn={isLoggedIn}
          navigate={navigate}
          stats={stats}
        />

        <StatusCard
          isLoggedIn={isLoggedIn}
          isHiring={isHiring}
          savedProfile={savedProfile}
          navigate={navigate}
        />

        <SearchPanel
          search={search}
          setSearch={setSearch}
          activeType={activeType}
          setActiveType={setActiveType}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {recentlyViewed.length > 0 && (
          <RecentlyViewedSection
            items={recentlyViewed}
            onOpen={(item) => openDetails(item)}
          />
        )}

        {recommendedOpportunities.length > 0 && (
          <RecommendedSection
            items={recommendedOpportunities}
            savedJobs={savedJobs}
            appliedIds={appliedIds}
            canInteract={canInteract}
            onSave={toggleSave}
            onDetails={openDetails}
            onApply={openApply}
            onShare={shareOpportunity}
            navigate={navigate}
          />
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-700">
              {rankedOpportunities.length} result{rankedOpportunities.length === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Sorted by {sortBy.toLowerCase()}
            </p>
          </div>

          {canInteract && (
            <Link
              to="/profile"
              className="hidden rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-black sm:inline-flex"
            >
              Improve profile
            </Link>
          )}
        </div>

        {rankedOpportunities.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="mt-5 grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rankedOpportunities.map((item) => (
              <OpportunityCard
                key={item.id}
                item={item}
                saved={isSaved(item.id)}
                applied={appliedIds.has(item.id)}
                canInteract={canInteract}
                onSave={() => toggleSave(item)}
                onDetails={() => openDetails(item)}
                onApply={() =>
                  appliedIds.has(item.id) ? navigate("/messages") : openApply(item)
                }
                onShare={() => shareOpportunity(item)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedOpportunity && (
        <OpportunityModal
          item={selectedOpportunity}
          saved={isSaved(selectedOpportunity.id)}
          canInteract={canInteract}
          applied={appliedIds.has(selectedOpportunity.id)}
          onSave={() => toggleSave(selectedOpportunity)}
          onApply={() => openApply(selectedOpportunity)}
          onShare={() => shareOpportunity(selectedOpportunity)}
          onWhatsApp={() => shareToWhatsApp(selectedOpportunity)}
          onReport={() => reportOpportunity(selectedOpportunity)}
          onClose={() => {
            setSelectedOpportunity(null);
            if (readSharedPostId(searchParams, location)) {
              navigate("/explore", { replace: true });
            }
          }}
        />
      )}

      {applyOpportunity && (
        <ApplyModal
          item={applyOpportunity}
          account={account}
          profile={savedProfile}
          profileStrength={profileStrength}
          onClose={() => setApplyOpportunity(null)}
          onSubmit={submitApplication}
        />
      )}

      {authModal && (
        <AuthRequiredModal
          type={authModal}
          onClose={() => setAuthModal(null)}
          onCreateAccount={() => navigate("/auth")}
        />
      )}
    </section>
  );
}

function HeroBar({ isHiring, isLoggedIn, navigate, stats }) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:mt-8 sm:p-6 md:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#f7f7f5] blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Explore Forsa</p>

          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-4xl md:text-5xl">
            Find the right opportunity without the noise.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Browse local jobs, internships, gigs, and projects across Lebanon.
            Save what matters, apply with a message, and track everything.
          </p>
        </div>

        <button
          onClick={() => navigate(isHiring ? "/post" : isLoggedIn ? "/profile" : "/auth")}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 sm:w-fit"
        >
          {isHiring ? "Post opportunity" : isLoggedIn ? "Improve profile" : "Join Forsa"}
          <FaArrowRight className="text-xs transition group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Results" value={stats.total} />
        <MiniStat label="Urgent" value={stats.urgent} />
        <MiniStat label="Saved" value={stats.saved} />
        <MiniStat label="Applied" value={stats.applied} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f7f7f5] p-3">
      <p className="text-xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function SearchPanel({ search, setSearch, activeType, setActiveType, sortBy, setSortBy }) {
  return (
    <div className="sticky top-[57px] z-30 -mx-4 mt-4 border-y border-neutral-200/80 bg-[#f7f7f5]/95 px-4 py-3 backdrop-blur-2xl sm:mx-0 sm:mt-5 sm:rounded-[26px] sm:border sm:bg-white/90 sm:p-3 sm:shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 sm:bg-[#f7f7f5]">
          <FaSearch className="text-sm text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role, skill, city..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 lg:justify-end lg:pb-0">
          {sortOptions.map((option) => (
            <FilterButton key={option} active={sortBy === option} onClick={() => setSortBy(option)}>
              <span className="inline-flex items-center gap-2">
                {option === "Best match" && <FaSlidersH className="text-xs" />}
                {option}
              </span>
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {types.map((type) => (
          <FilterButton key={type} active={activeType === type} onClick={() => setActiveType(type)}>
            {type}
          </FilterButton>
        ))}
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
        active
          ? "border-black bg-black text-white"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-black"
      }`}
    >
      {children}
    </button>
  );
}

function RecentlyViewedSection({ items, onOpen }) {
  return (
    <section className="mt-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-500">Recently viewed</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
            Continue browsing
          </h2>
        </div>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {items.slice(0, 8).map((item) => (
          <button
            key={`${item.id}-${item.viewedAt || "viewed"}`}
            onClick={() => onOpen(item)}
            className="min-w-[260px] rounded-[24px] border border-neutral-200 bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-black"
          >
            <p className="text-xs text-neutral-500">{item.company}</p>
            <h3 className="mt-2 line-clamp-2 font-semibold tracking-[-0.02em]">{item.title}</h3>
            <p className="mt-3 text-sm text-neutral-600">{item.location}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function RecommendedSection({ items, savedJobs, appliedIds, canInteract, onSave, onDetails, onApply, onShare, navigate }) {
  const isSaved = (id) => savedJobs.some((job) => job.id === id);

  return (
    <section className="mt-6 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Personalized</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
            Recommended for you
          </h2>
        </div>
        <p className="text-sm text-neutral-500">Based on your skills and goals</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.slice(0, 4).map((item) => (
          <CompactRecommendationCard
            key={`recommended-${item.id}`}
            item={item}
            saved={isSaved(item.id)}
            applied={appliedIds.has(item.id)}
            canInteract={canInteract}
            onSave={() => onSave(item)}
            onDetails={() => onDetails(item)}
            onApply={() => (appliedIds.has(item.id) ? navigate("/messages") : onApply(item))}
            onShare={() => onShare(item)}
          />
        ))}
      </div>
    </section>
  );
}

function CompactRecommendationCard({ item, saved, applied, canInteract, onSave, onDetails, onApply, onShare }) {
  return (
    <article className="rounded-[24px] bg-[#f7f7f5] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black px-2.5 py-1 text-[11px] font-medium text-white">
              {item.matchScore}% match
            </span>
            {item.urgent && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-neutral-600">Urgent</span>}
          </div>
          <h3 className="mt-3 line-clamp-2 font-semibold tracking-[-0.02em]">{item.title}</h3>
          <p className="mt-1 text-sm text-neutral-500">{item.company} · {item.location}</p>
        </div>

        <button
          onClick={onSave}
          className={`shrink-0 rounded-full border p-2 ${saved ? "border-black bg-black text-white" : "border-neutral-200 bg-white text-neutral-500"} ${!canInteract ? "opacity-70" : ""}`}
        >
          {saved ? <FaBookmark /> : <FaRegBookmark />}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button onClick={onDetails} className="rounded-full border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium">
          Details
        </button>
        <button onClick={onShare} className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium">
          <FaShareAlt className="text-xs" />
        </button>
        <button onClick={onApply} className={`rounded-full px-3 py-2.5 text-sm font-medium ${canInteract ? "bg-black text-white" : "bg-neutral-200 text-neutral-500"}`}>
          {applied ? "Open" : "Apply"}
        </button>
      </div>
    </article>
  );
}

function OpportunityCard({ item, saved, applied, canInteract, onSave, onDetails, onApply, onShare }) {
  const Icon = item.icon || FaBriefcase;

  return (
    <article className="group flex h-full min-h-[450px] flex-col rounded-[26px] border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <Icon className="text-sm" />
          </div>

          <div className="min-w-0">
            <h3 className="line-clamp-2 min-h-[44px] font-semibold leading-snug tracking-[-0.02em]">
              {item.title}
            </h3>

            <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
              <FaMapMarkerAlt className="shrink-0 text-[10px]" />
              <span className="truncate">{item.company} · {item.location}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onSave}
          className={`shrink-0 rounded-full border p-2 transition ${
            saved
              ? "border-black bg-black text-white"
              : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400"
          } ${!canInteract ? "opacity-70" : ""}`}
          aria-label="Save opportunity"
        >
          {saved ? <FaBookmark /> : <FaRegBookmark />}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Pill>{item.type}</Pill>
        <Pill>{item.pay}</Pill>
        {item.matchScore > 0 && <Pill tone="dark">{item.matchScore}% match</Pill>}
        {item.urgent && <Pill tone="dark" icon={<FaBolt />}>Urgent</Pill>}
        {item.featured && <Pill icon={<FaStar />}>Featured</Pill>}
        {applied && <Pill tone="dark">Applied</Pill>}
      </div>

      <p className="mt-4 line-clamp-3 min-h-[72px] text-sm leading-6 text-neutral-600">
        {item.description}
      </p>

      <div className="mt-4 min-h-[88px]">
        <FitBadge
          score={item.score}
          matchingSkills={item.matchingSkills}
          matchingType={item.matchingType ? item.type : null}
        />
      </div>

      <div className="mt-4">
        <p className="text-xs text-neutral-400">Tags</p>
        <div className="mt-2 flex min-h-[28px] flex-wrap gap-2">
          {(item.tags || []).slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs">
              {tag}
            </span>
          ))}

          {(item.tags || []).length > 4 && (
            <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs text-neutral-500">
              +{item.tags.length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
        <button onClick={onDetails} className="rounded-full border border-neutral-300 bg-white px-3 py-3 text-sm font-medium transition hover:border-neutral-500">
          Details
        </button>

        <button onClick={onShare} className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-3 py-3 text-sm font-medium transition hover:border-neutral-500" aria-label="Share opportunity">
          <FaShareAlt className="text-xs" />
        </button>

        <button
          onClick={onApply}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-medium transition ${
            canInteract ? "bg-black text-white hover:bg-neutral-800" : "bg-neutral-200 text-neutral-500"
          }`}
        >
          {!canInteract ? <FaLock className="text-xs" /> : <FaPaperPlane className="text-xs" />}
          {applied ? "Open" : "Apply"}
        </button>
      </div>
    </article>
  );
}

function StatusCard({ isLoggedIn, isHiring, savedProfile, navigate }) {
  if (!isLoggedIn) {
    return (
      <div className="mt-4 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7f7f5]">
              <FaUserCircle className="text-neutral-500" />
            </div>

            <div>
              <p className="font-medium">Browsing as guest</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Create a profile to save jobs, apply, and send messages.
              </p>
            </div>
          </div>

          <button onClick={() => navigate("/auth")} className="w-full rounded-full bg-black px-5 py-3 text-sm font-medium text-white sm:w-fit">
            Create account
          </button>
        </div>
      </div>
    );
  }

  if (isHiring) {
    return (
      <div className="mt-4 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <p className="font-medium">Hiring mode</p>
        <p className="mt-1 text-sm leading-6 text-neutral-600">
          Browse the market and manage applicants from your profile dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] md:grid-cols-2">
      <SkillBox title="Your skills" skills={savedProfile.skills} />
      <SkillBox title="Looking for" skills={savedProfile.lookingFor} />
    </div>
  );
}

function SkillBox({ title, skills }) {
  return (
    <div className="rounded-2xl bg-[#f7f7f5] p-4">
      <p className="text-xs text-neutral-500">{title}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {skills.length > 0 ? (
          skills.slice(0, 8).map((skill) => (
            <span key={skill} className="rounded-full bg-white px-3 py-1.5 text-xs">
              {skill}
            </span>
          ))
        ) : (
          <p className="text-sm text-neutral-500">Nothing selected yet.</p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="mt-5 rounded-[26px] border border-neutral-200 bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f7f5]">
        <FaSearch className="text-neutral-500" />
      </div>

      <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
        No opportunities found.
      </h3>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
        {search ? "Try another keyword, skill, city, or opportunity type." : "New opportunities will appear here when people start posting."}
      </p>
    </div>
  );
}

function Pill({ children, icon, tone = "light" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${tone === "dark" ? "bg-black text-white" : "bg-[#f7f7f5] text-neutral-600"}`}>
      {icon}
      {children}
    </span>
  );
}

function OpportunityModal({ item, saved, canInteract, applied, onSave, onApply, onShare, onWhatsApp, onReport, onClose }) {
  const Icon = item.icon || FaBriefcase;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-0">
      <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-[28px] bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
              <Icon />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-neutral-500">{item.type}</p>
              <h2 className="mt-1 line-clamp-2 text-2xl font-semibold tracking-[-0.03em]">
                {item.title}
              </h2>
            </div>
          </div>

          <button onClick={onClose} className="shrink-0 rounded-full bg-[#f7f7f5] p-2 text-sm">
            <FaTimes />
          </button>
        </div>

        <p className="mt-5 text-sm leading-7 text-neutral-600 sm:text-base">
          {item.description}
        </p>

        <div className="mt-5 rounded-2xl bg-[#f7f7f5] p-4 text-sm">
          <InfoLine label="Company" value={item.company} />
          <InfoLine label="Location" value={item.location} />
          <InfoLine label="Pay" value={item.pay} />
          <InfoLine label="Match" value={item.matchScore ? `${item.matchScore}%` : "Complete profile for better matches"} />
          <InfoLine label="Contact" value={canInteract ? item.contact : "Create a seeker account to view"} breakAll />
        </div>

        <FitExplanation item={item} />

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button onClick={onShare} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-3 text-sm font-medium transition hover:border-neutral-500">
            <FaShareAlt className="text-xs" />
            Share
          </button>

          <button onClick={onWhatsApp} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-3 text-sm font-medium transition hover:border-neutral-500">
            <FaWhatsapp className="text-xs" />
            WA
          </button>

          <button onClick={onReport} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-3 text-sm font-medium transition hover:border-neutral-500">
            <FaFlag className="text-xs" />
            Report
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={onSave}
            className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition ${
              saved ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-black hover:border-neutral-500"
            } ${!canInteract ? "opacity-70" : ""}`}
          >
            {saved ? <FaBookmark /> : <FaRegBookmark />}
            {saved ? "Saved" : "Save"}
          </button>

          <button onClick={onApply} className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium ${canInteract ? "bg-black text-white" : "bg-neutral-200 text-neutral-500"}`}>
            {!canInteract ? <FaLock className="text-xs" /> : <FaPaperPlane className="text-xs" />}
            {applied ? "Open" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FitExplanation({ item }) {
  const reasons = [];

  if (item.matchScore) reasons.push(`${item.matchScore}% profile match`);
  if (item.matchingSkills?.length) reasons.push(`Skill match: ${item.matchingSkills.slice(0, 3).join(", ")}`);
  if (item.matchingType) reasons.push(`Goal match: ${item.type}`);
  if (item.urgent) reasons.push("Urgent opportunity");
  if (item.featured) reasons.push("Featured by poster");

  return (
    <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <FaShieldAlt className="text-xs text-neutral-500" />
        <p className="text-sm font-medium">Why this may fit you</p>
      </div>

      <div className="mt-3 grid gap-2">
        {reasons.length > 0 ? (
          reasons.map((reason) => (
            <div key={reason} className="rounded-xl bg-[#f7f7f5] px-3 py-2 text-sm text-neutral-700">
              {reason}
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-neutral-600">
            Complete your profile with skills and goals to see stronger match explanations.
          </p>
        )}
      </div>
    </div>
  );
}

function InfoLine({ label, value, breakAll = false }) {
  return (
    <p className={`mt-2 first:mt-0 ${breakAll ? "break-all" : ""}`}>
      <span className="text-neutral-500">{label}:</span> {value}
    </p>
  );
}

function ApplyModal({ item, account, profile, profileStrength, onClose, onSubmit }) {
  const [message, setMessage] = useState(
    `Hi, I'm interested in the ${item.title} opportunity. I believe my skills fit this role.`
  );
  const [attachCv, setAttachCv] = useState(Boolean(profile.cv));

  const canSend = message.trim().length >= 20;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-0">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-[28px] bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-neutral-500">Apply to</p>
            <h2 className="mt-1 line-clamp-2 text-2xl font-semibold tracking-[-0.03em]">
              {item.title}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {item.company} · {item.location}
            </p>
          </div>

          <button onClick={onClose} className="shrink-0 rounded-full bg-[#f7f7f5] p-2 text-sm">
            <FaTimes />
          </button>
        </div>

        <ProfileStrengthCard strength={profileStrength} />

        <div className="mt-5 rounded-2xl bg-[#f7f7f5] p-4">
          <p className="text-sm font-medium">Application profile</p>
          <p className="mt-2 break-all text-sm leading-6 text-neutral-600">
            {account.name} · {account.city} · {account.email}
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Skills: {profile.skills?.length ? profile.skills.join(", ") : "No skills added"}
          </p>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium">Message</label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
          />

          <p className="mt-2 text-xs text-neutral-500">
            Keep it short, clear, and human. Minimum 20 characters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => profile.cv && setAttachCv(!attachCv)}
          className={`mt-5 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
            attachCv ? "border-black bg-black text-white" : "border-neutral-200 bg-white"
          } ${!profile.cv ? "cursor-not-allowed opacity-70" : ""}`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <FaFileAlt className="shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">
                {profile.cv ? "Attach CV metadata" : "No CV uploaded"}
              </span>
              <span className={`block truncate text-xs ${attachCv ? "text-neutral-300" : "text-neutral-500"}`}>
                {profile.cv ? profile.cv.name : "Upload a PDF CV from profile"}
              </span>
            </span>
          </span>

          {attachCv && <FaCheck className="shrink-0" />}
        </button>

        {!profile.cv && (
          <Link to="/profile" className="mt-3 inline-flex text-sm font-medium text-neutral-700 underline">
            Upload CV in profile
          </Link>
        )}

        <button
          disabled={!canSend}
          onClick={() => onSubmit({ item, message, attachCv })}
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium ${
            canSend ? "bg-black text-white" : "cursor-not-allowed bg-neutral-200 text-neutral-400"
          }`}
        >
          <FaPaperPlane className="text-xs" />
          Send application
        </button>
      </div>
    </div>
  );
}

function ProfileStrengthCard({ strength }) {
  const score = strength?.score || 0;
  const missing = strength?.missing || [];

  return (
    <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Profile strength</p>
          <p className="mt-1 text-xs text-neutral-500">
            Strong profiles usually get better replies.
          </p>
        </div>

        <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
          {score}%
        </span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-[#f7f7f5]">
        <div className="h-2 rounded-full bg-black transition-all" style={{ width: `${score}%` }} />
      </div>

      {missing.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Missing: {missing.join(", ")}. You can still apply now.
        </p>
      )}
    </div>
  );
}

function AuthRequiredModal({ type, onClose, onCreateAccount }) {
  const seekerOnly = type === "seeker-only";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-0">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-xl sm:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
          <FaLock />
        </div>

        <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
          {seekerOnly ? "Seeker account needed" : "Create an account first"}
        </h2>

        <p className="mt-3 text-sm leading-7 text-neutral-600 sm:text-base">
          {seekerOnly
            ? "Hiring accounts can post opportunities. Applying and saving are for people looking for work."
            : "You can browse as a guest, but saving jobs and applying requires a free Forsa account."}
        </p>

        <div className="mt-6 grid gap-2">
          {!seekerOnly && (
            <button onClick={onCreateAccount} className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white">
              Create account
            </button>
          )}

          <button onClick={onClose} className="rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium">
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}
