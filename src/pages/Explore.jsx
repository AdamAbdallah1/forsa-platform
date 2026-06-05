import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { showToast } from "../lib/Toast";
import ExploreSkeleton from "../components/ExploreSkeleton";
import Skeleton from "../components/Skeleton";
import { FaWhatsapp, FaCopy } from "react-icons/fa";
import SEO from "../components/SEO"
import Modal from "../components/ui/Modal";
import { getActivePosts } from "../lib/postService.js";
import Footer from "../components/Footer";
import { createNotification } from "../lib/notificationService";
import { createApplicationThread } from "../lib/applicationService";
import { getUserSavedJobs, saveJob, unsaveJob } from "../lib/savedJobsService";
import { createReport } from "../lib/reportService";
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
  FaMagic,
  FaLightbulb,
  FaExclamationTriangle,
  FaGlobe,
  FaBuilding
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";
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

const isAgencyPost = (post) =>
  post?.postSource === "agency" ||
  post?.sourceType === "agency" ||
  post?.category === "Recruitment Agency" ||
  post?.type === "Recruitment Agency";

const getWorkCountry = (post) =>
  post?.workCountry || post?.country || (isAgencyPost(post) ? "Abroad" : "Lebanon");

const isAbroadPost = (post) => {
  const country = normalize(getWorkCountry(post));
  return isAgencyPost(post) || (country && country !== "lebanon");
};

const getHiringFor = (post) =>
  post?.hiringFor || post?.clientCompany || post?.employer || post?.company || "Employer";

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
  const base = window.location.origin;
  return `${base}/explore?post=${encodeURIComponent(postId)}`;
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

const getDateValue = (value) => {
  if (!value) return Date.now();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
};

const types = ["All", "Internship", "Freelance", "Part-time", "Project", "Remote", "Agency", "Abroad"];
const sortOptions = ["Best match", "Newest", "Urgent", "Most applied"];

