import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import AppHeader from "../components/AppHeader";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import Modal from "../components/ui/Modal";
import { deleteCurrentAccount } from "../lib/accountDeletionService";
import { showToast } from "../lib/Toast";
import {
  deletePost as deletePostFromFirestore,
  getPostsByOwner,
  updatePost,
} from "../lib/postService.js";
import { loadDemoActivity, clearDemoActivity } from "../lib/demoData";

import { createVerificationRequest } from "../lib/verificationService";
import { calculateApplicantScore } from "../lib/applicantScore";
import {
  FaBriefcase,
  FaBookmark,
  FaCog,
  FaEdit,
  FaFileAlt,
  FaMapMarkerAlt,
  FaPlus,
  FaTrash,
  FaUser,
  FaUsers,
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaPaperPlane,
  FaClock,
  FaEye,
  FaArrowRight,
  FaExternalLinkAlt,
  FaLink,
  FaShieldAlt,
  FaGlobe,
  FaInstagram,
  FaPhone,
  FaChartLine,
  FaShareAlt,
  FaPercent,
  FaFlag,
  FaBullseye,
} from "react-icons/fa";

const skillOptions = [
  "React",
  "JavaScript",
  "Frontend",
  "Backend",
  "WordPress",
  "Shopify",
  "Design",
  "UI/UX",
  "Marketing",
  "Video editing",
  "Photography",
  "Writing",
  "Sales",
  "Customer service",
  "Barista",
  "Waiter",
  "Cashier",
  "Delivery",
  "Data entry",
];

const lookingOptions = [
  "Internship",
  "Freelance",
  "Freelance work",
  "Part-time",
  "Part-time job",
  "Full-time",
  "Remote",
  "Remote work",
  "Project",
  "Startup project",
  "Collaboration",
];

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

const formatDate = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const applicationSteps = ["pending", "shortlisted", "interview", "accepted"];

const getApplicationStepIndex = (status) => {
  if (status === "rejected") return 0;
  return Math.max(0, applicationSteps.indexOf(status || "pending"));
};

const getPostAnalytics = () => safeJson("forsaPostAnalytics", {});

const getAnalyticsForPost = (postId) => {
  const analytics = getPostAnalytics();
  return analytics[postId] || {
    views: 0,
    saves: 0,
    applications: 0,
    shares: 0,
    reports: 0,
  };
};

const percent = (part, total) => {
  if (!total) return 0;
  return Math.round((Number(part || 0) / Number(total || 0)) * 100);
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

const buildPostAnalytics = (posts, messages) => {
  const rows = posts.map((post) => {
    const analytics = getAnalyticsForPost(post.id);
    const applicants = messages.filter(
      (thread) => thread.opportunityId === post.id || thread.postId === post.id
    );

    const applications = Math.max(Number(analytics.applications || 0), applicants.length);
    const views = Number(analytics.views || post.views || 0);
    const saves = Number(analytics.saves || post.saves || 0);
    const shares = Number(analytics.shares || post.shares || 0);
    const reports = Number(analytics.reports || post.reports || 0);

    const avgFit = applicants.length
      ? Math.round(applicants.reduce((total, thread) => total + calculateApplicantScore(thread).score, 0) / applicants.length)
      : 0;

    return {
      post,
      views,
      saves,
      applications,
      shares,
      reports,
      avgFit,
      conversionRate: percent(applications, views),
      saveRate: percent(saves, views),
    };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      views: acc.views + row.views,
      saves: acc.saves + row.saves,
      applications: acc.applications + row.applications,
      shares: acc.shares + row.shares,
      reports: acc.reports + row.reports,
      fitTotal: acc.fitTotal + (row.avgFit ? row.avgFit : 0),
      fitCount: acc.fitCount + (row.avgFit ? 1 : 0),
    }),
    { views: 0, saves: 0, applications: 0, shares: 0, reports: 0, fitTotal: 0, fitCount: 0 }
  );

  const bestPost = rows.length
    ? [...rows].sort((a, b) => b.applications - a.applications || b.views - a.views || b.conversionRate - a.conversionRate)[0]
    : null;

  return {
    rows: rows.sort((a, b) => b.applications - a.applications || b.views - a.views || b.conversionRate - a.conversionRate),
    totals: {
      ...totals,
      conversionRate: percent(totals.applications, totals.views),
      saveRate: percent(totals.saves, totals.views),
      avgFit: totals.fitCount ? Math.round(totals.fitTotal / totals.fitCount) : 0,
    },
    bestPost,
  };
};

