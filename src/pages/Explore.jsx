import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  FaSlidersH,
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

export default function Explore() {
  const navigate = useNavigate();

  const account = safeJson("forsaAccount", null);
  const savedProfile = safeJson("forsaProfile", {
    skills: [],
    lookingFor: [],
    cv: null,
  });

  const isLoggedIn = Boolean(account);
  const isHiring = account?.accountType === "hiring";
  const canInteract = isLoggedIn && !isHiring;

  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applyOpportunity, setApplyOpportunity] = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [sortBy, setSortBy] = useState("Best match");
  const [savedJobs, setSavedJobs] = useState(safeJson("forsaSavedJobs", []));

  const types = ["All", "Internship", "Freelance", "Part-time", "Project", "Remote"];
  const sortOptions = ["Best match", "Newest", "Urgent"];

  const allOpportunities = useMemo(() => {
    const userPosts = safeJson("forsaPosts", []).filter(
      (post) => post.status !== "closed"
    );

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
      source: "user",
    }));

    const normalizedSeed = opportunities.map((item) => ({
      ...item,
      tags: item.tags || [],
      ownerEmail: item.ownerEmail || null,
      createdAt: item.createdAt || item.id || 0,
      source: "seed",
    }));

    return [...normalizedPosts, ...normalizedSeed];
  }, []);

  const rankedOpportunities = useMemo(() => {
    const result = allOpportunities
      .filter((item) => {
        const searchText = `${item.title} ${item.company} ${item.location} ${(item.tags || []).join(" ")}`.toLowerCase();
        const matchesSearch = searchText.includes(search.trim().toLowerCase());
        const matchesType = activeType === "All" || item.type === activeType;

        return matchesSearch && matchesType;
      })
      .map((item) => {
        const matchingSkills = (item.tags || []).filter((tag) =>
          savedProfile.skills.includes(tag)
        );
        const matchingType = savedProfile.lookingFor.includes(item.type);

        const score =
          matchingSkills.length * 2 +
          (matchingType ? 2 : 0) +
          (item.featured ? 1 : 0) +
          (item.urgent ? 1 : 0);

        return { ...item, score, matchingSkills, matchingType };
      });

    if (sortBy === "Newest") {
      return result.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    }

    if (sortBy === "Urgent") {
      return result.sort((a, b) => Number(Boolean(b.urgent)) - Number(Boolean(a.urgent)) || b.score - a.score);
    }

    return result.sort((a, b) => b.score - a.score);
  }, [
    allOpportunities,
    search,
    activeType,
    sortBy,
    savedProfile.skills,
    savedProfile.lookingFor,
  ]);

  const isSaved = (id) => savedJobs.some((job) => job.id === id);

  const hasApplied = (id) => {
    const messages = safeJson("forsaMessages", []);
    return messages.some(
      (thread) => thread.opportunityId === id && thread.seeker?.email === account?.email
    );
  };

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

  const toggleSave = (item) => {
    if (!requireSeekerAccount("save")) return;

    const updated = isSaved(item.id)
      ? savedJobs.filter((job) => job.id !== item.id)
      : [{ ...item, icon: undefined }, ...savedJobs];

    setSavedJobs(updated);
    localStorage.setItem("forsaSavedJobs", JSON.stringify(updated));
  };

  const openApply = (item) => {
    if (!requireSeekerAccount("contact")) return;

    const hasProfile =
      savedProfile.skills.length > 0 && savedProfile.lookingFor.length > 0;

    if (!hasProfile) {
      navigate("/onboarding");
      return;
    }

    setApplyOpportunity(item);
  };

  const submitApplication = ({ item, message, attachCv }) => {
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
      seeker: {
        name: account.name,
        email: account.email,
        city: account.city,
        skills: savedProfile.skills,
        lookingFor: savedProfile.lookingFor,
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
        },
      ],
    };

    const updatedMessages = existing
      ? messages.map((thread) => (thread.id === existing.id ? threadPayload : thread))
      : [threadPayload, ...messages];

    localStorage.setItem("forsaMessages", JSON.stringify(updatedMessages));

    const notifications = safeJson("forsaNotifications", []);

    localStorage.setItem(
      "forsaNotifications",
      JSON.stringify([
        {
          id: Date.now() + 1,
          type: "new_application",
          title: "New application received",
          text: `${account.name} applied to ${item.title}`,
          targetEmail: item.ownerEmail || item.contact || null,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...notifications,
      ])
    );

    setApplyOpportunity(null);
    navigate("/messages");
  };

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-6 flex flex-col gap-4 sm:mt-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Explore</p>

            <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
              Discover local opportunities.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
              Search jobs, gigs, internships, and projects around Lebanon.
            </p>
          </div>

          <Link
            to={isHiring ? "/post" : isLoggedIn ? "/profile" : "/auth"}
            className="inline-flex w-full justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white sm:w-fit"
          >
            {isHiring ? "Post opportunity" : isLoggedIn ? "Improve profile" : "Create profile"}
          </Link>
        </div>

        <StatusCard
          isLoggedIn={isLoggedIn}
          isHiring={isHiring}
          savedProfile={savedProfile}
          navigate={navigate}
        />

        <div className="sticky top-[73px] z-30 -mx-5 mt-6 border-y border-neutral-200/80 bg-[#f7f7f5]/95 px-5 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-[28px] sm:border sm:bg-white sm:p-3 sm:shadow-sm lg:top-[77px]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 ring-1 ring-neutral-200 sm:bg-[#f7f7f5] sm:ring-0 lg:min-w-[340px]">
              <FaSearch className="text-sm text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search role, skill, city..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                    activeType === type
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {sortOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                    sortBy === option
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {option === "Best match" && <FaSlidersH className="text-xs" />}
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">
            Showing {rankedOpportunities.length} opportunit{rankedOpportunities.length === 1 ? "y" : "ies"}
          </p>

          {canInteract && (
            <Link to="/profile" className="text-sm font-medium text-neutral-600 hover:text-black">
              Improve profile
            </Link>
          )}
        </div>

        {rankedOpportunities.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rankedOpportunities.map((item) => (
              <OpportunityCard
                key={item.id}
                item={item}
                saved={isSaved(item.id)}
                applied={isLoggedIn && hasApplied(item.id)}
                canInteract={canInteract}
                onSave={() => toggleSave(item)}
                onDetails={() => setSelectedOpportunity(item)}
                onApply={() => (isLoggedIn && hasApplied(item.id) ? navigate("/messages") : openApply(item))}
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
          onSave={() => toggleSave(selectedOpportunity)}
          onApply={() => openApply(selectedOpportunity)}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}

      {applyOpportunity && (
        <ApplyModal
          item={applyOpportunity}
          account={account}
          profile={savedProfile}
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

function OpportunityCard({ item, saved, applied, canInteract, onSave, onDetails, onApply }) {
  const Icon = item.icon || FaBriefcase;

  return (
    <article className="flex h-full min-h-[520px] flex-col rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:rounded-[28px] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white sm:h-11 sm:w-11">
            <Icon />
          </div>

          <div className="min-w-0">
            <h3 className="line-clamp-2 font-semibold leading-snug">
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
          aria-label="Save job"
        >
          {saved ? <FaBookmark /> : <FaRegBookmark />}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Pill>{item.type}</Pill>
        <Pill>{item.pay}</Pill>
        {item.urgent && <Pill>Urgent</Pill>}
        {item.featured && <Pill>Featured</Pill>}
        {applied && <Pill>Applied</Pill>}
      </div>

      <p className="mt-4 min-h-[72px] line-clamp-3 text-sm leading-6 text-neutral-600">
        {item.description}
      </p>

      <div className="mt-4 min-h-[92px]">
        <FitBadge
          score={item.score}
          matchingSkills={item.matchingSkills}
          matchingType={item.matchingType ? item.type : null}
        />
      </div>

      <div className="mt-4">
        <p className="text-xs text-neutral-400">Tags</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(item.tags || []).slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs">
              {tag}
            </span>
          ))}
          {(item.tags || []).length > 5 && (
            <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs text-neutral-500">
              +{item.tags.length - 5}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
        <button onClick={onDetails} className="rounded-full border border-neutral-300 bg-white px-4 py-3 text-sm font-medium transition hover:border-neutral-500">
          Details
        </button>

        <button
          onClick={onApply}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition ${
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
      <div className="mt-6 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm sm:mt-8 sm:rounded-[28px] sm:p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="font-medium">Browsing as guest</p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Explore freely. Create a profile to save jobs, apply, and send messages.
            </p>
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
      <div className="mt-6 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm sm:mt-8 sm:rounded-[28px] sm:p-5">
        <p className="font-medium">Hiring mode</p>
        <p className="mt-1 text-sm leading-6 text-neutral-600">
          Browse the market and manage applicants from your profile dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-3 rounded-[24px] border border-neutral-200 bg-white p-4 sm:mt-8 sm:rounded-[28px] sm:p-5 md:grid-cols-2">
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
          skills.map((skill) => (
            <span key={skill} className="rounded-full bg-white px-3 py-1.5 text-sm">
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
    <div className="mt-6 rounded-[24px] border border-neutral-200 bg-white p-8 text-center sm:rounded-[28px] sm:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f7f5]">
        <FaSearch className="text-neutral-500" />
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">No opportunities found.</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
        {search ? "Try another keyword, skill, city, or opportunity type." : "New opportunities will appear here when people start posting."}
      </p>
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="rounded-full bg-[#f7f7f5] px-3 py-1.5 text-xs text-neutral-600">
      {children}
    </span>
  );
}

function OpportunityModal({ item, saved, canInteract, onSave, onApply, onClose }) {
  const Icon = item.icon || FaBriefcase;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-0">
      <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-[28px] bg-white p-5 shadow-xl sm:rounded-[32px] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
              <Icon />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-neutral-500">{item.type}</p>
              <h2 className="mt-1 line-clamp-2 text-2xl font-semibold tracking-[-0.03em]">{item.title}</h2>
            </div>
          </div>

          <button onClick={onClose} className="shrink-0 rounded-full bg-[#f7f7f5] p-2 text-sm">
            <FaTimes />
          </button>
        </div>

        <p className="mt-5 text-sm leading-7 text-neutral-600 sm:text-base">{item.description}</p>

        <div className="mt-5 rounded-2xl bg-[#f7f7f5] p-4 text-sm">
          <p><span className="text-neutral-500">Company:</span> {item.company}</p>
          <p className="mt-2"><span className="text-neutral-500">Location:</span> {item.location}</p>
          <p className="mt-2"><span className="text-neutral-500">Pay:</span> {item.pay}</p>
          <p className="mt-2 break-all"><span className="text-neutral-500">Contact:</span> {canInteract ? item.contact : "Create a seeker account to view"}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={onSave}
            className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition ${saved ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-black hover:border-neutral-500"} ${!canInteract ? "opacity-70" : ""}`}
          >
            {saved ? <FaBookmark /> : <FaRegBookmark />}
            {saved ? "Saved" : "Save"}
          </button>

          <button onClick={onApply} className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium ${canInteract ? "bg-black text-white" : "bg-neutral-200 text-neutral-500"}`}>
            {!canInteract ? <FaLock className="text-xs" /> : <FaPaperPlane className="text-xs" />}
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplyModal({ item, account, profile, onClose, onSubmit }) {
  const [message, setMessage] = useState(`Hi, I'm interested in the ${item.title} opportunity. I believe my skills fit this role.`);
  const [attachCv, setAttachCv] = useState(Boolean(profile.cv));

  const canSend = message.trim().length >= 20;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-0">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-[28px] bg-white p-5 shadow-xl sm:rounded-[32px] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-neutral-500">Apply to</p>
            <h2 className="mt-1 line-clamp-2 text-2xl font-semibold tracking-[-0.03em]">{item.title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{item.company} · {item.location}</p>
          </div>

          <button onClick={onClose} className="shrink-0 rounded-full bg-[#f7f7f5] p-2 text-sm">
            <FaTimes />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-[#f7f7f5] p-4">
          <p className="text-sm font-medium">Your application profile</p>
          <p className="mt-2 break-all text-sm leading-6 text-neutral-600">{account.name} · {account.city} · {account.email}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">Skills: {profile.skills?.length ? profile.skills.join(", ") : "No skills added"}</p>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
          />
          <p className="mt-2 text-xs text-neutral-500">Keep it short, clear, and human. Minimum 20 characters.</p>
        </div>

        <button
          type="button"
          onClick={() => profile.cv && setAttachCv(!attachCv)}
          className={`mt-5 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${attachCv ? "border-black bg-black text-white" : "border-neutral-200 bg-white"} ${!profile.cv ? "cursor-not-allowed opacity-70" : ""}`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <FaFileAlt className="shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{profile.cv ? "Attach CV metadata" : "No CV uploaded"}</span>
              <span className={`block truncate text-xs ${attachCv ? "text-neutral-300" : "text-neutral-500"}`}>{profile.cv ? profile.cv.name : "Upload a PDF CV from your profile"}</span>
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
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium ${canSend ? "bg-black text-white" : "cursor-not-allowed bg-neutral-200 text-neutral-400"}`}
        >
          <FaPaperPlane className="text-xs" />
          Send application
        </button>
      </div>
    </div>
  );
}

function AuthRequiredModal({ type, onClose, onCreateAccount }) {
  const seekerOnly = type === "seeker-only";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-0">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-xl sm:rounded-[32px] sm:p-6">
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