export default function Explore() {
  const navigate = useNavigate();
  const [shareItem, setShareItem] = useState(null);
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
  const [locationFilter, setLocationFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState(safeJson("forsaSavedJobs", []));
  const [savedLoading, setSavedLoading] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState(safeJson("forsaRecentlyViewed", []));
  const [firebasePosts, setFirebasePosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const users = safeJson("forsaUsers", []);
  const trustedPosters = safeJson("forsaTrustedPosters", []);

  const getCompanyTrust = (post) => {
    const ownerEmail = post.ownerEmail || post.contact || "";
    const companyUser = users.find(
      (user) =>
        user.accountType === "hiring" &&
        (user.email === ownerEmail ||
          user.companyEmail === ownerEmail ||
          user.companyName === post.company ||
          user.name === post.company)
    );

    return {
      verified: Boolean(post.verified || post.companyVerified || companyUser?.verified),
      trusted: Boolean(
        post.trusted ||
          post.companyTrusted ||
          companyUser?.trusted ||
          trustedPosters.includes(ownerEmail)
      ),
    };
  };

  useEffect(() => {
    let active = true;

    const loadPosts = async () => {
      setPostsLoading(true);

      try {
        const posts = await getActivePosts();

        if (!active) return;

        setFirebasePosts(posts);
        writeJson("forsaPostsCache", posts);
      } catch (error) {
        console.error("Load posts error:", error);

        if (!active) return;

        setFirebasePosts(safeJson("forsaPostsCache", []));
        showToast("Could not refresh posts. Showing saved data.", "info");
      } finally {
        if (active) setPostsLoading(false);
      }
    };

    loadPosts();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!account?.uid || isHiring) return;

    let active = true;

    const loadSavedJobs = async () => {
      try {
        const saved = await getUserSavedJobs(account.uid);

        if (!active) return;

        const normalized = saved.map((item) => ({
          ...cleanPostForStorage(item.post || {}),
          savedJobId: item.id,
          savedAt: item.savedAt,
        }));

        setSavedJobs(normalized);
        writeJson("forsaSavedJobs", normalized);
      } catch (error) {
        console.error("Load saved jobs error:", error);
        setSavedJobs(safeJson("forsaSavedJobs", []));
      }
    };

    loadSavedJobs();

    return () => {
      active = false;
    };
  }, [account?.uid, isHiring]);

  const allOpportunities = useMemo(() => {
    const localFallback = safeJson("forsaPosts", []);
    const sourcePosts = firebasePosts.length > 0 ? firebasePosts : localFallback;

    const normalizedPosts = sourcePosts
      .filter((post) => post.status !== "closed")
      .map((post) => ({
        ...post,
        icon: FaBriefcase,
        tags: post.tags || [],
        questions: post.questions || [],
        company: post.company || "Local poster",
        location: post.location || "Lebanon",
        type: post.type || "Project",
        pay: post.pay || "Not specified",
        contact: post.contact || "Not specified",
        description: post.description || "No description provided.",
        ownerEmail: post.ownerEmail || post.contact || null,
        createdAt: getDateValue(post.createdAt || post.id || Date.now()),
        updatedAt: getDateValue(post.updatedAt || post.createdAt || Date.now()),
        source: "community",
        postSource: post.postSource || post.sourceType || "direct",
        workCountry: getWorkCountry(post),
        hiringFor: getHiringFor(post),
        agencyName: post.agencyName || post.posterName || post.company,
        ...getCompanyTrust(post),
      }));

    const normalizedSeed = opportunities.map((item) => ({
      ...item,
      tags: item.tags || [],
      questions: item.questions || [],
      ownerEmail: item.ownerEmail || null,
      createdAt: item.createdAt || item.id || 0,
      source: "featured",
      verified: Boolean(item.verified || item.companyVerified),
      trusted: Boolean(item.trusted || item.companyTrusted),
      postSource: item.postSource || item.sourceType || "direct",
      workCountry: getWorkCountry(item),
      hiringFor: getHiringFor(item),
      agencyName: item.agencyName || item.posterName || item.company,
    }));

    return [...normalizedPosts, ...normalizedSeed];
  }, [firebasePosts]);

  const availableLocations = useMemo(() => {
    const locations = allOpportunities
      .map((item) => item.location || "Lebanon")
      .filter(Boolean);

    return ["All", ...Array.from(new Set(locations)).slice(0, 12)];
  }, [allOpportunities]);

  const hasActiveFilters =
    search.trim() || activeType !== "All" || locationFilter !== "All" || sortBy !== "Best match";

  const clearFilters = () => {
    setSearch("");
    setActiveType("All");
    setLocationFilter("All");
    setSortBy("Best match");
  };

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
      const searchText = `${item.title} ${item.company} ${item.location} ${item.type} ${item.workCountry || ""} ${item.hiringFor || ""} ${item.agencyName || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
      const matchesSearch = query.length === 0 || searchText.includes(query);
      const matchesType =
        activeType === "All" ||
        item.type === activeType ||
        (activeType === "Agency" && isAgencyPost(item)) ||
        (activeType === "Abroad" && isAbroadPost(item));
      const matchesLocation =
        locationFilter === "All" ||
        normalize(item.location).includes(normalize(locationFilter));

      return matchesSearch && matchesType && matchesLocation;
    });

    const scored = filtered.map((item) => {
      const matchScore = calculateMatchScore(item, savedProfile, account);
      const { matchingSkills, matchingType } = getMatchMeta(item, savedProfile);
      const recencyScore = item.createdAt ? Math.min(15, new Date(item.createdAt).getTime() / 100000000000) : 0;
      const rankScore =
        matchScore +
        (item.featured ? 20 : 0) +
        (item.verified ? 12 : 0) +
        (item.trusted ? 6 : 0) +
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

    if (sortBy === "Most applied") {
      return scored.sort(
        (a, b) =>
          getApplicantCount(b.id) - getApplicantCount(a.id) ||
          b.matchScore - a.matchScore ||
          new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    return scored.sort((a, b) => b.rankScore - a.rankScore);
  }, [allOpportunities, search, activeType, locationFilter, sortBy, savedProfile, account]);

  const recommendedOpportunities = useMemo(() => {
    if (!canInteract) return [];
    return rankedOpportunities
      .filter((item) => item.matchScore >= 58)
      .slice(0, 6);
  }, [rankedOpportunities, canInteract]);

  const featuredOpportunities = useMemo(() => {
    return rankedOpportunities
      .filter((item) => item.featured || item.verified || item.trusted)
      .slice(0, 6);
  }, [rankedOpportunities]);

  useEffect(() => {
    const postId = readSharedPostId(searchParams, location);
    if (!postId) return;

    const found = allOpportunities.find((item) => String(item.id) === String(postId));

    if (!found) {
      showToast(postsLoading ? "Loading post..." : "This post is not available", "info");
      return;
    }

    openDetails(found, { replaceUrl: true });
  }, [searchParams, location.search, location.hash, allOpportunities]);

  const stats = useMemo(() => {
    return {
      total: rankedOpportunities.length,
      urgent: rankedOpportunities.filter((item) => item.urgent).length,
      abroad: rankedOpportunities.filter((item) => isAbroadPost(item)).length,
      saved: savedJobs.length,
      applied: appliedIds.size,
    };
  }, [rankedOpportunities, savedJobs.length, appliedIds]);

  const isSaved = (id) => savedJobs.some((job) => String(job.id) === String(id));

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

  const toggleSave = async (item) => {
    if (!requireSeekerAccount("save")) return;
    if (!account?.uid || savedLoading) return;

    const alreadySaved = isSaved(item.id);
    const cleanPost = cleanPostForStorage(item);

    const optimistic = alreadySaved
      ? savedJobs.filter((job) => String(job.id) !== String(item.id))
      : [{ ...cleanPost, savedAt: new Date().toISOString() }, ...savedJobs];

    setSavedJobs(optimistic);
    writeJson("forsaSavedJobs", optimistic);
    setSavedLoading(true);

    try {
      if (alreadySaved) {
        await unsaveJob({
          userUid: account.uid,
          postId: item.id,
        });
      } else {
        await saveJob({
          userUid: account.uid,
          userEmail: account.email,
          post: cleanPost,
        });

        updatePostAnalytics(item.id, "saves");
      }

      showToast(alreadySaved ? "Removed from saved jobs" : "Saved to profile");
    } catch (error) {
      console.error("Save job error:", error);
      setSavedJobs(savedJobs);
      writeJson("forsaSavedJobs", savedJobs);
      showToast("Could not update saved jobs. Try again.", "error");
    } finally {
      setSavedLoading(false);
    }
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

  const getApplicantCount = (postId) => {
  return safeJson("forsaMessages", []).filter(
    (thread) => String(thread.opportunityId) === String(postId)
  ).length;
};

  const shareToWhatsApp = (item) => {
    const url = buildPostUrl(item.id);
    const text = `Check this opportunity on Forsa:\n${item.title}\n${isAgencyPost(item) ? `Agency post · Hiring for ${getHiringFor(item)}` : item.company}\n${isAbroadPost(item) ? `Work country: ${getWorkCountry(item)}\n` : ""}${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    updatePostAnalytics(item.id, "shares");
  };

  const reportOpportunity = async (item) => {
    if (!isLoggedIn) {
      setAuthModal("report");
      return;
    }

    const reason = window.prompt(
      "Report reason: fake post, unclear pay, spam, unsafe, or other"
    );

    if (!reason?.trim()) return;

    try {
      await createReport({
        postId: item.id,
        title: item.title,
        company: item.company,
        reason: reason.trim(),
        reporterUid: account?.uid || null,
        reporterEmail: account?.email || "guest",
        ownerUid: item.ownerUid || null,
        ownerEmail: item.ownerEmail || item.contact || null,
        post: cleanPostForStorage(item),
      });

      updatePostAnalytics(item.id, "reports");
      showToast("Report submitted", "info");
    } catch (error) {
      console.error("Create report error:", error);
      showToast("Could not submit report. Try again.", "error");
    }
  };

  const submitApplication = async ({ item, message, attachCv, answers }) => {
    const messages = safeJson("forsaMessages", []);
    const existing = messages.find(
      (thread) =>
        thread.opportunityId === item.id &&
        thread.seeker?.email === account.email
    );

    const now = new Date().toISOString();

    const baseThreadPayload = {
      opportunityId: item.id,
      ownerUid: item.ownerUid || null,
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
        uid: account.uid || null,
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

    try {
      const createdThread = existing
        ? {
            ...existing,
            ...baseThreadPayload,
            id: existing.id,
          }
        : await createApplicationThread(baseThreadPayload);

      const updatedMessages = existing
        ? messages.map((thread) =>
            thread.id === existing.id ? createdThread : thread
          )
        : [createdThread, ...messages];

      writeJson("forsaMessages", updatedMessages);
      writeJson("forsaMessagesCache", updatedMessages);

      await createNotification({
        type: "new_application",
        title: "New application received",
        text: `${account.name} applied to ${item.title}`,
        targetEmail: item.ownerEmail || item.contact || null,
      });

      updatePostAnalytics(item.id, "applications");

      setApplyOpportunity(null);
      showToast(existing ? "Application updated" : "Application sent");
      navigate("/messages");
    } catch (error) {
      console.error("Create application error:", error);
      showToast("Could not send application. Try again.", "error");
    }
  };

  return (
    <section className="min-h-screen">
      <SEO
    title="Explore"
    description="Explore jobs, internships, freelance gigs, and local opportunities in Lebanon on Forsa."
  />
      <AppHeader />
      

      <div className="mx-auto max-w-[1180px] px-4 pb-40 sm:px-6 md:pb-28 lg:pb-20">
                <HeroBar
          isHiring={isHiring}
          isLoggedIn={isLoggedIn}
          navigate={navigate}
          stats={stats}
        />
        <SearchPanel
          search={search}
          setSearch={setSearch}
          activeType={activeType}
          setActiveType={setActiveType}
          sortBy={sortBy}
          setSortBy={setSortBy}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          availableLocations={availableLocations}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={Boolean(hasActiveFilters)}
          clearFilters={clearFilters}
        />

        <StatusCard
          isLoggedIn={isLoggedIn}
          isHiring={isHiring}
          savedProfile={savedProfile}
          navigate={navigate}
        />

        {recentlyViewed.length > 0 && (
          <RecentlyViewedSection
            items={recentlyViewed}
            onOpen={(item) => openDetails(item)}
          />
        )}

        {featuredOpportunities.length > 0 && (
          <FeaturedSection
            items={featuredOpportunities}
            savedJobs={savedJobs}
            appliedIds={appliedIds}
            canInteract={canInteract}
            onSave={toggleSave}
            onDetails={openDetails}
            onApply={openApply}
            onShare={(item) => setShareItem(item)}
            navigate={navigate}
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
              className="hidden rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-black sm:inline-flex"
            >
              Improve profile
            </Link>
          )}
        </div>

        {postsLoading ? (
  <ExploreSkeleton />
) : rankedOpportunities.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="mt-5 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rankedOpportunities.map((item) => (
              <OpportunityCard
                key={item.id}
                item={item}
                applicantCount={getApplicantCount(item.id)}
                saved={isSaved(item.id)}
                savedLoading={savedLoading}
                applied={appliedIds.has(item.id)}
                canInteract={canInteract}
                onSave={() => toggleSave(item)}
                onDetails={() => openDetails(item)}
                onApply={() =>
                  appliedIds.has(item.id) ? navigate("/messages") : openApply(item)
                }
                onShare={() => setShareItem(item)}
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
      <Footer />
      <Modal
  open={Boolean(shareItem)}
  title="Share opportunity"
  onClose={() => setShareItem(null)}
>
  {shareItem && (
    <div>
      <p className="text-sm leading-7 text-neutral-600">
        Share this opportunity with someone who might be a good fit.
      </p>

      <div className="mt-5 rounded-2xl bg-[var(--forsa-bg)] p-4">
        <p className="text-sm font-semibold">{shareItem.title}</p>
        <p className="mt-1 text-sm text-neutral-500">
          {shareItem.company} · {shareItem.location}
        </p>
      </div>

      <div className="mt-5 grid gap-2">
        <button
          onClick={() => {
            shareToWhatsApp(shareItem);
            setShareItem(null);
          }}
          className="flex items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white"
        >
          <FaWhatsapp />
          Share on WhatsApp
        </button>

        <button
          onClick={() => {
            shareOpportunity(shareItem);
            setShareItem(null);
          }}
          className="flex items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-700"
        >
          <FaCopy />
          Copy link
        </button>
      </div>
    </div>
  )}
</Modal>
    </section>
  );
}

function HeroBar({ isHiring, isLoggedIn, navigate, stats }) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-[34px] border border-white/70 bg-white/85 p-5 shadow-[0_24px_80px_rgba(109,40,217,0.10)] backdrop-blur-2xl sm:mt-8 sm:p-6 md:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--forsa-glow)]/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[var(--forsa-gold)]/12 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.10),transparent_42%)]" />

      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white/80 px-3 py-2 text-xs font-medium text-[var(--forsa-primary)] shadow-sm">
            <FaBolt className="text-[10px]" />
            Smart opportunity discovery
          </div>

          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[0.96] tracking-[-0.06em] sm:text-4xl md:text-5xl">
            Explore work that matches your profile, city, and goals.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Browse local jobs, internships, gigs, agency posts, and abroad opportunities with cleaner cards, safety signals, and organized application flow.
          </p>
        </div>

        <button
          onClick={() => navigate(isHiring ? "/post" : isLoggedIn ? "/profile" : "/auth")}
          className="forsa-button group inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-medium text-white transition hover:-translate-y-0.5 sm:w-fit"
        >
          {isHiring ? "Post opportunity" : isLoggedIn ? "Improve profile" : "Join Forsa"}
          <FaArrowRight className="text-xs transition group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="relative mt-7 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <MiniStat label="Results" value={stats.total} />
        <MiniStat label="Urgent" value={stats.urgent} />
        <MiniStat label="Abroad" value={stats.abroad} />
        <MiniStat label="Saved" value={stats.saved} />
        <MiniStat label="Applied" value={stats.applied} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-[22px] border border-[var(--forsa-border)] bg-white/78 p-4 shadow-sm backdrop-blur-xl">
      <p className="text-2xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
    </div>
  );
}