function FollowedCompaniesTab({ companies, onUnfollow }) {
  return (
    <div className="mt-6 sm:mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Followed companies</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
            Companies you follow
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
            Keep track of companies you’re interested in and quickly open their profiles.
          </p>
        </div>

        {companies.length > 0 && (
          <span className="w-fit rounded-full bg-[var(--forsa-bg)] px-4 py-2 text-sm text-neutral-600">
            {companies.length} followed
          </span>
        )}
      </div>

      {companies.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-6 text-center sm:rounded-[26px] sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--forsa-primary)]">
            <FaUsers />
          </div>

          <p className="mt-4 text-xl font-semibold">No followed companies yet.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
            Open a company profile and follow it to save it here.
          </p>

          <Link
            to="/explore"
            className="mt-6 inline-flex rounded-full forsa-button px-5 py-3 text-sm font-medium text-white"
          >
            Explore opportunities
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {companies.map((company) => (
            <div
              key={company.email || company.name}
              className="rounded-[24px] border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl forsa-button font-semibold text-white">
                  {(company.name || "C").charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold tracking-[-0.03em]">
                      {company.name || "Company"}
                    </h3>

                    {company.verified && (
                      <span className="rounded-full bg-[var(--forsa-bg-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--forsa-primary)]">
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-neutral-500">
                    {company.city || "Lebanon"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link
                  to={`/company/${encodeURIComponent(company.email || company.name)}`}
                  className="forsa-click inline-flex items-center justify-center rounded-full forsa-button px-4 py-2.5 text-sm font-medium text-white"
                >
                  View profile
                </Link>

                <button
                  onClick={() => onUnfollow(company.email)}
                  className="forsa-click rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600"
                >
                  Unfollow
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const savedAccount = safeJson("forsaAccount", null);
  const savedProfile = safeJson("forsaProfile", {
    skills: [],
    lookingFor: [],
    cv: null,
  });

  const [account, setAccount] = useState(savedAccount);
  const [profile, setProfile] = useState(savedProfile);
  const [posts, setPosts] = useState(() => {
    const allPosts = safeJson("forsaPosts", []);
    if (!savedAccount || savedAccount.accountType !== "hiring") return allPosts;

    return allPosts.filter(
      (post) =>
        post.ownerEmail === savedAccount.email ||
        (!post.ownerEmail && post.ownerName === savedAccount.name) ||
        (!post.ownerEmail && !post.ownerName)
    );
  });
  const [savedJobs, setSavedJobs] = useState(safeJson("forsaSavedJobs", []));
  const [messages, setMessages] = useState(() => {
    const localMessages = safeJson("forsaMessages", []);
    const cachedMessages = safeJson("forsaMessagesCache", []);
    return localMessages.length ? localMessages : cachedMessages;
  });
  const [recentlyViewed, setRecentlyViewed] = useState(safeJson("forsaRecentlyViewed", []));
  const [followedCompanies, setFollowedCompanies] = useState(
  safeJson("forsaFollowedCompanies", [])
);
  const [selectedApplicantsPost, setSelectedApplicantsPost] = useState(null);
  const [tab, setTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    phone: account?.phone || "",
    website: account?.website || "",
    instagram: account?.instagram || "",
    proof: "",
  });
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (!savedAccount || savedAccount.accountType !== "hiring") return;

    let active = true;

    const loadPosts = async () => {
      setPostsLoading(true);

      try {
        const remotePosts = await getPostsByOwner({
          uid: savedAccount.uid,
          email: savedAccount.email,
          name: savedAccount.name,
        });

        if (!active) return;

        setPosts(remotePosts);
      } catch (error) {
        console.error("Profile posts load error:", error);
        showToast("Could not refresh your posts. Showing saved data.", "info");
      } finally {
        if (active) setPostsLoading(false);
      }
    };

    loadPosts();

    return () => {
      active = false;
    };
  }, [savedAccount?.uid, savedAccount?.email, savedAccount?.name]);

  if (!account) {
    return (
      <section>
        <SEO title="Profile" />
        <AppHeader />
          
        <div className="mx-auto max-w-3xl px-5 py-14 pb-28 sm:px-6 sm:py-20">
          <div className="rounded-[26px] border border-[var(--forsa-border)] bg-white p-6 text-center shadow-sm sm:rounded-[32px] sm:p-8">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
              Create your Forsa profile first.
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
              Your profile will show your city, skills, CV, saved jobs, posts,
              and messages.
            </p>

            <Link
              to="/auth"
              className="forsa-click mt-7 inline-flex rounded-full forsa-button px-6 py-3 text-sm font-medium text-white"
            >
              Create account
            </Link>
          </div>
        </div>
        <Modal
  open={deleteModalOpen}
  title="Delete account"
  onClose={() => {
    if (!deletingAccount) {
      setDeleteModalOpen(false);
      setDeleteConfirmText("");
    }
  }}
>
  <div>
    <p className="text-sm leading-7 text-neutral-600">
      This will permanently delete your Forsa account, profile, posts,
      applications, saved jobs, connections, notifications, and login account.
      This action cannot be undone.
    </p>

    <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-700">
        Type DELETE to confirm.
      </p>

      <input
        value={deleteConfirmText}
        onChange={(e) => setDeleteConfirmText(e.target.value)}
        placeholder="DELETE"
        className="mt-3 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-red-500"
      />
    </div>

    <div className="mt-6 grid grid-cols-2 gap-2">
      <button
        disabled={deletingAccount}
        onClick={() => {
          setDeleteModalOpen(false);
          setDeleteConfirmText("");
        }}
        className="rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-700 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        disabled={deletingAccount || deleteConfirmText !== "DELETE"}
        onClick={handleDeleteAccount}
        className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deletingAccount ? "Deleting..." : "Delete forever"}
      </button>
    </div>
  </div>
</Modal>
      </section>
    );
  }

  const isHiring = account.accountType === "hiring";
  const displayName =
  isHiring
    ? account.companyName || account.name
    : account.name;

const displayEmail =
  isHiring
    ? account.companyEmail || account.email
    : account.email;
  const initial = account.name?.charAt(0)?.toUpperCase() || "F";

  const getApplicantsForPost = (postId) => {
    return messages.filter((thread) => thread.opportunityId === postId);
  };

  const getApplicantsCount = (postId) => {
    return getApplicantsForPost(postId).length;
  };

  const getProfileCompletion = () => {
    const checks = isHiring
      ? [Boolean(account.name), Boolean(account.email), Boolean(account.city), posts.length > 0]
      : [
          Boolean(account.name),
          Boolean(account.email),
          Boolean(account.city),
          profile.skills.length > 0,
          profile.lookingFor.length > 0,
          Boolean(profile.cv?.url || profile.cv?.name),
        ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  };

  const completionScore = getProfileCompletion();

  const profileLevel =
    completionScore >= 90
      ? "Pro"
      : completionScore >= 70
      ? "Advanced"
      : completionScore >= 45
      ? "Active"
      : "Starter";

  const profileSignals = isHiring
    ? [
        { label: "Company name", done: Boolean(account.companyName || account.name) },
        { label: "Contact email", done: Boolean(account.companyEmail || account.email) },
        { label: "Location", done: Boolean(account.city) },
        { label: "Public profile", done: Boolean(account.companyBio || account.website || account.instagram) },
        { label: "First post", done: posts.length > 0 },
      ]
    : [
        { label: "Full name", done: Boolean(account.name) },
        { label: "Location", done: Boolean(account.city || profile.cityPreference) },
        { label: "Skills", done: profile.skills.length > 0 },
        { label: "Goals", done: profile.lookingFor.length > 0 },
        { label: "CV", done: Boolean(profile.cv?.url || profile.cv?.name) },
      ];

  const seekerApplications = messages.filter(
    (thread) => thread.seeker?.email === account.email
  );

  const hiringAnalytics = isHiring
    ? buildPostAnalytics(posts, messages)
    : { rows: [], totals: {}, bestPost: null };

  const persistOwnPosts = (updatedOwnPosts) => {
    const allPosts = safeJson("forsaPosts", []);
    const otherPosts = allPosts.filter(
      (post) =>
        !(
          post.ownerEmail === account.email ||
          post.ownerUid === account.uid ||
          (!post.ownerEmail && post.ownerName === account.name) ||
          (!post.ownerEmail && !post.ownerName)
        )
    );

    const nextPosts = [...updatedOwnPosts, ...otherPosts];

    setPosts(updatedOwnPosts);
    localStorage.setItem("forsaPosts", JSON.stringify(nextPosts));
    localStorage.setItem("forsaPostsCache", JSON.stringify(nextPosts));
  };

  const syncUserRecord = (nextAccount) => {
    const users = safeJson("forsaUsers", []);
    if (!nextAccount?.email || users.length === 0) return;

    const updatedUsers = users.map((user) =>
      user.email === savedAccount.email || user.email === nextAccount.email
        ? { ...user, ...nextAccount }
        : user
    );

    localStorage.setItem("forsaUsers", JSON.stringify(updatedUsers));
  };

  const updateApplicantStatus = (threadId, status) => {
    const updatedMessages = messages.map((thread) =>
      thread.id === threadId ? { ...thread, status } : thread
    );

    setMessages(updatedMessages);
    localStorage.setItem("forsaMessages", JSON.stringify(updatedMessages));

    const thread = messages.find((item) => item.id === threadId);
    const notifications = safeJson("forsaNotifications", []);

    showToast(`Application marked as ${status}`);

    if (thread?.seeker?.email) {
      localStorage.setItem(
        "forsaNotifications",
        JSON.stringify([
          {
            id: Date.now(),
            type: "application_status",
            title: "Application updated",
            text: `Your application for ${thread.title} was marked as ${status}.`,
            targetEmail: thread.seeker.email,
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...notifications,
        ])
      );
    }
  };

  const updateAccount = (field, value) => {
    setAccount((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProfileItem = (key, item) => {
    setProfile((prev) => {
      const current = prev[key] || [];

      return {
        ...prev,
        [key]: current.includes(item)
          ? current.filter((value) => value !== item)
          : [...current, item],
      };
    });
  };

const handleDeleteAccount = async () => {
  if (deleteConfirmText !== "DELETE") {
    showToast("Type DELETE to confirm.", "error");
    return;
  }

  setDeletingAccount(true);

  try {
    await deleteCurrentAccount(account);
    showToast("Account deleted");
    window.location.href = "/";
  } catch (error) {
    console.error("Delete account error:", error);

    if (error.code === "auth/requires-recent-login") {
      showToast("Please logout, login again, then delete your account.", "error");
    } else {
      showToast(error.message || "Could not delete account.", "error");
    }
  } finally {
    setDeletingAccount(false);
  }
};

  const handleCvLinkSave = (url) => {
    const cleanUrl = String(url || "").trim();

    if (!cleanUrl) {
      showToast("Paste your CV link first.");
      return;
    }

    try {
      const parsed = new URL(cleanUrl);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        showToast("Please use a valid CV link.");
        return;
      }
    } catch {
      showToast("Please use a valid CV link.");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      cv: {
        name: "CV / Resume link",
        url: cleanUrl,
        type: "link",
        uploadedAt: new Date().toISOString(),
      },
    }));

    showToast("CV link added to profile");
  };

  const removeCv = () => {
    setProfile((prev) => ({ ...prev, cv: null }));
    showToast("CV removed");
  };

const saveChanges = async () => {
  const nextAccount = {
    ...account,
    bio: account.bio || "",
    experience: account.experience || "",
    education: account.education || "",
    portfolioLinks: account.portfolioLinks || "",
  };

  const publicProfileData = {
    ...nextAccount,
    skills: profile.skills || [],
    lookingFor: profile.lookingFor || [],
    cv: profile.cv || null,
    publicSkills: profile.skills || [],
    publicLookingFor: profile.lookingFor || [],
    publicCv: profile.cv || null,
  };

  try {
    if (account?.uid) {
      await setDoc(doc(db, "users", account.uid), publicProfileData, {
        merge: true,
      });
    }

    setAccount(nextAccount);
    localStorage.setItem("forsaAccount", JSON.stringify(nextAccount));
    localStorage.setItem("forsaProfile", JSON.stringify(profile));
    syncUserRecord(nextAccount);

    showToast("Profile updated");
    setIsEditing(false);
  } catch (error) {
    console.error("Profile save error:", error);
    showToast("Could not save profile.", "error");
  }
};

  const cancelEdit = () => {
    setAccount(savedAccount);
    setProfile(savedProfile);
    setIsEditing(false);
  };

  const removeSavedJob = (jobId) => {
    const updated = savedJobs.filter((job) => job.id !== jobId);
    setSavedJobs(updated);
    localStorage.setItem("forsaSavedJobs", JSON.stringify(updated));
    showToast("Saved job removed");
  };

  const deletePost = async (postId) => {
    const confirmed = window.confirm("Delete this opportunity?");
    if (!confirmed) return;

    try {
      await deletePostFromFirestore(postId);

      const updatedPosts = posts.filter((post) => post.id !== postId);
      persistOwnPosts(updatedPosts);

      showToast("Post deleted");
    } catch (error) {
      console.error("Delete post error:", error);
      showToast("Could not delete post. Try again.", "error");
    }
  };

  const togglePostStatus = async (postId) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const nextStatus = post.status === "closed" ? "active" : "closed";

    try {
      await updatePost(postId, { status: nextStatus });

      const updatedPosts = posts.map((item) =>
        item.id === postId ? { ...item, status: nextStatus } : item
      );

      persistOwnPosts(updatedPosts);
      showToast(nextStatus === "active" ? "Post reopened" : "Post closed");
    } catch (error) {
      console.error("Update post status error:", error);
      showToast("Could not update post status. Try again.", "error");
    }
  };

  const startEditPost = (post) => {
    setEditingPostId(post.id);
    setEditingPost({ ...post });
  };

  const updateEditingPost = (field, value) => {
    setEditingPost((prev) => ({ ...prev, [field]: value }));
  };

  const savePostEdit = async () => {
    if (!editingPostId || !editingPost) return;

    const updatePayload = {
      title: editingPost.title || "",
      location: editingPost.location || "",
      pay: editingPost.pay || "",
      contact: editingPost.contact || "",
      description: editingPost.description || "",
      type: editingPost.type || "Project",
      category: editingPost.category || "",
      experience: editingPost.experience || "",
      shift: editingPost.shift || "",
      gender: editingPost.gender || "",
      packageDetails: editingPost.packageDetails || "",
      requirements: editingPost.requirements || "",
      tags: editingPost.tags || [],
      questions: editingPost.questions || [],
    };

    try {
      await updatePost(editingPostId, updatePayload);

      const updatedPosts = posts.map((post) =>
        post.id === editingPostId
          ? { ...post, ...editingPost, updatedAt: new Date().toISOString() }
          : post
      );

      persistOwnPosts(updatedPosts);
      setEditingPostId(null);
      setEditingPost(null);
      showToast("Post updated");
    } catch (error) {
      console.error("Edit post error:", error);
      showToast("Could not update post. Try again.", "error");
    }
  };

  const cancelPostEdit = () => {
    setEditingPostId(null);
    setEditingPost(null);
  };

  const logout = () => {
    localStorage.removeItem("forsaAccount");
    setAccount(null);
    navigate("/auth", { replace: true });
  };

  const resetDemoAccount = () => {
    const confirmed = window.confirm(
      "This will remove your demo account, profile, saved jobs, messages, and posts."
    );

    if (!confirmed) return;

    localStorage.removeItem("forsaAccount");
    localStorage.removeItem("forsaProfile");
    localStorage.removeItem("forsaPosts");
    localStorage.removeItem("forsaSavedJobs");
    localStorage.removeItem("forsaMessages");
    localStorage.removeItem("forsaNotifications");
    localStorage.removeItem("forsaUsers");
    localStorage.removeItem("forsaRecentlyViewed");
    localStorage.removeItem("forsaSavedJobNotes");

    setAccount(null);
    navigate("/auth", { replace: true });
  };

  const loadDemo = () => {
    const result = loadDemoActivity(account, profile);
    const allPosts = safeJson("forsaPosts", []);
    const allMessages = safeJson("forsaMessages", []);

    if (isHiring) {
      setPosts(
        allPosts.filter(
          (post) =>
            post.ownerEmail === account.email ||
            (!post.ownerEmail && post.ownerName === account.name) ||
            (!post.ownerEmail && !post.ownerName)
        )
      );
    } else {
      setPosts(allPosts);
    }

    setMessages(allMessages);

    showToast(
      `Demo activity loaded: ${result.postsAdded} posts, ${result.messagesAdded} application, ${result.notificationsAdded} notifications.`
    );
  };

  const clearDemo = () => {
    const confirmed = window.confirm("Remove only the demo activity?");
    if (!confirmed) return;

    clearDemoActivity();

    const allPosts = safeJson("forsaPosts", []);
    const allMessages = safeJson("forsaMessages", []);
    showToast("Demo activity removed");

    if (isHiring) {
      setPosts(
        allPosts.filter(
          (post) =>
            post.ownerEmail === account.email ||
            (!post.ownerEmail && post.ownerName === account.name) ||
            (!post.ownerEmail && !post.ownerName)
        )
      );
    } else {
      setPosts(allPosts);
    }

    setMessages(allMessages);
  };


  const requestVerification = () => {
    if (!isHiring) return;
    setVerificationForm({
      phone: account?.phone || "",
      website: account?.website || "",
      instagram: account?.instagram || "",
      proof: "",
    });
    setVerificationOpen(true);
  };

  const submitVerificationRequest = async () => {
    if (!isHiring || verificationLoading) return;

    if (!verificationForm.phone.trim() && !verificationForm.website.trim() && !verificationForm.instagram.trim()) {
      showToast("Add at least a phone, website, or Instagram.", "error");
      return;
    }

    if (verificationForm.proof.trim().length < 15) {
      showToast("Add a short proof message before submitting.", "error");
      return;
    }

    setVerificationLoading(true);

    try {
      await createVerificationRequest({
        uid: account.uid || null,
        companyName: account.companyName || account.name,
        companyEmail: account.companyEmail || account.email,
        contactPerson: account.contactPerson || "",
        city: account.city || "",
        phone: verificationForm.phone.trim(),
        website: verificationForm.website.trim(),
        instagram: verificationForm.instagram.trim(),
        proof: verificationForm.proof.trim(),
        requestedByEmail: account.email,
      });

      const nextAccount = {
        ...account,
        phone: verificationForm.phone.trim(),
        website: verificationForm.website.trim(),
        instagram: verificationForm.instagram.trim(),
        verificationStatus: "pending",
      };

      setAccount(nextAccount);
      localStorage.setItem("forsaAccount", JSON.stringify(nextAccount));
      syncUserRecord(nextAccount);

      setVerificationOpen(false);
      showToast("Verification request sent");
    } catch (error) {
      console.error("Verification request error:", error);
      showToast("Could not send verification request.", "error");
    } finally {
      setVerificationLoading(false);
    }
  };



  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <SEO title="Profile" />
      <AppHeader />

      <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="forsa-card mt-5 rounded-[26px] border border-[var(--forsa-border)] bg-white p-4 shadow-sm sm:mt-8 sm:rounded-[32px] sm:p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full forsa-button text-lg font-semibold text-white sm:h-14 sm:w-14 sm:text-lg">
                {initial}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="max-w-full truncate text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
  {displayName}
</h1>

                  <span className="rounded-full bg-[var(--forsa-bg)] px-3 py-1 text-xs text-neutral-600">
                    {isHiring ? "Hiring account" : "Looking for work"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500 sm:text-base">
                  <FaMapMarkerAlt className="text-xs" />
                  <span>{account.city || "Lebanon"}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="break-all">{displayEmail}</span>
                </div>

                {isHiring && (
                  <Link
                    to={`/company/${encodeURIComponent(
                      account.companyEmail || account.email
                    )}`}
                    className="forsa-click mt-4 inline-flex items-center gap-2 rounded-full forsa-button px-4 py-2 text-xs font-medium text-white"
                  >
                    <FaEye className="text-[10px]" />
                    View public company profile
                  </Link>
                )}
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="forsa-click inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium transition hover:border-neutral-500 sm:w-fit"
              >
                <FaEdit className="text-xs" />
                Edit profile
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  onClick={cancelEdit}
                  className="forsa-click rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium transition hover:border-neutral-500"
                >
                  Cancel
                </button>

                <button
                  onClick={saveChanges}
                  className="forsa-click rounded-full forsa-button px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--forsa-green-light)]"
                >
                  Save changes
                </button>
              </div>
            )}
          </div>

          <div className="-mx-1 mt-7 flex gap-2 overflow-x-auto border-b border-[var(--forsa-border)] px-1 pb-4">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<FaUser />}>
              Overview
            </TabButton>

            {isHiring ? (
              <>
                <TabButton active={tab === "posts"} onClick={() => setTab("posts")} icon={<FaBriefcase />}>
                  Posts
                </TabButton>

                <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")} icon={<FaChartLine />}>
                  Analytics
                </TabButton>
              </>
            ) : (
              <>
                <TabButton active={tab === "saved"} onClick={() => setTab("saved")} icon={<FaBookmark />}>
                  Saved
                </TabButton>

                <TabButton active={tab === "applications"} onClick={() => setTab("applications")} icon={<FaPaperPlane />}>
                  Applications
                </TabButton>

                <TabButton active={tab === "viewed"} onClick={() => setTab("viewed")} icon={<FaEye />}>
                  Viewed
                </TabButton>
                <TabButton active={tab === "companies"} onClick={() => setTab("companies")} icon={<FaUsers />}>
  Companies
</TabButton>
              </>
            )}

            <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={<FaCog />}>
              Settings
            </TabButton>
          </div>

          {isEditing ? (
            <ProfileEdit
              account={account}
              profile={profile}
              isHiring={isHiring}
              updateAccount={updateAccount}
              toggleProfileItem={toggleProfileItem}
              handleCvLinkSave={handleCvLinkSave}
              removeCv={removeCv}
            />
          ) : (
            <>
              {tab === "overview" && (
                <OverviewTab
                  isHiring={isHiring}
                  profile={profile}
                  posts={posts}
                  savedJobs={savedJobs}
                  completionScore={completionScore}
                  profileLevel={profileLevel}
                  profileSignals={profileSignals}
                  seekerApplications={seekerApplications}
                  recentlyViewed={recentlyViewed}
                  account={account}
                  onRequestVerification={requestVerification}
                />
              )}

              {tab === "posts" && isHiring && (
                <PostsTab
                  posts={posts}
                  postsLoading={postsLoading}
                  deletePost={deletePost}
                  togglePostStatus={togglePostStatus}
                  startEditPost={startEditPost}
                  editingPostId={editingPostId}
                  editingPost={editingPost}
                  updateEditingPost={updateEditingPost}
                  savePostEdit={savePostEdit}
                  cancelPostEdit={cancelPostEdit}
                  getApplicantsCount={getApplicantsCount}
                  openApplicants={setSelectedApplicantsPost}
                />
              )}

              {tab === "analytics" && isHiring && (
                <AnalyticsTab analytics={hiringAnalytics} />
              )}

              {tab === "saved" && !isHiring && (
                <SavedJobsTab jobs={savedJobs} removeSavedJob={removeSavedJob} />
              )}

              {tab === "applications" && !isHiring && (
                <ApplicationsTab applications={seekerApplications} />
              )}

              {tab === "viewed" && !isHiring && (
                <RecentlyViewedTab
                  jobs={recentlyViewed}
                  onClear={() => {
                    writeJson("forsaRecentlyViewed", []);
                    setRecentlyViewed([]);
                    showToast("Recently viewed cleared");
                  }}
                />
              )}
              {tab === "companies" && !isHiring && (
  <FollowedCompaniesTab
    companies={followedCompanies}
    onUnfollow={(email) => {
      const next = followedCompanies.filter((item) => item.email !== email);
      setFollowedCompanies(next);
      writeJson("forsaFollowedCompanies", next);
      showToast("Company unfollowed");
    }}
  />
)}

              {tab === "settings" && (
                <SettingsTab
  logout={logout}
  resetDemoAccount={resetDemoAccount}
  loadDemo={loadDemo}
  clearDemo={clearDemo}
  isHiring={isHiring}
  account={account}
  onRequestVerification={requestVerification}
  onDeleteAccount={() => setDeleteModalOpen(true)}
/>
              )}
            </>
          )}
        </div>
      </div>

      <VerificationRequestModal
        open={verificationOpen}
        form={verificationForm}
        loading={verificationLoading}
        onChange={(field, value) =>
          setVerificationForm((prev) => ({ ...prev, [field]: value }))
        }
        onClose={() => setVerificationOpen(false)}
        onSubmit={submitVerificationRequest}
      />
<Modal
  open={deleteModalOpen}
  title="Delete account"
  onClose={() => {
    if (!deletingAccount) {
      setDeleteModalOpen(false);
      setDeleteConfirmText("");
    }
  }}
>
  <div>
    <p className="text-sm leading-7 text-neutral-600">
      This will permanently delete your Forsa account, profile, posts,
      applications, saved jobs, connections, notifications, and login account.
      This action cannot be undone.
    </p>

    <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-700">
        Type DELETE to confirm.
      </p>

      <input
        value={deleteConfirmText}
        onChange={(e) => setDeleteConfirmText(e.target.value)}
        placeholder="DELETE"
        className="mt-3 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-red-500"
      />
    </div>

    <div className="mt-6 grid grid-cols-2 gap-2">
      <button
        disabled={deletingAccount}
        onClick={() => {
          setDeleteModalOpen(false);
          setDeleteConfirmText("");
        }}
        className="rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-700 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        disabled={deletingAccount || deleteConfirmText !== "DELETE"}
        onClick={handleDeleteAccount}
        className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deletingAccount ? "Deleting..." : "Delete forever"}
      </button>
    </div>
  </div>
</Modal>
      <Footer />

      {selectedApplicantsPost && (
        <ApplicantsModal
          post={selectedApplicantsPost}
          applicants={getApplicantsForPost(selectedApplicantsPost.id)}
          onClose={() => setSelectedApplicantsPost(null)}
          onStatusChange={updateApplicantStatus}
          onOpenMessage={() => navigate("/messages")}
        />
      )}
    </section>
  );
}