function SearchPanel({
  search,
  setSearch,
  activeType,
  setActiveType,
  sortBy,
  setSortBy,
  locationFilter,
  setLocationFilter,
  availableLocations,
  showFilters,
  setShowFilters,
  hasActiveFilters,
  clearFilters,
}) {
  return (
    <>
      <div className="sticky top-[76px] z-30 -mx-4 mt-4 border-y border-[var(--forsa-border)]/80 bg-white/92 px-4 py-3 shadow-[0_12px_40px_rgba(109,40,217,0.06)] backdrop-blur-2xl sm:mx-0 sm:mt-5 sm:rounded-[28px] sm:border sm:p-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="forsa-focus flex items-center gap-3 rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg-soft)]/65 px-4 py-3.5 transition">
            <FaSearch className="text-sm text-[var(--forsa-primary)]" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search role, skill, company, city..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="forsa-click rounded-full bg-white px-2 py-1 text-xs text-neutral-500"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="forsa-click inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] lg:hidden"
            >
              <FaSlidersH className="text-xs" />
              Filters
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-[var(--forsa-primary)]" />
              )}
            </button>

            <div className="hidden gap-2 overflow-x-auto lg:flex">
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
        </div>

        <div className="mt-3 hidden gap-2 overflow-x-auto pb-1 lg:flex">
          {types.map((type) => (
            <FilterButton key={type} active={activeType === type} onClick={() => setActiveType(type)}>
              {type}
            </FilterButton>
          ))}

          <div className="mx-1 h-9 w-px shrink-0 bg-[var(--forsa-border)]" />

          {availableLocations.slice(0, 8).map((city) => (
            <FilterButton key={city} active={locationFilter === city} onClick={() => setLocationFilter(city)}>
              <span className="inline-flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-[10px]" />
                {city}
              </span>
            </FilterButton>
          ))}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="forsa-click shrink-0 rounded-full border border-red-100 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-600"
            >
              Clear all
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {search.trim() && <ActiveChip label={`Search: ${search}`} onClear={() => setSearch("")} />}
            {activeType !== "All" && <ActiveChip label={activeType} onClear={() => setActiveType("All")} />}
            {locationFilter !== "All" && <ActiveChip label={locationFilter} onClear={() => setLocationFilter("All")} />}
            {sortBy !== "Best match" && <ActiveChip label={sortBy} onClear={() => setSortBy("Best match")} />}
          </div>
        )}
      </div>

      <Modal
        open={showFilters}
        title="Filter opportunities"
        onClose={() => setShowFilters(false)}
        maxWidth="max-w-lg"
      >
        <div className="grid gap-6">
          <FilterGroup title="Sort by">
            <div className="grid grid-cols-2 gap-2">
              {sortOptions.map((option) => (
                <FilterButton key={option} active={sortBy === option} onClick={() => setSortBy(option)}>
                  {option}
                </FilterButton>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Opportunity type">
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <FilterButton key={type} active={activeType === type} onClick={() => setActiveType(type)}>
                  {type}
                </FilterButton>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Location">
            <div className="flex max-h-[180px] flex-wrap gap-2 overflow-auto pr-1">
              {availableLocations.map((city) => (
                <FilterButton key={city} active={locationFilter === city} onClick={() => setLocationFilter(city)}>
                  {city}
                </FilterButton>
              ))}
            </div>
          </FilterGroup>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="forsa-click rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-700"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="forsa-click forsa-button rounded-full px-5 py-3 text-sm font-semibold text-white"
            >
              Show results
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function ActiveChip({ label, onClear }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="forsa-click inline-flex items-center gap-2 rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--forsa-primary)]"
    >
      {label}
      <FaTimes className="text-[10px]" />
    </button>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`forsa-click shrink-0 rounded-full border px-4 py-2.5 text-[13px] font-medium transition ${
        active
          ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white shadow-[0_12px_28px_rgba(109,40,217,0.20)]"
          : "border-[var(--forsa-border)] bg-white text-neutral-600 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
      }`}
    >
      {children}
    </button>
  );
}

function RecentlyViewedSection({ items = [], onOpen }) {
  if (!items.length) return null;

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-500">Recently viewed</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
            Continue browsing
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("forsaRecentlyViewed");
            location.reload();
          }}
          className="rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-semibold text-neutral-500"
        >
          Clear
        </button>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {items.slice(0, 8).map((item) => (
          <button
            key={`${item.id}-${item.viewedAt || "viewed"}`}
            onClick={() => onOpen(item)}
            className="min-w-[260px] rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-[var(--forsa-primary)]"
          >
            <div className="flex items-center gap-2">
              <p className="truncate text-xs text-neutral-500">{item.company}</p>
              {item.verified && <VerifiedBadge />}
            </div>
            <h3 className="mt-2 line-clamp-2 font-semibold tracking-[-0.02em]">
              {item.title}
            </h3>
            <p className="mt-3 text-sm text-neutral-600">{item.location}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
function FeaturedSection({
  items,
  savedJobs,
  appliedIds,
  canInteract,
  onSave,
  onDetails,
  onApply,
  onShare,
  navigate,
}) {
  const isSaved = (id) => savedJobs.some((job) => String(job.id) === String(id));

  return (
    <section className="mt-6 overflow-hidden rounded-[32px] border border-[var(--forsa-border)] bg-white p-4 shadow-[0_18px_65px_rgba(109,40,217,0.10)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--forsa-primary)]">
            <FaStar className="text-[10px]" />
            Featured
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
            Featured opportunities
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Verified, trusted, or highlighted posts from companies on Forsa.
          </p>
        </div>

        <span className="w-fit rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-4 py-2 text-xs font-semibold text-neutral-500">
          {items.length} featured
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.slice(0, 4).map((item) => (
          <CompactRecommendationCard
            key={`featured-${item.id}`}
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

function RecommendedSection({ items, savedJobs, appliedIds, canInteract, onSave, onDetails, onApply, onShare, navigate }) {
  const isSaved = (id) => savedJobs.some((job) => String(job.id) === String(id));

  return (
    <section className="mt-6 rounded-[28px] border border-[var(--forsa-border)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-5">
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
    <article className="rounded-[24px] bg-[var(--forsa-bg)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--forsa-primary)] px-2.5 py-1 text-[11px] font-medium text-white">
              {item.matchScore}% match
            </span>
            {isAgencyPost(item) && <AgencyBadge compact />}
            {isAbroadPost(item) && <AbroadBadge compact country={getWorkCountry(item)} />}
            {item.urgent && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-neutral-600">Urgent</span>}
          </div>
          <h3 className="mt-3 line-clamp-2 font-semibold tracking-[-0.02em]">{item.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <span>{item.company} · {item.location}</span>
            {item.verified && <VerifiedBadge />}
            {!item.verified && item.trusted && <TrustedBadge />}
          </div>
        </div>

        <button
          onClick={onSave}
          className={`shrink-0 rounded-full border p-2 ${saved ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white" : "border-[var(--forsa-border)] bg-white text-neutral-500"} ${!canInteract ? "opacity-70" : ""}`}
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
        <button onClick={onApply} className={`rounded-full px-3 py-2.5 text-sm font-medium ${canInteract ? "bg-[var(--forsa-primary)] text-white" : "bg-neutral-200 text-neutral-500"}`}>
          {applied ? "Open" : "Apply"}
        </button>
      </div>
    </article>
  );
}

function OpportunityCard({
  item,
  saved,
  savedLoading,
  applied,
  canInteract,
  applicantCount,
  onSave,
  onDetails,
  onApply,
  onShare,
}) {
  const Icon = item.icon || FaBriefcase;
  const description = item.description || "";
  const tags = item.tags || [];
  const visibleTags = tags.slice(0, 4);
  const hiddenTags = Math.max(0, tags.length - visibleTags.length);
  const isLongDescription = description.length > 128;

  const fitText = item.matchingSkills?.length
    ? item.matchingSkills.slice(0, 2).join(", ")
    : item.matchingType
    ? item.type
    : "Improve profile";

  return (
    <article className="group relative flex min-h-[430px] flex-col overflow-hidden rounded-[30px] border border-[#e9e3f3] bg-white shadow-[0_12px_38px_rgba(17,17,17,0.055)] transition duration-300 hover:-translate-y-1 hover:border-[var(--forsa-soft)] hover:shadow-[0_24px_75px_rgba(109,40,217,0.13)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--forsa-primary),var(--forsa-glow),#d946ef)]" />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4efff] text-[var(--forsa-primary)] ring-1 ring-[#e8ddff]">
              <Icon className="text-sm" />
            </div>

            <div className="min-w-0">
              <div className="mb-1 flex h-5 items-center gap-1.5 overflow-hidden">
                {item.verified && (
                  <Badge>
                    <FaShieldAlt className="text-[8px]" />
                    Verified
                  </Badge>
                )}
                {isAgencyPost(item) && <Badge tone="amber">Agency</Badge>}
                {isAbroadPost(item) && <Badge tone="blue">{getWorkCountry(item)}</Badge>}
                {!item.verified && item.trusted && <Badge>Trusted</Badge>}
                {item.source === "featured" && <Badge>Featured</Badge>}
                {item.urgent && (
                  <Badge tone="red">
                    <FaBolt className="text-[8px]" />
                    Urgent
                  </Badge>
                )}
                {applied && <Badge tone="green">Applied</Badge>}
              </div>

              <h3 className="line-clamp-2 min-h-[42px] text-[16px] font-semibold leading-[1.28] tracking-[-0.035em] text-neutral-950">
                {item.title}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-neutral-500">
                <FaMapMarkerAlt className="shrink-0 text-[10px] text-neutral-400" />
                <span className="truncate">{item.company} · {item.location}</span>
                {item.verified && <VerifiedBadge />}
                {!item.verified && item.trusted && <TrustedBadge />}
              </div>
            </div>
          </div>

          <button
            onClick={onSave}
            disabled={savedLoading}
            className={`shrink-0 rounded-full border p-2 transition ${
              saved
                ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white"
                : "border-[#e7e0f0] bg-white text-neutral-500 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
            } ${!canInteract ? "opacity-70" : ""}`}
            aria-label="Save opportunity"
          >
            {saved ? <FaBookmark className="text-sm" /> : <FaRegBookmark className="text-sm" />}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MetaChip label={isAgencyPost(item) ? "Source" : "Type"} value={isAgencyPost(item) ? "Agency" : item.type} />
          <MetaChip label="Pay" value={item.pay} />
          <MetaChip label={isAbroadPost(item) ? "Country" : "Applicants"} value={isAbroadPost(item) ? getWorkCountry(item) : `${applicantCount}`} />
        </div>

        <div className="mt-4 h-[64px]">
          <p className="line-clamp-2 text-[13px] leading-6 text-neutral-600">
            {description}
          </p>

          {isLongDescription && (
            <button
              type="button"
              onClick={onDetails}
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--forsa-primary)]"
            >
              Read full details
              <FaArrowRight className="text-[9px]" />
            </button>
          )}
        </div>

        {isAgencyPost(item) && <AgencyMiniNotice item={item} />}

        <div className="mt-4 rounded-[22px] border border-[#eee8f7] bg-[#fbfaff] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-800">Forsa Fit</p>
              <p className="mt-1 truncate text-xs text-neutral-500">{fitText}</p>
            </div>

            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--forsa-primary)] shadow-sm ring-1 ring-[#eee8ff]">
              {item.matchScore || 0}%
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eee8ff]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--forsa-primary),var(--forsa-glow))]"
              style={{ width: `${Math.min(100, Math.max(6, item.matchScore || 0))}%` }}
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Skills / tags
            </p>

            {hiddenTags > 0 && (
              <button
                type="button"
                onClick={onDetails}
                className="shrink-0 text-xs font-semibold text-[var(--forsa-primary)]"
              >
                +{hiddenTags} more
              </button>
            )}
          </div>

          <div className="grid min-h-[74px] grid-cols-2 gap-2">
            {visibleTags.length > 0 ? (
              visibleTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={onDetails}
                  className="flex min-w-0 items-center justify-center rounded-2xl border border-[#e9e4f2] bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
                >
                  <span className="truncate">{tag}</span>
                </button>
              ))
            ) : (
              <div className="col-span-2 flex items-center justify-center rounded-2xl border border-dashed border-[#e9e4f2] bg-white px-3 py-2 text-xs text-neutral-400">
                No tags added
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_44px_1fr] gap-2 border-t border-[#eee8f7] bg-[#fbfaff] p-3 pb-5 md:pb-3">
        <button
          onClick={onDetails}
          className="rounded-full border border-[#e7e2f1] bg-white px-3 py-2.5 text-sm font-semibold transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
        >
          Details
        </button>

        <button
          onClick={onShare}
          className="inline-flex items-center justify-center rounded-full border border-[#e7e2f1] bg-white px-3 py-2.5 text-sm font-semibold transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
          aria-label="Share opportunity"
        >
          <FaShareAlt className="text-xs" />
        </button>

        <button
          onClick={onApply}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition ${
            canInteract
              ? "bg-[linear-gradient(135deg,var(--forsa-primary),var(--forsa-glow))] text-white shadow-[0_12px_26px_rgba(109,40,217,0.20)] hover:-translate-y-0.5"
              : "bg-neutral-200 text-neutral-500"
          }`}
        >
          {!canInteract ? <FaLock className="text-xs" /> : <FaPaperPlane className="text-xs" />}
          {applied ? "Open" : "Apply"}
        </button>
      </div>
    </article>
  );
}


function AgencyBadge({ compact = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-50 font-semibold text-amber-700 ${
        compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
      }`}
    >
      <FaBuilding className="text-[9px]" />
      Agency post
    </span>
  );
}

function AbroadBadge({ country = "Abroad", compact = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-blue-50 font-semibold text-blue-700 ${
        compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
      }`}
    >
      <FaGlobe className="text-[9px]" />
      {country || "Abroad"}
    </span>
  );
}

function AgencyMiniNotice({ item }) {
  return (
    <div className="mt-4 rounded-[20px] border border-amber-100 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        <FaBuilding className="mt-0.5 shrink-0 text-xs text-amber-700" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-amber-800">Posted by agency</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-amber-800">
            Hiring for {getHiringFor(item)} · {getWorkCountry(item)}. Confirm details before applying.
          </p>
        </div>
      </div>
    </div>
  );
}

function AgencySafetyNotice({ item }) {
  return (
    <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-amber-700">
          <FaExclamationTriangle className="text-sm" />
        </div>

        <div>
          <p className="font-semibold text-amber-900">Recruitment agency notice</p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            This opportunity is posted by a recruitment or placement office, not necessarily the final employer. Confirm fees, employer identity, visa process, contract details, salary, and travel requirements before applying or sending documents.
          </p>

          <div className="mt-3 grid gap-2 text-sm text-amber-900">
            <div className="rounded-xl bg-white/70 px-3 py-2">
              Hiring for: <span className="font-semibold">{getHiringFor(item)}</span>
            </div>
            <div className="rounded-xl bg-white/70 px-3 py-2">
              Work country: <span className="font-semibold">{getWorkCountry(item)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--forsa-bg-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--forsa-primary)]">
      <FaShieldAlt className="text-[9px]" />
      Verified
    </span>
  );
}

function TrustedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
      <FaCheck className="text-[9px]" />
      Trusted
    </span>
  );
}

function Badge({ children, tone = "purple" }) {
  const styles = {
    purple: "bg-[#f3edff] text-[var(--forsa-primary)]",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}

function MetaChip({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl bg-[#f8f6fb] px-3 py-2">
      <p className="text-[10px] font-medium text-neutral-400">{label}</p>
      <p className="mt-0.5 truncate text-xs font-semibold text-neutral-700">
        {value || "—"}
      </p>
    </div>
  );
}

function StatusCard({ isLoggedIn, isHiring, savedProfile, navigate }) {
  if (!isLoggedIn) {
    return (
      <div className="mt-4 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-bg)]">
              <FaUserCircle className="text-neutral-500" />
            </div>

            <div>
              <p className="font-medium">Browsing as guest</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Create a profile to save jobs, apply, and send messages.
              </p>
            </div>
          </div>

          <button onClick={() => navigate("/auth")} className="w-full rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-medium text-white sm:w-fit">
            Create account
          </button>
        </div>
      </div>
    );
  }

  if (isHiring) {
    return (
      <div className="mt-4 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <p className="font-medium">Hiring mode</p>
        <p className="mt-1 text-sm leading-6 text-neutral-600">
          Browse the market and manage applicants from your profile dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] md:grid-cols-2">
      <SkillBox title="Your skills" skills={savedProfile.skills} />
      <SkillBox title="Looking for" skills={savedProfile.lookingFor} />
    </div>
  );
}

function SkillBox({ title, skills }) {
  return (
    <div className="rounded-2xl bg-[var(--forsa-bg)] p-4">
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

function LoadingState() {
  return (
    <div className="mt-5 rounded-[26px] border border-[var(--forsa-border)] bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-10">
      <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-[var(--forsa-bg)]" />

      <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
        Loading opportunities
      </h3>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
        Fetching the latest posts from Forsa.
      </p>
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="mt-5 rounded-[26px] border border-[var(--forsa-border)] bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg)]">
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
  const styles = {
    dark: "bg-[var(--forsa-primary)] text-white",
    gold: "bg-[var(--forsa-gold)] text-black",
    red: "bg-[var(--forsa-red)] text-white",
    light: "bg-[#f7f5fb] text-neutral-600",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        styles[tone] || styles.light
      }`}
    >
      {icon}
      {children}
    </span>
  );
}

function OpportunityModal({ item, saved, canInteract, applied, onSave, onApply, onShare, onWhatsApp, onReport, onClose }) {
  const Icon = item.icon || FaBriefcase;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--forsa-primary)]/30 px-4 pb-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-0">
      <div className="max-h-[86vh] w-full max-w-md overflow-auto rounded-[28px] bg-white p-5 pb-28 shadow-xl sm:p-6 sm:pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-primary)] text-white">
              <Icon />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                <span>{item.type}</span>
                {isAgencyPost(item) && <AgencyBadge compact />}
                {isAbroadPost(item) && <AbroadBadge compact country={getWorkCountry(item)} />}
              </div>
              <h2 className="mt-1 line-clamp-2 text-2xl font-semibold tracking-[-0.03em]">
                {item.title}
              </h2>
            </div>
          </div>

          <button onClick={onClose} className="shrink-0 rounded-full bg-[var(--forsa-bg)] p-2 text-sm">
            <FaTimes />
          </button>
        </div>

        <p className="mt-5 text-sm leading-7 text-neutral-600 sm:text-base">
          {item.description}
        </p>

        <div className="mt-5 rounded-2xl bg-[var(--forsa-bg)] p-4 text-sm">
          <InfoLine label={isAgencyPost(item) ? "Posted by" : "Company"} value={item.verified ? `${item.company} · Verified` : item.trusted ? `${item.company} · Trusted` : item.company} />
          {isAgencyPost(item) && <InfoLine label="Hiring for" value={getHiringFor(item)} />}
          {isAgencyPost(item) && <InfoLine label="Post type" value="Recruitment / placement agency" />}
          <InfoLine label={isAbroadPost(item) ? "Work location" : "Location"} value={isAbroadPost(item) ? `${item.location} · ${getWorkCountry(item)}` : item.location} />
          <InfoLine label="Pay" value={item.pay} />
          <InfoLine label="Match" value={item.matchScore ? `${item.matchScore}%` : "Complete profile for better matches"} />
          <InfoLine label="Contact" value={canInteract ? item.contact : "Create a seeker account to view"} breakAll />
        </div>

        {isAgencyPost(item) && <AgencySafetyNotice item={item} />}

        <FitExplanation item={item} />

        <div className="mt-4 rounded-2xl bg-[var(--forsa-bg-soft)] px-4 py-3 text-sm leading-6 text-[var(--forsa-primary)]">
          <span className="font-semibold">Smart tip:</span> Use the match assistant before applying to improve your profile and increase your chances.
        </div>

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
              saved ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white" : "border-neutral-300 bg-white text-black hover:border-neutral-500"
            } ${!canInteract ? "opacity-70" : ""}`}
          >
            {saved ? <FaBookmark /> : <FaRegBookmark />}
            {saved ? "Saved" : "Save"}
          </button>

          <button onClick={onApply} className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium ${canInteract ? "bg-[var(--forsa-primary)] text-white" : "bg-neutral-200 text-neutral-500"}`}>
            {!canInteract ? <FaLock className="text-xs" /> : <FaPaperPlane className="text-xs" />}
            {applied ? "Open" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FitExplanation({ item }) {
  const account = safeJson("forsaAccount", null);
  const profile = safeJson("forsaProfile", {
    skills: [],
    lookingFor: [],
    cv: null,
  });

  const skills = profile.skills || [];
  const goals = profile.lookingFor || [];
  const postTags = item.tags || [];

  const matchingSkills = postTags.filter((tag) =>
    skills.some((skill) => normalize(skill) === normalize(tag))
  );

  const missingSkills = postTags
    .filter((tag) => !matchingSkills.some((match) => normalize(match) === normalize(tag)))
    .slice(0, 3);

  const typeMatch = goals.some((goal) => {
    const value = normalize(goal);
    const type = normalize(item.type);
    return (
      value === type ||
      value === `${type} work` ||
      value === `${type} job` ||
      value.includes(type) ||
      type.includes(value)
    );
  });

  const locationMatch =
    account?.city &&
    item.location &&
    normalize(item.location).includes(normalize(account.city));

  const hasCv = Boolean(profile.cv?.url || profile.cv?.name);
  const matchScore = item.matchScore || calculateMatchScore(item, profile, account);

  const positives = [
    matchingSkills.length > 0 && {
      title: "Skill match detected",
      text: `${matchingSkills.slice(0, 3).join(", ")} match this opportunity.`,
    },
    typeMatch && {
      title: "Goal match",
      text: `This fits your selected interest: ${item.type}.`,
    },
    locationMatch && {
      title: "Location advantage",
      text: `This is close to your profile city: ${account.city}.`,
    },
    hasCv && {
      title: "CV ready",
      text: "You already have a CV attached, so applying will feel more complete.",
    },
    item.urgent && {
      title: "Fast-moving role",
      text: "This opportunity is marked urgent, so applying early may help.",
    },
    item.verified && {
      title: "Verified company signal",
      text: "This post has a verified company signal on Forsa.",
    },
    isAgencyPost(item) && {
      title: "Agency post detected",
      text: `This was posted by a recruitment or placement office for ${getHiringFor(item)}.`,
    },
    isAbroadPost(item) && {
      title: "Abroad opportunity",
      text: `This role may involve working outside Lebanon: ${getWorkCountry(item)}.`,
    },
  ].filter(Boolean);

  const improvements = [
    !hasCv && "Add a CV link to improve your application strength.",
    matchingSkills.length === 0 && postTags.length > 0 && `Add relevant skills like ${missingSkills.join(", ")} if you have them.`,
    !typeMatch && "Update your work interests so Forsa can recommend better roles.",
    !locationMatch && account?.city && "Check commute/location before applying.",
    isAgencyPost(item) && "Confirm employer identity, fees, contract, visa process, and salary before sharing personal documents.",
  ].filter(Boolean);

  const verdict =
    matchScore >= 80
      ? "Strong fit"
      : matchScore >= 60
      ? "Good fit"
      : matchScore >= 40
      ? "Possible fit"
      : "Needs profile info";

  return (
    <div className="mt-5 overflow-hidden rounded-[24px] border border-[#eadfff] bg-[linear-gradient(135deg,#ffffff,#fbfaff)] shadow-[0_18px_55px_rgba(109,40,217,0.08)]">
      <div className="relative p-4">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--forsa-glow)]/20 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--forsa-primary)]">
              <FaMagic className="text-[10px]" />
              Forsa Match Assistant
            </div>

            <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em]">
              {verdict}
            </h3>

            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Forsa analyzed your profile against this opportunity.
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-3xl font-semibold tracking-[-0.06em] text-[var(--forsa-primary)]">
              {matchScore}%
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              match
            </p>
          </div>
        </div>

        <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-[#eee8ff]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--forsa-primary),var(--forsa-glow))]"
            style={{ width: `${Math.min(100, Math.max(6, matchScore))}%` }}
          />
        </div>

        <div className="relative mt-4 grid gap-2">
          {positives.length > 0 ? (
            positives.slice(0, 4).map((item) => (
              <div key={item.title} className="rounded-2xl bg-white p-3 ring-1 ring-[#eee8ff]">
                <div className="flex items-start gap-2">
                  <FaCheck className="mt-1 text-xs text-[var(--forsa-primary)]" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-neutral-600">{item.text}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eee8ff]">
              <div className="flex items-start gap-2">
                <FaLightbulb className="mt-1 text-xs text-[var(--forsa-primary)]" />
                <p className="text-sm leading-6 text-neutral-600">
                  Complete your profile with skills, goals, city, and CV to unlock better match analysis.
                </p>
              </div>
            </div>
          )}
        </div>

        {improvements.length > 0 && (
          <div className="relative mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <FaExclamationTriangle className="mt-1 text-xs text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Before applying</p>
                <div className="mt-2 grid gap-1">
                  {improvements.slice(0, 3).map((tip) => (
                    <p key={tip} className="text-xs leading-5 text-amber-800">
                      {tip}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
  const questions = (item.questions || []).filter((question) => question.trim());

  const [message, setMessage] = useState(
    `Hi, I'm interested in the ${item.title} opportunity. I believe my skills fit this role.`
  );

  const [answers, setAnswers] = useState(
    questions.reduce((acc, question) => {
      acc[question] = "";
      return acc;
    }, {})
  );

  const [attachCv, setAttachCv] = useState(Boolean(profile.cv));

  const answeredAllQuestions = questions.every(
    (question) => answers[question]?.trim().length >= 2
  );

  const canSend =
    message.trim().length >= 20 &&
    (questions.length === 0 || answeredAllQuestions);

  const updateAnswer = (question, value) => {
    setAnswers((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--forsa-primary)]/30 px-4 pb-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-0">
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

          <button
            onClick={onClose}
            className="shrink-0 rounded-full bg-[var(--forsa-bg)] p-2 text-sm"
          >
            <FaTimes />
          </button>
        </div>

        <ProfileStrengthCard strength={profileStrength} />

        <div className="mt-5 rounded-2xl bg-[var(--forsa-bg)] p-4">
          <p className="text-sm font-medium">Application profile</p>

          <p className="mt-2 break-all text-sm leading-6 text-neutral-600">
            {account.name} · {account.city} · {account.email}
          </p>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Skills: {profile.skills?.length ? profile.skills.join(", ") : "No skills added"}
          </p>
        </div>

        {questions.length > 0 && (
          <div className="mt-5 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4">
            <p className="text-sm font-medium">Questions from the company</p>

            <p className="mt-1 text-sm text-neutral-500">
              Answer these before sending your application.
            </p>

            <div className="mt-4 grid gap-4">
              {questions.map((question, index) => (
                <div key={question}>
                  <label className="text-sm font-medium">
                    {index + 1}. {question}
                  </label>

                  <textarea
                    value={answers[question] || ""}
                    onChange={(e) => updateAnswer(question, e.target.value)}
                    placeholder="Write your answer..."
                    className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--forsa-primary)]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <label className="text-sm font-medium">Message</label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forsa-primary)]"
          />

          <p className="mt-2 text-xs text-neutral-500">
            Keep it short, clear, and human. Minimum 20 characters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => profile.cv && setAttachCv(!attachCv)}
          className={`mt-5 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
            attachCv ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white" : "border-[var(--forsa-border)] bg-white"
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
          onClick={() => onSubmit({ item, message, attachCv, answers })}
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium ${
            canSend ? "bg-[var(--forsa-primary)] text-white" : "cursor-not-allowed bg-neutral-200 text-neutral-400"
          }`}
        >
          <FaPaperPlane className="text-xs" />
          Send application
        </button>

        {!answeredAllQuestions && questions.length > 0 && (
          <p className="mt-2 text-center text-xs text-neutral-500">
            Answer all company questions to continue.
          </p>
        )}
      </div>
    </div>
  );
}

function ProfileStrengthCard({ strength }) {
  const score = strength?.score || 0;
  const missing = strength?.missing || [];

  return (
    <div className="mt-5 rounded-2xl border border-[var(--forsa-border)] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Profile strength</p>
          <p className="mt-1 text-xs text-neutral-500">
            Strong profiles usually get better replies.
          </p>
        </div>

        <span className="rounded-full bg-[var(--forsa-primary)] px-3 py-1 text-xs font-medium text-white">
          {score}%
        </span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-[var(--forsa-bg)]">
        <div className="h-2 rounded-full bg-[var(--forsa-primary)] transition-all" style={{ width: `${score}%` }} />
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--forsa-primary)]/30 px-4 pb-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-0">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-xl sm:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-primary)] text-white">
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
            <button onClick={onCreateAccount} className="rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-medium text-white">
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