function OverviewTab({
  isHiring,
  profile,
  posts,
  savedJobs,
  completionScore,
  profileLevel,
  profileSignals = [],
  seekerApplications = [],
  recentlyViewed = [],
  account,
  onRequestVerification,
}) {
  return (
    <div className="mt-6 sm:mt-8">
      <CompletionCard completionScore={completionScore} isHiring={isHiring} />

      <ProfileLevelCard
        level={profileLevel}
        completionScore={completionScore}
        signals={profileSignals}
        isHiring={isHiring}
      />

      <CompletionTips isHiring={isHiring} profile={profile} posts={posts} />

      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <StatCard
          label={isHiring ? "Active posts" : "Saved jobs"}
          value={isHiring ? posts.filter((post) => post.status !== "closed").length : savedJobs.length}
        />
        <StatCard
          label={isHiring ? "Closed posts" : "Applications"}
          value={
            isHiring
              ? posts.filter((post) => post.status === "closed").length
              : seekerApplications.length
          }
        />
        <StatCard
          label={isHiring ? "Total posts" : "Skills"}
          value={isHiring ? posts.length : profile.skills.length}
        />
      </div>

      <div className="mt-5 rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:mt-6 sm:rounded-[26px] sm:p-5">
        <p className="text-sm font-medium">About</p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
          {isHiring
            ? "This account is used to post opportunities, manage listings, and connect with local talent in Lebanon."
            : "This profile helps opportunity posters understand your skills, city, CV, and what kind of work you are looking for."}
        </p>
      </div>

      {!isHiring && (
        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
          <InfoBox title="Skills" items={profile.skills} empty="No skills added yet." />
          <InfoBox title="Looking for" items={profile.lookingFor} empty="No opportunity type selected yet." />
          <CvBox cv={profile.cv} />
          <ApplicationsSentBox applications={seekerApplications} />
        </div>
      )}

      {!isHiring && recentlyViewed.length > 0 && (
        <RecentlyViewedPreview jobs={recentlyViewed} />
      )}

      {isHiring && (
        <VerificationCard
          account={account}
          onRequestVerification={onRequestVerification}
        />
      )}

      {isHiring && (
        <div className="mt-5 rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:mt-6 sm:rounded-[26px] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Post a new opportunity</p>
              <p className="mt-1 text-sm text-neutral-600">
                Add a clear job, gig, internship, or local project.
              </p>
            </div>

            <Link
              to="/post"
              className="forsa-click inline-flex w-full items-center justify-center gap-2 rounded-full forsa-button px-5 py-3 text-sm font-medium text-white sm:w-fit"
            >
              <FaPlus className="text-xs" />
              Post
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileLevelCard({ level, completionScore, signals, isHiring }) {
  const nextTarget = completionScore >= 90 ? 100 : completionScore >= 70 ? 90 : completionScore >= 45 ? 70 : 45;
  const missing = signals.filter((item) => !item.done);

  return (
    <div className="forsa-card mb-5 overflow-hidden rounded-[28px] border border-[var(--forsa-border)] bg-white shadow-sm sm:mb-6">
      <div className="relative p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[var(--forsa-glow)]/15 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              {isHiring ? "Company level" : "Profile level"}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h3 className="text-3xl font-semibold tracking-[-0.05em]">
                {level}
              </h3>

              <span className="rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--forsa-primary)]">
                {completionScore}% complete
              </span>
            </div>

            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">
              {missing.length === 0
                ? "Your profile has strong trust signals and is ready for better matches."
                : `Complete ${missing[0].label.toLowerCase()} to move closer to the next level.`}
            </p>
          </div>

          <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4 md:w-[220px]">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Next level</span>
              <span>{nextTarget}%</span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--forsa-primary),var(--forsa-glow))] transition-all duration-500"
                style={{ width: `${Math.min(100, completionScore)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          {signals.map((item) => (
            <ProfileSignal key={item.label} done={item.done} label={item.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSignal({ done, label }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        done
          ? "bg-[var(--forsa-primary)] text-white"
          : "bg-[var(--forsa-bg)] text-neutral-500"
      }`}
    >
      {done ? <FaCheckCircle className="text-[10px]" /> : <FaClock className="text-[10px]" />}
      {label}
    </span>
  );
}

function VerificationCard({ account, onRequestVerification }) {
  const verified = Boolean(account?.verified);
  const pending = account?.verificationStatus === "pending";

  return (
    <div className="forsa-card mt-5 overflow-hidden rounded-[28px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm sm:mt-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              verified
                ? "bg-[var(--forsa-gold)] text-black"
                : pending
                ? "bg-blue-50 text-blue-700"
                : "forsa-button text-white"
            }`}
          >
            <FaShieldAlt />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">
                {verified
                  ? "Verified company"
                  : pending
                  ? "Verification pending"
                  : "Company verification"}
              </p>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  verified
                    ? "bg-[var(--forsa-gold)] text-black"
                    : pending
                    ? "bg-blue-50 text-blue-700"
                    : "bg-[var(--forsa-bg)] text-neutral-500"
                }`}
              >
                {verified ? "Trusted" : pending ? "Under review" : "Not verified"}
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              {verified
                ? "Your company has stronger trust signals across Forsa."
                : pending
                ? "Your request was sent. Keep your company details updated while we review it."
                : "Request verification so seekers can trust your company profile and job posts."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <TrustChip icon={<FaEnvelope />} text={account?.companyEmail || account?.email || "Email"} active={Boolean(account?.companyEmail || account?.email)} />
              <TrustChip icon={<FaMapMarkerAlt />} text={account?.city || "Location"} active={Boolean(account?.city)} />
              <TrustChip icon={<FaGlobe />} text={account?.website || "Website"} active={Boolean(account?.website)} />
              <TrustChip icon={<FaInstagram />} text={account?.instagram || "Instagram"} active={Boolean(account?.instagram)} />
              <TrustChip icon={<FaPhone />} text={account?.phone || "Phone"} active={Boolean(account?.phone)} />
            </div>
          </div>
        </div>

        {!verified && (
          <button
            onClick={onRequestVerification}
            disabled={pending}
            className={`forsa-click inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium sm:w-fit ${
              pending
                ? "cursor-not-allowed bg-blue-50 text-blue-700"
                : "forsa-button text-white"
            }`}
          >
            <FaShieldAlt className="text-xs" />
            {pending ? "Request sent" : "Request verification"}
          </button>
        )}
      </div>
    </div>
  );
}

function TrustChip({ icon, text, active }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
        active
          ? "bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
          : "bg-[var(--forsa-bg)] text-neutral-400"
      }`}
    >
      {icon}
      <span className="truncate">{text}</span>
    </span>
  );
}


function CompletionCard({ completionScore, isHiring }) {
  return (
    <div className="mb-5 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 sm:mb-6 sm:rounded-[26px] sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-neutral-500 sm:text-sm">Profile completion</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
            {completionScore}% complete
          </h3>
        </div>

        <span className="shrink-0 rounded-full forsa-button px-3 py-1 text-xs font-medium text-white sm:text-sm">
          {completionScore >= 80 ? "Strong" : completionScore >= 50 ? "Good" : "Start"}
        </span>
      </div>

      <div className="mt-5 h-2 rounded-full bg-[var(--forsa-bg)]">
        <div className="h-2 rounded-full forsa-button transition-all" style={{ width: `${completionScore}%` }} />
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-600">
        {isHiring
          ? "Complete your hiring profile and post opportunities to attract better applicants."
          : "Add skills, goals, and CV to improve your applications and matches."}
      </p>
    </div>
  );
}

function CompletionTips({ isHiring, profile, posts }) {
  const tips = isHiring
    ? [
        posts.length === 0 && "Post your first opportunity.",
        "Keep job descriptions clear and specific.",
        "Add pay range to build trust.",
      ].filter(Boolean)
    : [
        profile.skills.length === 0 && "Add at least 3 skills.",
        profile.lookingFor.length === 0 && "Choose what kind of work you want.",
        !(profile.cv?.url || profile.cv?.name) && "Add your CV link.",
      ].filter(Boolean);

  if (tips.length === 0) return null;

  return (
    <div className="mb-5 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 sm:mb-6 sm:rounded-[26px] sm:p-5">
      <p className="text-sm font-medium">Recommended next steps</p>

      <div className="mt-4 grid gap-2">
        {tips.map((tip) => (
          <div key={tip} className="rounded-2xl bg-[var(--forsa-bg)] px-4 py-3 text-sm text-neutral-700">
            {tip}
          </div>
        ))}
      </div>
    </div>
  );
}


function AnalyticsTab({ analytics }) {
  const rows = analytics.rows || [];
  const totals = analytics.totals || {};
  const bestPost = analytics.bestPost;

  return (
    <div className="mt-6 sm:mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Company analytics</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
            Hiring performance
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
            Track views, saves, applications, shares, reports, conversion rate, and average applicant fit across your posts.
          </p>
        </div>

        <Link
          to="/post"
          className="forsa-click inline-flex w-full items-center justify-center gap-2 rounded-full forsa-button px-5 py-3 text-sm font-medium text-white sm:w-fit"
        >
          <FaPlus className="text-xs" />
          New post
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsMetric icon={<FaEye />} label="Total views" value={formatNumber(totals.views)} />
        <AnalyticsMetric icon={<FaPaperPlane />} label="Applications" value={formatNumber(totals.applications)} />
        <AnalyticsMetric icon={<FaBookmark />} label="Saves" value={formatNumber(totals.saves)} />
        <AnalyticsMetric icon={<FaShareAlt />} label="Shares" value={formatNumber(totals.shares)} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <AnalyticsMetric icon={<FaPercent />} label="Conversion rate" value={`${totals.conversionRate || 0}%`} />
        <AnalyticsMetric icon={<FaBullseye />} label="Avg applicant fit" value={`${totals.avgFit || 0}%`} />
        <AnalyticsMetric icon={<FaFlag />} label="Reports" value={formatNumber(totals.reports)} danger={totals.reports > 0} />
      </div>

      {bestPost && (
        <div className="mt-6 overflow-hidden rounded-[28px] border border-[var(--forsa-border)] bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <p className="text-sm font-medium text-neutral-500">Best performing post</p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.04em]">{bestPost.post.title}</h3>
                <p className="mt-2 text-sm text-neutral-500">
                  {bestPost.post.location || "Lebanon"} · {bestPost.post.pay || "Pay not set"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:w-[330px]">
                <MiniAnalytics label="Views" value={bestPost.views} />
                <MiniAnalytics label="Apps" value={bestPost.applications} />
                <MiniAnalytics label="Conv." value={`${bestPost.conversionRate}%`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--forsa-primary)]">
            <FaChartLine />
          </div>
          <p className="mt-4 text-xl font-semibold">No analytics yet.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
            Post your first opportunity and analytics will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[28px] border border-[var(--forsa-border)] bg-white shadow-sm">
          <div className="border-b border-[var(--forsa-border)] p-5">
            <p className="font-semibold">Post performance table</p>
            <p className="mt-1 text-sm text-neutral-500">Sorted by applications, views, and conversion.</p>
          </div>

          <div className="divide-y divide-[var(--forsa-border)]">
            {rows.map((row) => (
              <div key={row.post.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="line-clamp-1 font-semibold tracking-[-0.03em]">{row.post.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.post.status === "closed" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                        {row.post.status === "closed" ? "Closed" : "Live"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      {row.post.location || "Lebanon"} · {row.post.category || row.post.type || "Opportunity"}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-7 lg:w-[620px]">
                    <MiniAnalytics label="Views" value={row.views} />
                    <MiniAnalytics label="Saves" value={row.saves} />
                    <MiniAnalytics label="Apps" value={row.applications} />
                    <MiniAnalytics label="Shares" value={row.shares} />
                    <MiniAnalytics label="Conv." value={`${row.conversionRate}%`} />
                    <MiniAnalytics label="Fit" value={`${row.avgFit}%`} />
                    <MiniAnalytics label="Reports" value={row.reports} />
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--forsa-bg)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--forsa-primary),var(--forsa-glow))]"
                    style={{ width: `${Math.min(100, Math.max(4, row.conversionRate))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsMetric({ icon, label, value, danger }) {
  return (
    <div className={`rounded-[24px] border p-4 shadow-sm ${danger ? "border-red-100 bg-red-50" : "border-[var(--forsa-border)] bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-xs font-medium ${danger ? "text-red-500" : "text-neutral-500"}`}>{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${danger ? "bg-white text-red-600" : "bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function PostsTab({
  posts,
  postsLoading,
  deletePost,
  togglePostStatus,
  startEditPost,
  editingPostId,
  editingPost,
  updateEditingPost,
  savePostEdit,
  cancelPostEdit,
  getApplicantsCount,
  openApplicants,
}) {
  return (
    <div className="mt-6 sm:mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Hiring dashboard</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
            Your posted opportunities
          </h2>
        </div>

        <Link
          to="/post"
          className="forsa-click inline-flex w-full items-center justify-center gap-2 rounded-full forsa-button px-5 py-3 text-sm font-medium text-white sm:w-fit"
        >
          <FaPlus className="text-xs" />
          New post
        </Link>
      </div>

      {postsLoading ? (
        <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-6 text-center sm:rounded-[26px] sm:p-8">
          <p className="text-xl font-semibold">Loading your posts...</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
            Fetching your latest Firestore posts.
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-6 text-center sm:rounded-[26px] sm:p-8">
          <p className="text-xl font-semibold">No posts yet.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
            Once you post an opportunity, it will appear here and in Explore.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {posts.map((post) =>
            editingPostId === post.id ? (
              <EditPostCard
                key={post.id}
                editingPost={editingPost}
                updateEditingPost={updateEditingPost}
                savePostEdit={savePostEdit}
                cancelPostEdit={cancelPostEdit}
              />
            ) : (
              <PostCard
                key={post.id}
                post={post}
                deletePost={deletePost}
                togglePostStatus={togglePostStatus}
                startEditPost={startEditPost}
                getApplicantsCount={getApplicantsCount}
                openApplicants={openApplicants}
                analytics={getAnalyticsForPost(post.id)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function EditPostCard({
  editingPost,
  updateEditingPost,
  savePostEdit,
  cancelPostEdit,
}) {
  return (
    <div className="forsa-card rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
      <div className="grid gap-3">
        <Field label="Title" value={editingPost.title} onChange={(value) => updateEditingPost("title", value)} />
        <Field label="Location" value={editingPost.location} onChange={(value) => updateEditingPost("location", value)} />
        <Field label="Pay" value={editingPost.pay} onChange={(value) => updateEditingPost("pay", value)} />
        <Field label="Contact" value={editingPost.contact} onChange={(value) => updateEditingPost("contact", value)} />

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={editingPost.description}
            onChange={(e) => updateEditingPost("description", e.target.value)}
            className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--forsa-green)]"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button onClick={cancelPostEdit} className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium">
          Cancel
        </button>
        <button onClick={savePostEdit} className="forsa-click rounded-full forsa-button px-4 py-2 text-sm font-medium text-white">
          Save
        </button>
      </div>
    </div>
  );
}

function PostCard({
  post,
  deletePost,
  togglePostStatus,
  startEditPost,
  getApplicantsCount,
  openApplicants,
  analytics,
}) {
  const applicantsCount = getApplicantsCount(post.id);

  return (
    <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold">{post.title}</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {post.location} · {post.pay}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs">{post.category || post.type}</span>

          <span
            className={`rounded-full px-3 py-1 text-xs ${
              post.status === "closed" ? "bg-red-100 text-red-700" : "bg-white text-neutral-600"
            }`}
          >
            {post.status === "closed" ? "Closed" : "Active"}
          </span>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">
        {post.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {[post.type, post.experience, post.shift].filter(Boolean).slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs">
            {tag}
          </span>
        ))}
        {(post.tags || []).slice(0, 6).map((tag) => (
          <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-white p-3">
        <MiniAnalytics label="Views" value={analytics?.views || 0} />
        <MiniAnalytics label="Saves" value={analytics?.saves || 0} />
        <MiniAnalytics label="Apps" value={Math.max(analytics?.applications || 0, applicantsCount)} />
        <MiniAnalytics label="Shares" value={analytics?.shares || 0} />
      </div>

      <div className="mt-3 grid gap-2 rounded-2xl bg-white p-3 sm:grid-cols-3">
        <MiniAnalytics label="Conversion" value={`${percent(Math.max(analytics?.applications || 0, applicantsCount), analytics?.views || post.views || 0)}%`} />
        <MiniAnalytics label="Reports" value={analytics?.reports || post.reports || 0} />
        <MiniAnalytics label="Status" value={post.status === "closed" ? "Closed" : "Live"} />
      </div>

      <div className="mt-3 rounded-2xl bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Applicants</p>
            <p className="mt-1 text-xs text-neutral-500">
              {applicantsCount} application{applicantsCount === 1 ? "" : "s"} received
            </p>
          </div>

          <button
            onClick={() => openApplicants(post)}
            className="forsa-click inline-flex w-full items-center justify-center gap-2 rounded-full forsa-button px-4 py-2 text-xs font-medium text-white sm:w-fit"
          >
            <FaUsers className="text-xs" />
            View
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button
          onClick={() => togglePostStatus(post.id)}
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium"
        >
          {post.status === "closed" ? "Reopen" : "Close"}
        </button>

        <button
          onClick={() => startEditPost(post)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium"
        >
          <FaEdit className="text-xs" />
          Edit
        </button>

        <button
          onClick={() => deletePost(post.id)}
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 sm:col-span-1"
        >
          <FaTrash className="text-xs" />
          Delete
        </button>
      </div>
    </div>
  );
}


function MiniAnalytics({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--forsa-bg)] px-3 py-2 text-center">
      <p className="text-sm font-semibold">{value}</p>
      <p className="mt-1 text-[10px] font-medium text-neutral-500">{label}</p>
    </div>
  );
}

function SavedJobsTab({ jobs, removeSavedJob }) {
  const [notes, setNotes] = useState(safeJson("forsaSavedJobNotes", {}));

  const updateNote = (jobId, value) => {
    const updated = {
      ...notes,
      [jobId]: value,
    };

    setNotes(updated);
    writeJson("forsaSavedJobNotes", updated);
  };

  return (
    <div className="mt-6 sm:mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Saved jobs</p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
            Opportunities you liked
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
            Keep private notes, open posts quickly, and apply when ready.
          </p>
        </div>

        {jobs.length > 0 && (
          <span className="w-fit rounded-full bg-[var(--forsa-bg)] px-4 py-2 text-sm text-neutral-600">
            {jobs.length} saved
          </span>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-6 text-center sm:rounded-[26px] sm:p-8">
          <p className="text-xl font-semibold">No saved jobs yet.</p>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
            Save opportunities from Explore and they will appear here.
          </p>

          <Link
            to="/explore"
            className="mt-6 inline-flex rounded-full forsa-button px-5 py-3 text-sm font-medium text-white"
          >
            Explore opportunities
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-[24px] border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-semibold">{job.title}</h3>

                  <p className="mt-1 text-sm text-neutral-500">
                    {job.company} · {job.location}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs text-neutral-600">
                  {job.type || "Saved"}
                </span>
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">
                {job.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {(job.tags || []).slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium">Private note</label>
                  <span className="text-xs text-neutral-400">
                    {(notes[job.id] || "").length} chars
                  </span>
                </div>

                <textarea
                  value={notes[job.id] || ""}
                  onChange={(e) => updateNote(job.id, e.target.value)}
                  placeholder="Example: Ask about schedule, pay, or portfolio..."
                  className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--forsa-green)]"
                />

                <p className="mt-2 text-xs text-neutral-500">
                  Only visible to you.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link
                  to={`/explore?post=${job.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full forsa-button px-4 py-2.5 text-sm font-medium text-white"
                >
                  Open
                  <FaArrowRight className="text-xs" />
                </Link>

                <button
                  onClick={() => removeSavedJob(job.id)}
                  className="rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function ApplicationsTab({ applications }) {
  const pending = applications.filter((item) => (item.status || "pending") === "pending").length;
  const shortlisted = applications.filter((item) => item.status === "shortlisted").length;
  const interview = applications.filter((item) => item.status === "interview").length;
  const accepted = applications.filter((item) => item.status === "accepted").length;
  const rejected = applications.filter((item) => item.status === "rejected").length;

  return (
    <div className="mt-6 sm:mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Application tracker</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
            Jobs you applied to
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
            Track your sent applications, status updates, and attached CV metadata.
          </p>
        </div>

        <Link
          to="/explore"
          className="inline-flex w-full items-center justify-center rounded-full forsa-button px-5 py-3 text-sm font-medium text-white sm:w-fit"
        >
          Find more
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        <StatCard label="Pending" value={pending} />
        <StatCard label="Shortlisted" value={shortlisted} />
        <StatCard label="Interviews" value={interview} />
        <StatCard label="Accepted" value={accepted} />
        <StatCard label="Rejected" value={rejected} />
      </div>

      {applications.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-6 text-center sm:rounded-[26px] sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <FaPaperPlane />
          </div>

          <p className="mt-4 text-xl font-semibold">No applications yet.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
            Apply to opportunities from Explore and they will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="rounded-[24px] border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-semibold">{application.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {application.company} · {application.opportunity?.location || "Lebanon"}
                  </p>
                  <p className="mt-2 text-xs text-neutral-400">
                    Updated {formatDate(application.updatedAt || application.createdAt)}
                  </p>
                </div>

                <StatusPill status={application.status || "pending"} />
              </div>

              <ApplicationTimeline status={application.status || "pending"} />

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">
                {application.lastMessage || "Application sent."}
              </p>

              {application.interview && (
                <InterviewSummary interview={application.interview} />
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs text-neutral-500">CV</p>
                  {application.cv ? (
                    application.cv.url ? (
                      <a
                        href={application.cv.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--forsa-green)]"
                      >
                        <FaExternalLinkAlt className="text-xs" />
                        Open CV
                      </a>
                    ) : (
                      <p className="mt-2 truncate text-sm font-medium">{application.cv.name}</p>
                    )
                  ) : (
                    <p className="mt-2 text-sm text-neutral-500">No CV attached.</p>
                  )}
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs text-neutral-500">Contact</p>
                  <p className="mt-2 break-all text-sm font-medium">
                    {application.opportunity?.contact || "Inside messages"}
                  </p>
                </div>
              </div>

              <Link
                to="/messages"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full forsa-button px-4 py-2.5 text-sm font-medium text-white sm:w-fit"
              >
                <FaEnvelope className="text-xs" />
                Open conversation
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationTimeline({ status }) {
  const stepIndex = getApplicationStepIndex(status);

  if (status === "rejected") {
    return (
      <div className="mt-4 rounded-2xl bg-white p-4">
        <div className="flex items-center gap-2">
          <FaTimesCircle className="text-red-600" />
          <p className="text-sm font-medium text-red-700">Application rejected</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Keep applying. Your saved jobs and recommendations can help you find a better fit.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl bg-white p-4">
      <div className="flex gap-2">
        {applicationSteps.map((step, index) => (
          <div
            key={step}
            className={`h-2 flex-1 rounded-full ${
              index <= stepIndex ? "forsa-button" : "bg-neutral-200"
            }`}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-4 text-[11px] uppercase tracking-wide text-neutral-500">
        <span>Pending</span>
        <span className="text-center">Shortlisted</span>
        <span className="text-center">Interview</span>
        <span className="text-right">Accepted</span>
      </div>
    </div>
  );
}


function StatusPill({ status }) {
  const styles =
    status === "interview"
      ? "bg-blue-100 text-blue-700"
      : status === "shortlisted"
      ? "forsa-button text-white"
      : status === "accepted"
      ? "bg-green-100 text-green-700"
      : status === "rejected"
      ? "bg-red-100 text-red-700"
      : "bg-white text-neutral-600";

  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${styles}`}>
      {status}
    </span>
  );
}

function ApplicationsSentBox({ applications }) {
  return (
    <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5 md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">Applications sent</p>
          <p className="mt-1 text-sm text-neutral-600">
            {applications.length} application{applications.length === 1 ? "" : "s"} created from Explore.
          </p>
        </div>

        <Link
          to="/messages"
          className="shrink-0 rounded-full forsa-button px-4 py-2 text-xs font-medium text-white"
        >
          View
        </Link>
      </div>

      {applications.length > 0 && (
        <div className="mt-4 grid gap-2">
          {applications.slice(0, 3).map((application) => (
            <div key={application.id} className="rounded-2xl bg-white p-3">
              <p className="line-clamp-1 text-sm font-medium">{application.title}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {application.company} · {application.status || "pending"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileEdit({
  account,
  profile,
  isHiring,
  updateAccount,
  toggleProfileItem,
  handleCvLinkSave,
  removeCv,
}) {
  return (
    <div className="mt-6 sm:mt-8">
      {isHiring ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Company name"
              value={account.companyName || account.name}
              onChange={(value) => {
                updateAccount("companyName", value);
                updateAccount("name", value);
              }}
            />

            <Field
              label="Company email"
              value={account.companyEmail || account.email}
              onChange={(value) => {
                updateAccount("companyEmail", value);
                updateAccount("email", value);
              }}
            />

            <Field
              label="Contact person"
              value={account.contactPerson || ""}
              onChange={(value) => updateAccount("contactPerson", value)}
            />

            <Field
              label="Company location"
              value={account.city}
              onChange={(value) => updateAccount("city", value)}
            />

            <Field
              label="Website"
              value={account.website || ""}
              onChange={(value) => updateAccount("website", value)}
            />

            <Field
              label="Instagram"
              value={account.instagram || ""}
              onChange={(value) => updateAccount("instagram", value)}
            />

            <Field
              label="Business phone / WhatsApp"
              value={account.phone || ""}
              onChange={(value) => updateAccount("phone", value)}
            />
          </div>

          <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
            <label className="text-sm font-medium">Company bio</label>

            <textarea
              value={account.companyBio || ""}
              onChange={(e) => updateAccount("companyBio", e.target.value)}
              placeholder="Write a short description about your company, what you do, and what kind of people you hire."
              className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--forsa-green)]"
            />

            <p className="mt-2 text-xs text-neutral-500">
              This will appear on your public company profile.
            </p>
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 sm:rounded-[26px] sm:p-5">
            <p className="font-medium">Public company profile</p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              People can view your company profile, active opportunities, and
              basic contact details.
            </p>

            <Link
              to={`/company/${encodeURIComponent(
                account.companyEmail || account.email
              )}`}
              className="mt-4 inline-flex rounded-full forsa-button px-5 py-3 text-sm font-medium text-white"
            >
              View public profile
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Full name"
              value={account.name}
              onChange={(value) => updateAccount("name", value)}
            />

            <Field
              label="Email"
              value={account.email}
              onChange={(value) => updateAccount("email", value)}
            />

            <Field
              label="City"
              value={account.city}
              onChange={(value) => updateAccount("city", value)}
            />
          </div>
          <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
  <label className="text-sm font-medium">Public summary</label>
  <textarea
    value={account.bio || ""}
    onChange={(e) => updateAccount("bio", e.target.value)}
    placeholder="Example: Motivated computer science student looking for internships, part-time work, and freelance projects."
    className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--forsa-green)]"
  />
</div>

<div className="mt-6 grid gap-4 md:grid-cols-2">
  <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
    <label className="text-sm font-medium">Experience</label>
    <textarea
      value={account.experience || ""}
      onChange={(e) => updateAccount("experience", e.target.value)}
      placeholder="One item per line. Example: Cashier — handled POS, customers, and daily closing."
      className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--forsa-green)]"
    />
  </div>

  <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
    <label className="text-sm font-medium">Education</label>
    <textarea
      value={account.education || ""}
      onChange={(e) => updateAccount("education", e.target.value)}
      placeholder="One item per line. Example: TS1 MIS / IT — CIS College"
      className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--forsa-green)]"
    />
  </div>
</div>

<div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
  <label className="text-sm font-medium">Portfolio links</label>
  <textarea
    value={account.portfolioLinks || ""}
    onChange={(e) => updateAccount("portfolioLinks", e.target.value)}
    placeholder="One link per line. Example: https://github.com/yourname"
    className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--forsa-green)]"
  />
</div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <EditBox
              title="Your skills"
              options={skillOptions}
              selected={profile.skills}
              onToggle={(item) => toggleProfileItem("skills", item)}
            />

            <EditBox
              title="Looking for"
              options={lookingOptions}
              selected={profile.lookingFor}
              onToggle={(item) => toggleProfileItem("lookingFor", item)}
            />
          </div>

          <SmartCvAutofill
            profile={profile}
            toggleProfileItem={toggleProfileItem}
          />

          <CvLinkEditor
            cv={profile.cv}
            onSave={handleCvLinkSave}
            onRemove={removeCv}
          />
        </>
      )}
    </div>
  );
}

function SmartCvAutofill({ profile, toggleProfileItem }) {
  const [cvText, setCvText] = useState("");
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [suggestedLooking, setSuggestedLooking] = useState([]);

  const analyzeCv = () => {
    const text = cvText.toLowerCase();

    const skills = skillOptions.filter((skill) =>
      text.includes(skill.toLowerCase())
    );

    const looking = lookingOptions.filter((item) => {
      const value = item.toLowerCase();

      return (
        text.includes(value) ||
        (value.includes("internship") && text.includes("intern")) ||
        (value.includes("freelance") && text.includes("freelancer")) ||
        (value.includes("remote") && text.includes("remote")) ||
        (value.includes("part-time") && text.includes("part time"))
      );
    });

    setSuggestedSkills(skills);
    setSuggestedLooking(looking);
  };

  const applySuggestions = () => {
    suggestedSkills.forEach((skill) => {
      if (!profile.skills.includes(skill)) {
        toggleProfileItem("skills", skill);
      }
    });

    suggestedLooking.forEach((item) => {
      if (!profile.lookingFor.includes(item)) {
        toggleProfileItem("lookingFor", item);
      }
    });
  };

  const hasSuggestions = suggestedSkills.length > 0 || suggestedLooking.length > 0;

  return (
    <div className="mt-6 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 shadow-sm sm:rounded-[26px] sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">Smart CV Autofill</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
            Paste CV text and Forsa will suggest skills and opportunity interests.
          </p>
        </div>

        <span className="w-fit rounded-full forsa-button px-3 py-1 text-xs font-medium text-white">
          Beta
        </span>
      </div>

      <textarea
        value={cvText}
        onChange={(e) => setCvText(e.target.value)}
        placeholder="Paste CV text here..."
        className="mt-4 min-h-32 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--forsa-green)]"
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={analyzeCv}
          disabled={!cvText.trim()}
          className={`rounded-full px-5 py-3 text-sm font-medium ${
            cvText.trim()
              ? "forsa-button text-white"
              : "cursor-not-allowed bg-neutral-200 text-neutral-400"
          }`}
        >
          Analyze CV
        </button>

        {hasSuggestions && (
          <button
            type="button"
            onClick={applySuggestions}
            className="rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium"
          >
            Apply suggestions
          </button>
        )}
      </div>

      {hasSuggestions && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SuggestionBox title="Suggested skills" items={suggestedSkills} />
          <SuggestionBox title="Suggested interests" items={suggestedLooking} />
        </div>
      )}
    </div>
  );
}

function SuggestionBox({ title, items }) {
  return (
    <div className="rounded-2xl bg-[var(--forsa-bg)] p-4">
      <p className="text-sm font-medium">{title}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span key={item} className="rounded-full bg-white px-3 py-1.5 text-xs">
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-neutral-500">No matches found.</p>
        )}
      </div>
    </div>
  );
}

function RecentlyViewedPreview({ jobs }) {
  return (
    <div className="mt-5 rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:mt-6 sm:rounded-[26px] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Recently viewed</p>
          <p className="mt-1 text-sm text-neutral-600">
            Continue from opportunities you opened recently.
          </p>
        </div>

        <Link
          to="/profile"
          className="hidden rounded-full bg-white px-4 py-2 text-xs font-medium sm:inline-flex"
        >
          View
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {jobs.slice(0, 3).map((job) => (
          <Link
            key={job.id}
            to={`/explore?post=${job.id}`}
            className="rounded-2xl bg-white p-4 transition hover:-translate-y-0.5"
          >
            <p className="line-clamp-2 text-sm font-medium">{job.title}</p>
            <p className="mt-2 text-xs text-neutral-500">
              {job.company} · {formatDate(job.viewedAt)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentlyViewedTab({ jobs, onClear }) {
  return (
    <div className="mt-6 sm:mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Recently viewed</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
            Continue browsing
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
            Posts you opened from Explore are saved here automatically.
          </p>
        </div>

        {jobs.length > 0 && (
          <button
            onClick={onClear}
            className="rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium"
          >
            Clear history
          </button>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-6 text-center sm:rounded-[26px] sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <FaEye />
          </div>

          <p className="mt-4 text-xl font-semibold">No viewed jobs yet.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
            Open opportunities from Explore and they will appear here.
          </p>

          <Link
            to="/explore"
            className="mt-6 inline-flex rounded-full forsa-button px-5 py-3 text-sm font-medium text-white"
          >
            Explore opportunities
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/explore?post=${job.id}`}
              className="rounded-[24px] border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4 transition hover:border-[var(--forsa-green)] sm:rounded-[26px] sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-semibold">{job.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {job.company} · {job.location}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs text-neutral-600">
                  {job.type || "Viewed"}
                </span>
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">
                {job.description}
              </p>

              <p className="mt-4 text-xs text-neutral-400">
                Viewed {formatDate(job.viewedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}



function VerificationRequestModal({
  open,
  form,
  loading,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <Modal open={open} title="Request company verification" onClose={onClose}>
      <div>
        <p className="text-sm leading-7 text-neutral-600">
          Add clear proof that your company is real. This helps seekers trust your posts before applying.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <VerificationInput
            icon={<FaPhone />}
            label="Phone / WhatsApp"
            value={form.phone}
            placeholder="70 000 000"
            onChange={(value) => onChange("phone", value)}
          />

          <VerificationInput
            icon={<FaGlobe />}
            label="Website"
            value={form.website}
            placeholder="https://company.com"
            onChange={(value) => onChange("website", value)}
          />

          <VerificationInput
            icon={<FaInstagram />}
            label="Instagram"
            value={form.instagram}
            placeholder="@company"
            onChange={(value) => onChange("instagram", value)}
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium">Proof message</label>
          <textarea
            value={form.proof}
            onChange={(event) => onChange("proof", event.target.value)}
            placeholder="Example: We are Farouj Restaurant in Jal El Dib. This is our official Instagram/phone, and we are hiring through Forsa."
            className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--forsa-primary)]"
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="forsa-click rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="forsa-click forsa-button rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Sending..." : "Submit request"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function VerificationInput({ icon, label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="forsa-focus mt-2 flex items-center gap-3 rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3">
        <span className="text-neutral-400">{icon}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}

function InterviewSummary({ interview }) {
  return (
    <div className="mt-4 rounded-[24px] border border-blue-100 bg-blue-50 p-4">
      <p className="font-semibold text-blue-700">Interview scheduled</p>

      <div className="mt-3 grid gap-2 text-sm text-blue-700 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold text-blue-500">Date</p>
          <p className="mt-1">{interview.date}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-blue-500">Time</p>
          <p className="mt-1">{interview.time}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-blue-500">Location</p>
          <p className="mt-1">{interview.location}</p>
        </div>
      </div>

      {interview.notes && (
        <p className="mt-3 text-sm leading-6 text-blue-700">{interview.notes}</p>
      )}
    </div>
  );
}

function SettingsTab({
  logout,
  resetDemoAccount,
  loadDemo,
  clearDemo,
  isHiring,
  account,
  onRequestVerification,
  onDeleteAccount,
}) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {isHiring && (
        <div className="rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 sm:rounded-[26px] sm:p-5 md:col-span-2">
          <p className="font-medium">Company trust</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {account?.verified
              ? "Your company is verified."
              : "Submit your company for verification to increase trust with applicants."}
          </p>

          {!account?.verified && (
            <button
              onClick={onRequestVerification}
              className="mt-5 rounded-full forsa-button px-5 py-3 text-sm font-medium text-white"
            >
              Request verification
            </button>
          )}
        </div>
      )}

      <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
        <p className="font-medium">Session</p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Manage your current signed-in session. More security settings will be added here.
        </p>

        <button onClick={logout} className="forsa-click mt-5 w-full rounded-full forsa-button px-5 py-3 text-sm font-medium text-white sm:w-fit">
          Log out
        </button>
      </div>

      <div className="rounded-[24px] bg-[#fff5f5] p-4 sm:rounded-[26px] sm:p-5 md:col-span-2">
        <p className="font-medium text-red-700">Danger zone</p>
        <p className="mt-2 text-sm leading-6 text-red-600">
          Reset this demo account and remove saved local data.
        </p>

        <button
  onClick={onDeleteAccount}
  className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
>
  Delete account
</button>
      </div>
    </div>
  );
}

function CvBox({ cv }) {
  return (
    <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
      <p className="text-sm text-neutral-500">CV</p>

      {cv ? (
        <div className="mt-4 rounded-2xl bg-white p-4">
          <p className="truncate font-medium">{cv.name || "CV / Resume link"}</p>

          {cv.url ? (
            <a
              href={cv.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full forsa-button px-4 py-2 text-xs font-medium text-white"
            >
              <FaExternalLinkAlt className="text-[10px]" />
              Open CV
            </a>
          ) : (
            <p className="mt-1 text-sm text-neutral-500">
              {cv.size ? `${(cv.size / 1024 / 1024).toFixed(2)} MB · PDF metadata` : "CV saved"}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">No CV link added yet.</p>
      )}
    </div>
  );
}

function CvLinkEditor({ cv, onSave, onRemove }) {
  const [url, setUrl] = useState(cv?.url || "");

  return (
    <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full forsa-button text-white">
          <FaLink />
        </div>

        <div>
          <p className="font-medium">CV / Resume link</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Paste a public Google Drive, Dropbox, OneDrive, Notion, or portfolio CV link.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4">
        <label className="text-sm font-medium">Public CV link</label>

        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://drive.google.com/..."
          className="mt-2 w-full rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forsa-green)]"
        />

        <p className="mt-2 text-xs leading-5 text-neutral-500">
          Make sure the link is public or anyone with the link can view it.
        </p>

        {cv?.url && (
          <a
            href={cv.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--forsa-green)]"
          >
            <FaExternalLinkAlt className="text-xs" />
            Open current CV
          </a>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSave(url)}
            className="forsa-click rounded-full forsa-button px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--forsa-green-light)]"
          >
            Save CV link
          </button>

          {cv && (
            <button
              type="button"
              onClick={() => {
                setUrl("");
                onRemove();
              }}
              className="rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-medium text-red-600"
            >
              Remove CV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


function ApplicantsModal({ post, applicants, onClose, onStatusChange, onOpenMessage }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center forsa-button/30 px-4 pb-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-0">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[26px] bg-white p-4 shadow-xl sm:rounded-[32px] sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-5">
          <div className="min-w-0">
            <p className="text-sm text-neutral-500">Applicants for</p>
            <h2 className="mt-1 line-clamp-2 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
              {post.title}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {applicants.length} application{applicants.length === 1 ? "" : "s"}
            </p>
          </div>

          <button onClick={onClose} className="shrink-0 rounded-full bg-[var(--forsa-bg)] px-4 py-2 text-sm font-medium">
            Close
          </button>
        </div>

        {applicants.length === 0 ? (
          <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-6 text-center sm:rounded-[26px] sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <FaUsers />
            </div>

            <h3 className="mt-4 text-xl font-semibold">No applicants yet.</h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-600">
              When someone applies to this opportunity, their application will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {applicants.map((applicant) => (
              <ApplicantCard
                key={applicant.id}
                applicant={applicant}
                onStatusChange={onStatusChange}
                onOpenMessage={onOpenMessage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicantCard({ applicant, onStatusChange, onOpenMessage }) {
  const seeker = applicant.seeker || {};
  const cv = applicant.cv;
  const status = applicant.status || "pending";

  return (
    <div className="rounded-[24px] border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full forsa-button text-white">
              {(seeker.name || "A").charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-semibold">{seeker.name || "Applicant"}</h3>
              <p className="break-all text-sm text-neutral-500">
                {seeker.city || "Lebanon"} · {seeker.email || "No email"}
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
            {applicant.lastMessage}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
            status === "shortlisted"
              ? "forsa-button text-white"
              : status === "rejected"
              ? "bg-red-100 text-red-700"
              : "bg-white text-neutral-600"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <MiniInfo title="Skills" text={seeker.skills?.length ? seeker.skills.join(", ") : "No skills"} />
        <MiniInfo title="Looking for" text={seeker.lookingFor?.length ? seeker.lookingFor.join(", ") : "Not selected"} />
      </div>

      <div className="mt-3 rounded-2xl bg-white p-4">
        <p className="text-xs text-neutral-500">CV metadata</p>

        {cv ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <FaFileAlt />
            <span className="break-all">{cv.name}</span>
            <span className="text-neutral-400">· {(cv.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">No CV attached.</p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button
          onClick={() => onStatusChange(applicant.id, "shortlisted")}
          className="inline-flex items-center justify-center gap-2 rounded-full forsa-button px-4 py-2 text-sm font-medium text-white"
        >
          <FaCheckCircle className="text-xs" />
          Shortlist
        </button>

        <button
          onClick={() => onStatusChange(applicant.id, "rejected")}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600"
        >
          <FaTimesCircle className="text-xs" />
          Reject
        </button>

        <button
          onClick={onOpenMessage}
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium sm:col-span-1"
        >
          <FaEnvelope className="text-xs" />
          Open message
        </button>
      </div>
    </div>
  );
}

function MiniInfo({ title, text }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs text-neutral-500">{title}</p>
      <p className="mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`forsa-click inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? "forsa-button text-white" : "bg-[var(--forsa-bg)] text-neutral-600 hover:bg-white"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
        {value}
      </p>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forsa-green)]"
      />
    </div>
  );
}

function EditBox({ title, options, selected, onToggle }) {
  return (
    <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
      <p className="text-sm font-medium">{title}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((item) => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              selected.includes(item)
                ? "border-black forsa-button text-white"
                : "border-neutral-300 bg-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function InfoBox({ title, items, empty }) {
  return (
    <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
      <p className="text-sm text-neutral-500">{title}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span key={item} className="rounded-full bg-white px-3 py-1.5 text-sm">
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-neutral-500">{empty}</p>
        )}
      </div>
    </div>
  );
}
