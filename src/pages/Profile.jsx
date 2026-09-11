import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import AppHeader from "../components/AppHeader";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  requestCvUpload,
  uploadCvToR2,
  requestCvView,
  requestCvDelete,
} from "../lib/cvUpload";
import Modal from "../components/ui/Modal";
import { deleteCurrentAccount } from "../lib/accountDeletionService";
import {
  changeUsername,
  checkUsernameAvailable,
  logout,
  reauthenticateCurrentUser,
  reauthErrorMessage,
} from "../lib/auth";
import { showToast } from "../lib/Toast";
import { getPostsByOwner } from "../lib/postService.js";

import { createVerificationRequest } from "../lib/verificationService";
import { requestProfileCompleteEmail } from "../lib/profileCompleteEmail";
import { requestProfileImprovementEmail } from "../lib/profileImprovementEmail";
import {
  FaBriefcase,
  FaBookmark,
  FaCog,
  FaEdit,
  FaMapMarkerAlt,
  FaPlus,
  FaUser,
  FaUsers,
  FaEnvelope,
  FaCheckCircle,
  FaPaperPlane,
  FaEye,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaGlobe,
  FaInstagram,
  FaPhone,
  FaChartLine,
} from "react-icons/fa";

const safeJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
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

function normalizePersistedExperience(value) {
  const items = Array.isArray(value) ? value : value ? [value] : [];

  return items
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") return { title: item };
      return item;
    })
    .filter(Boolean);
}

function normalizePersistedEducation(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return { institution: value };
  }

  if (Array.isArray(value)) {
    const first = value[0];
    if (!first) return null;
    return typeof first === "string" ? { institution: first } : first;
  }

  return value;
}

function nonEmptyString(value) {
  return Boolean(String(value ?? "").trim());
}

function hasEducation(value) {
  if (!value) return false;
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value).some((item) => nonEmptyString(item));
  }
  return false;
}

function hasValidExperience(value) {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.some(
    (item) => nonEmptyString(item?.title) || nonEmptyString(item?.company)
  );
}

function buildCompletionSignals(account, profile, experiences, isHiring, posts) {
  if (isHiring) {
    return [
      {
        key: "company-name",
        label: "Company name",
        done: nonEmptyString(account.name),
      },
      {
        key: "contact-email",
        label: "Contact email",
        done: nonEmptyString(account.companyEmail || account.email),
      },
      {
        key: "location",
        label: "Location",
        done: nonEmptyString(account.city),
      },
      {
        key: "public-profile",
        label: "Public profile",
        done: Boolean(account.companyBio || account.website || account.instagram),
      },
      {
        key: "first-post",
        label: "First post",
        done: posts.length > 0,
        action: { to: "/post" },
      },
    ];
  }

  const skills = Array.isArray(profile.skills)
    ? profile.skills
    : Array.isArray(profile.publicSkills)
    ? profile.publicSkills
    : [];

  const lookingFor = Array.isArray(profile.lookingFor)
    ? profile.lookingFor
    : Array.isArray(profile.publicLookingFor)
    ? profile.publicLookingFor
    : [];

  const experienceItems =
    Array.isArray(experiences) && experiences.length > 0
      ? experiences
      : account.experience;

  const cvSet = Boolean(
    profile.cv?.url ||
      profile.cv?.name ||
      profile.publicCv?.url ||
      profile.publicCv?.name ||
      account.cv?.url ||
      account.cv?.name
  );

  return [
    { key: "name", label: "Full name", done: nonEmptyString(account.name) },
    {
      key: "location",
      label: "Location",
      done: Boolean(account.city || profile.cityPreference),
    },
    {
      key: "about",
      label: "About you",
      done: nonEmptyString(account.bio || account.about || account.summary),
    },
    { key: "skills", label: "Skills", done: skills.length > 0 },
    { key: "goals", label: "Looking for", done: lookingFor.length > 0 },
    { key: "cv", label: "CV / Resume", done: cvSet },
    {
      key: "experience",
      label: "Work experience",
      done: hasValidExperience(experienceItems),
    },
    {
      key: "education",
      label: "Education",
      done: hasEducation(account.education),
    },
  ];
}

function getProfileCompletion(signals) {
  if (!Array.isArray(signals) || signals.length === 0) return 0;
  const completed = signals.filter((signal) => signal.done).length;
  return Math.round((completed / signals.length) * 100);
}

function getProfileLevel(completionScore) {
  if (completionScore >= 90) return "Strong";
  if (completionScore >= 70) return "Good";
  if (completionScore >= 45) return "Getting started";
  return "Just started";
}

export default function Profile() {
  const navigate = useNavigate();
  const { account: authAccount } = useAuth();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const isPasswordAccount = !(auth.currentUser?.providerData || []).some(
    (provider) => provider.providerId === "google.com"
  );

  const savedProfile = safeJson("forsaProfile", {
  skills: [],
  lookingFor: [],
  cv: null,
});

if (!Array.isArray(savedProfile.skills)) {
  savedProfile.skills = [];
}

  const [account, setAccount] = useState(authAccount);

  const savedAccount = authAccount;

  const [profile, setProfile] = useState(savedProfile);
  const [experiences, setExperiences] = useState(
  Array.isArray(savedAccount?.experience)
    ? savedAccount.experience
    : []
);
  const [posts, setPosts] = useState(() => {
    const allPosts = safeJson("forsaPosts", []);
    if (!savedAccount || savedAccount.accountType !== "hiring") return allPosts;

    return allPosts.filter(
  (post) => post.ownerUid === savedAccount.uid
);
  });
  const [savedJobs] = useState(safeJson("forsaSavedJobs", []));
  const [messages] = useState(() => {
    const localMessages = safeJson("forsaMessages", []);
    const cachedMessages = safeJson("forsaMessagesCache", []);
    return localMessages.length ? localMessages : cachedMessages;
  });
  const [recentlyViewed] = useState(safeJson("forsaRecentlyViewed", []));
  const [followedCompanies] = useState(
  safeJson("forsaFollowedCompanies", [])
);
  const [tab, setTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);

  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    phone: account?.phone || "",
    website: account?.website || "",
    instagram: account?.instagram || "",
    proof: "",
  });
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!savedAccount || savedAccount.accountType !== "hiring") return;

    let active = true;

    const loadPosts = async () => {
      try {
        const remotePosts = await getPostsByOwner({
  uid: savedAccount.uid,
});

        if (active) setPosts(remotePosts);
      } catch (error) {
        console.error("Profile posts load error:", error);
        showToast("Could not refresh your posts. Showing saved data.", "info");
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

  const profileSignals = buildCompletionSignals(
    account,
    profile,
    experiences,
    isHiring,
    posts
  );

  const completionScore = getProfileCompletion(profileSignals);

  const profileLevel = getProfileLevel(completionScore);

  const seekerApplications = messages.filter(
    (thread) => thread.seeker?.email === account.email
  );

  const hiringApplicantsCount = isHiring
    ? messages.filter(
        (thread) => Boolean(thread.opportunityId) || Boolean(thread.postId)
      ).length
    : 0;

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

    const updateAccount = (field, value) => {
    setAccount((prev) => ({ ...prev, [field]: value }));
  };

  const deleteApiErrorMessage = (error) => {
    const code = error?.code || "";

    if (code === "NETWORK") {
      return "Network error. Check your connection and try again.";
    }

    if (code === "REAUTH_REQUIRED") {
      return "Please sign in again, then delete your account.";
    }

    if (code === "DELETION_IN_PROGRESS") {
      return "A deletion for this account is already in progress. Please try again in a few minutes.";
    }

    if (code === "NO_USER") {
      return "Your session ended. Please sign in again.";
    }

    return (
      error?.message ||
      "Could not delete your account. Please try again."
    );
  };

const handleDeleteAccount = async () => {
  if (deleteConfirmText !== "DELETE") {
    showToast("Type DELETE to confirm.", "error");
    return;
  }

  setDeletingAccount(true);

  try {
    if (isPasswordAccount && !deletePassword) {
      showToast("Enter your current password to confirm.", "error");
      setDeletingAccount(false);
      return;
    }

    try {
      await reauthenticateCurrentUser({
        password: isPasswordAccount ? deletePassword : undefined,
      });
    } catch (reauthError) {
      showToast(reauthErrorMessage(reauthError), "error");
      setDeletingAccount(false);
      return;
    }

    await deleteCurrentAccount();

    showToast("Account deleted");
    navigate("/auth", { replace: true });
  } catch (error) {
    console.error("Delete account error:", error);
    showToast(deleteApiErrorMessage(error), "error");
  } finally {
    setDeletingAccount(false);
  }
};

  const persistCv = async (nextCv) => {
    const nextProfile = { ...profile, cv: nextCv };

    setProfile(nextProfile);

    localStorage.setItem(
      "forsaProfile",
      JSON.stringify(nextProfile)
    );

    if (account?.uid) {
      await setDoc(
        doc(db, "users", account.uid),
        {
          cv: nextCv,
          publicCv: nextCv,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      void requestProfileCompleteEmail();
      void requestProfileImprovementEmail();
    }
  };

  const handleCvUploadPersist = async (cv) => {
    try {
      await persistCv(cv);
      showToast("CV uploaded");
    } catch (error) {
      console.error("CV upload save error:", error);
      showToast("Could not save your CV. Please try again.", "error");
    }
  };

  const removeCv = async () => {
    const current = profile?.cv;

    if (current?.storage === "r2" && current.objectKey) {
      try {
        await requestCvDelete(current.objectKey);
      } catch (error) {
        console.error("CV delete failed:", error);
      }
    }

    try {
      await persistCv(null);
      showToast("CV removed");
    } catch (error) {
      console.error("CV remove error:", error);
      showToast("Could not remove your CV. Please try again.", "error");
    }
  };

  const handleCvView = () => {
    const current = profile?.cv;

    if (!current) {
      return;
    }

    if (current.url) {
      window.open(current.url, "_blank", "noopener,noreferrer");
      return;
    }

    if (current.storage === "r2" && current.objectKey) {
      requestCvView(current.objectKey)
        .then(({ viewUrl }) => {
          window.open(viewUrl, "_blank", "noopener,noreferrer");
        })
        .catch((error) => {
          console.error("CV view failed:", error);
          showToast("Could not open your CV. Please try again.", "error");
        });
    }
  };

const saveChanges = async () => {
  if (savingProfile) return;

  setSavingProfile(true);

  try {
    const cleanSkills = Array.isArray(profile.skills)
      ? profile.skills
          .map((skill) => String(skill).trim())
          .filter(Boolean)
      : [];

    const cleanProfile = {
      ...profile,
      skills: cleanSkills,
      lookingFor: Array.isArray(profile.lookingFor)
        ? profile.lookingFor
        : [],
      cv: profile.cv || null,
    };

    const nextAccount = {
      ...account,
      bio: account.summary || account.bio || "",
      experience: experiences,
      education: account.education || null,
      portfolioLinks: account.portfolioLinks || "",
    };

    const profileData = {
      name: nextAccount.name || "",
      city: nextAccount.city || "",
      updatedAt: serverTimestamp(),
    };

    if (isHiring) {
      profileData.companyName =
        nextAccount.companyName || nextAccount.name || "";
      profileData.companyEmail = nextAccount.companyEmail || "";
      profileData.contactPerson = nextAccount.contactPerson || "";
      profileData.companyBio = nextAccount.companyBio || "";
      profileData.website = nextAccount.website || "";
      profileData.instagram = nextAccount.instagram || "";
      profileData.phone = nextAccount.phone || "";
    } else {
      profileData.bio = nextAccount.bio || "";
      profileData.headline = nextAccount.headline || "";
      profileData.availability = nextAccount.availability || "";
      profileData.experience = normalizePersistedExperience(experiences);
      profileData.education = normalizePersistedEducation(
        nextAccount.education
      );
      profileData.portfolioLinks = nextAccount.portfolioLinks || "";

      profileData.desiredRole = nextAccount.desiredRole || "";
      profileData.opportunityType = nextAccount.opportunityType || "";
      profileData.preferredLocation = nextAccount.preferredLocation || "";
      profileData.workPreference = nextAccount.workPreference || "";

      profileData.skills = cleanProfile.skills;
      profileData.lookingFor = cleanProfile.lookingFor;
      profileData.cv = cleanProfile.cv;

      profileData.publicSkills = cleanProfile.skills;
      profileData.publicLookingFor = cleanProfile.lookingFor;
      profileData.publicCv = cleanProfile.cv;
    }

    if (account?.uid) {
      await setDoc(
        doc(db, "users", account.uid),
        profileData,
        { merge: true }
      );

      void requestProfileCompleteEmail();
      void requestProfileImprovementEmail();
    }

    setProfile(cleanProfile);
    setAccount(nextAccount);

    localStorage.setItem(
      "forsaAccount",
      JSON.stringify(nextAccount)
    );

    localStorage.setItem(
      "forsaProfile",
      JSON.stringify(cleanProfile)
    );

    syncUserRecord(nextAccount);

    showToast("Profile updated");
    setIsEditing(false);
  } catch (error) {
    console.error("Profile save error:", error);
    showToast("Could not save profile.", "error");
  } finally {
    setSavingProfile(false);
  }
};

  const cancelEdit = () => {
  setAccount(savedAccount);
  setProfile(savedProfile);
  setIsEditing(false);
};

    const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      showToast("Could not log out. Please try again.", "error");
      setLoggingOut(false);
    }
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
  {isHiring
    ? "Hiring account"
    : account?.headline || "Looking for work"}
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
                onClick={() => {
  setIsEditing(true);
}}
                className="forsa-click inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium transition hover:border-neutral-500 sm:w-fit"
              >
                <FaEdit className="text-xs" />
                Edit profile
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  onClick={cancelEdit}
                  disabled={savingProfile}
                  className="forsa-click rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  onClick={saveChanges}
                  disabled={savingProfile}
                  className="forsa-click rounded-full forsa-button px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--forsa-green-light)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            )}
          </div>

          <div className="-mx-1 mt-7 flex gap-2 overflow-x-auto border-b border-[var(--forsa-border)] px-1 pb-4">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<FaUser />}>
              Overview
            </TabButton>

            <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={<FaCog />}>
              Settings
            </TabButton>
          </div>

          {isEditing ? (
            <ProfileEdit
  account={account}
  profile={profile}
  setProfile={setProfile}
  isHiring={isHiring}
  updateAccount={updateAccount}
              handleCvUpload={handleCvUploadPersist}
              handleCvView={handleCvView}
              experiences={experiences}
              setExperiences={setExperiences}
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
                  followedCompanies={followedCompanies}
                  applicantsCount={hiringApplicantsCount}
                  account={account}
                  onRequestVerification={requestVerification}
                  onEdit={() => setIsEditing(true)}
                  experiences={experiences}
                />
              )}

              {tab === "settings" && (
                <SettingsTab
  logout={handleLogout}
  loggingOut={loggingOut}
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
              setDeletePassword("");
            }
          }}
        >
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

            {isPasswordAccount ? (
              <>
                <label className="mt-4 block text-xs font-semibold text-red-700">
                  Enter your current password to confirm your identity.
                </label>

                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Current password"
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-red-500"
                />
              </>
            ) : (
              <p className="mt-4 text-xs leading-5 text-red-600">
                You will re-confirm your identity with Google before the
                account is deleted.
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              disabled={deletingAccount}
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText("");
                setDeletePassword("");
              }}
              className="rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              disabled={
                deletingAccount ||
                deleteConfirmText !== "DELETE" ||
                (isPasswordAccount && !deletePassword)
              }
              onClick={handleDeleteAccount}
              className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingAccount ? "Deleting..." : "Delete forever"}
            </button>
          </div>
        </Modal>
      <Footer />
    </section>
  );
}

function QuickLink({ to, icon, label, value }) {
  return (
    <Link
      to={to}
      className="forsa-click flex items-center justify-between gap-3 rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 transition hover:border-[var(--forsa-primary)]/40"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--forsa-bg)] text-[var(--forsa-primary)]">
          {icon}
        </span>
        <span className="truncate text-sm font-semibold text-neutral-800">{label}</span>
      </span>

      {value && (
        <span className="shrink-0 text-xs font-medium text-neutral-500">{value}</span>
      )}

      <FaExternalLinkAlt className="shrink-0 text-[10px] text-neutral-400" />
    </Link>
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
  followedCompanies = [],
  applicantsCount = 0,
  account,
  experiences,
  onRequestVerification,
  onEdit,
}) {
  return (
    <div className="mt-6 sm:mt-8">
      <CompletionCard
        completionScore={completionScore}
        level={profileLevel}
        signals={profileSignals}
        isHiring={isHiring}
        onEdit={onEdit}
      />

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

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {isHiring ? (
          <>
            <QuickLink
              to="/dashboard"
              icon={<FaBriefcase className="text-xs" />}
              label="Manage opportunities"
              value={posts.length > 0 ? `${posts.length} ${posts.length === 1 ? "post" : "posts"}` : null}
            />
            <QuickLink
              to="/applicants"
              icon={<FaUsers className="text-xs" />}
              label="View applicants"
              value={applicantsCount > 0 ? `${applicantsCount} ${applicantsCount === 1 ? "applicant" : "applicants"}` : null}
            />
            <QuickLink
              to="/dashboard"
              icon={<FaChartLine className="text-xs" />}
              label="View analytics"
              value={null}
            />
          </>
        ) : (
          <>
            <QuickLink
              to="/applications"
              icon={<FaPaperPlane className="text-xs" />}
              label="View applications"
              value={seekerApplications.length > 0 ? `${seekerApplications.length} ${seekerApplications.length === 1 ? "application" : "applications"}` : null}
            />
            <QuickLink
              to="/saved"
              icon={<FaBookmark className="text-xs" />}
              label="View saved opportunities"
              value={savedJobs.length > 0 ? `${savedJobs.length} ${savedJobs.length === 1 ? "job" : "jobs"}` : null}
            />
            <QuickLink
              to="/explore"
              icon={<FaEye className="text-xs" />}
              label="Explore opportunities"
              value={recentlyViewed.length > 0 ? `${recentlyViewed.length} recently viewed` : null}
            />
            <QuickLink
              to="/companies"
              icon={<FaUsers className="text-xs" />}
              label="Followed companies"
              value={followedCompanies.length > 0 ? `${followedCompanies.length} ${followedCompanies.length === 1 ? "company" : "companies"}` : null}
            />
          </>
        )}
      </div>

      <div className="mt-5 rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:mt-6 sm:rounded-[26px] sm:p-5">
        <p className="text-sm font-medium">About</p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
          {isHiring
            ? "This account is used to post opportunities, manage listings, and connect with local talent in Lebanon."
            : account?.summary ||
"This profile helps opportunity posters understand your skills, city, CV, and what kind of work they are looking for."}
        </p>
      </div>
      {!isHiring && experiences.length > 0 && (
  <div className="mt-5 rounded-[24px] border border-neutral-100 bg-white p-4 sm:mt-6 sm:rounded-[26px] sm:p-5">
    <div>
      <p className="text-sm font-medium text-neutral-950">
        Experience
      </p>

      <p className="mt-1 text-xs leading-5 text-neutral-500">
        Professional, freelance, internship, and project experience.
      </p>
    </div>

    <div className="mt-5 space-y-5">
      {experiences.map((experience) => (
        <div
          key={experience.id}
          className="relative border-l-2 border-neutral-200 pl-4"
        >
          <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[var(--forsa-primary)]" />

          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-950">
                {experience.title || "Untitled position"}
              </h3>

              <p className="mt-1 text-sm text-neutral-600">
                {experience.company || "Company / Organization"}
              </p>
              {experience.employmentType && (
  <p className="mt-1 text-xs font-medium text-neutral-500">
    {experience.employmentType}
  </p>
)}
            </div>

            <p className="text-xs text-neutral-500">
              {experience.startDate || "Start date"}
              {" — "}
              {experience.current
                ? "Present"
                : experience.endDate || "End date"}
            </p>
          </div>

          {experience.location && (
  <p className="mt-2 text-xs text-neutral-500">
    {experience.location}
  </p>
)}

{(experience.skills || []).length > 0 && (
  <div className="mt-3 flex flex-wrap gap-2">
    {experience.skills.map((skill) => (
      <span
        key={`${experience.id}-${skill}`}
        className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
      >
        {skill}
      </span>
    ))}
  </div>
)}

{experience.description && (
  <p className="mt-3 text-sm leading-6 text-neutral-600">
    {experience.description}
  </p>
)}
        </div>
        
      ))}
    </div>
  </div>
)}

{account?.education?.institution && (
  <div className="mt-5 rounded-[24px] border border-neutral-100 bg-white p-4 sm:mt-6 sm:rounded-[26px] sm:p-5">
    <p className="text-sm font-medium text-neutral-950">
      Education
    </p>

    <div className="mt-4">
      <h3 className="text-sm font-semibold text-neutral-950">
        {account.education.institution}
      </h3>

      {account.education.degree && (
        <p className="mt-1 text-sm text-neutral-600">
          {account.education.degree}
        </p>
      )}

      {account.education.field && (
        <p className="mt-1 text-xs text-neutral-500">
          {account.education.field}
        </p>
      )}

      {account.education.graduationYear && (
        <p className="mt-2 text-xs text-neutral-500">
          Graduation: {account.education.graduationYear}
        </p>
      )}
    </div>
  </div>
)}
      {!isHiring && (
        
        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
          <InfoBox title="Skills" items={profile.skills} empty="No skills added yet." />
          <InfoBox title="Looking for" items={profile.lookingFor} empty="No opportunity type selected yet." />
          <CvBox cv={profile.cv} />
          <ApplicationsSentBox applications={seekerApplications} />
        </div>
      )}

      {!isHiring && (
  <div className="mt-5 rounded-[24px] border border-neutral-100 bg-white p-4 sm:mt-6 sm:rounded-[26px] sm:p-5">
    <div>
      <p className="text-sm font-semibold text-neutral-950">
        Career preferences
      </p>

      <p className="mt-1 text-xs leading-5 text-neutral-500">
        What kind of opportunity this person is looking for.
      </p>
    </div>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {account?.desiredRole && (
        <div>
          <p className="text-xs font-medium text-neutral-500">
            Desired role
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {account.desiredRole}
          </p>
        </div>
      )}

      {account?.opportunityType && (
        <div>
          <p className="text-xs font-medium text-neutral-500">
            Opportunity type
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {account.opportunityType}
          </p>
        </div>
      )}

      {account?.preferredLocation && (
        <div>
          <p className="text-xs font-medium text-neutral-500">
            Preferred location
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {account.preferredLocation}
          </p>
        </div>
      )}

      {account?.workPreference && (
        <div>
          <p className="text-xs font-medium text-neutral-500">
            Work preference
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {account.workPreference}
          </p>
        </div>
      )}
    </div>
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

function CompletionCard({ completionScore, level, signals = [], isHiring, onEdit }) {
  const missingCount = signals.filter((item) => !item.done).length;

  const supportingText = isHiring
    ? "Complete your hiring profile and post opportunities to attract better applicants."
    : missingCount === 0
    ? "Your profile is complete and ready for better matches."
    : `Add ${missingCount === 1 ? "the missing section" : `${missingCount} missing sections`} to help companies understand your profile.`;

  return (
    <div className="forsa-card mb-5 overflow-hidden rounded-[28px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm sm:mb-6 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Profile completion</p>
          <h3 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {completionScore}%
          </h3>
        </div>

        <div className="text-right">
          <span className="shrink-0 rounded-full forsa-button px-3 py-1 text-xs font-medium text-white sm:text-sm">
            {level}
          </span>
          <p className="mt-2 text-xs text-neutral-500">
            {isHiring ? "Company level" : "Profile level"}
          </p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--forsa-bg)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--forsa-primary),var(--forsa-glow))] transition-all duration-500"
          style={{ width: `${Math.min(100, completionScore)}%` }}
        />
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-600">{supportingText}</p>

      {signals.length > 0 && (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {signals.map((item) => (
            <CompletionSignal
              key={item.key || item.label}
              done={item.done}
              label={item.label}
              action={item.done ? undefined : item.action}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CompletionSignal({ done, label, action, onEdit }) {
  const actionIsLink = action && action.to;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 ${
        done ? "border border-[var(--forsa-border)] bg-white" : "bg-[var(--forsa-bg)]"
      }`}
    >
      <span
        className={`text-xs font-semibold ${
          done ? "text-neutral-700" : "text-neutral-500"
        }`}
      >
        {label}
      </span>

      {done ? (
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600">
          <FaCheckCircle className="text-[11px]" />
          Done
        </span>
      ) : actionIsLink ? (
        <Link
          to={action.to}
          className="forsa-click shrink-0 rounded-full border border-[var(--forsa-primary)]/25 bg-white px-3 py-1 text-xs font-medium text-[var(--forsa-primary)] transition hover:bg-[var(--forsa-primary)] hover:text-white"
        >
          Add
        </Link>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="forsa-click shrink-0 rounded-full border border-[var(--forsa-primary)]/25 bg-white px-3 py-1 text-xs font-medium text-[var(--forsa-primary)] transition hover:bg-[var(--forsa-primary)] hover:text-white"
        >
          Add
        </button>
      )}
    </div>
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
  setProfile,
  isHiring,
  updateAccount,
  handleCvUpload,
  handleCvView,
  removeCv,
  experiences,
  setExperiences,
}) {
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUploadError, setCvUploadError] = useState("");
  const cvFileInputRef = useRef(null);

  const [usernameDraft, setUsernameDraft] = useState(
    account?.username || ""
  );
  const [availability, setAvailability] = useState({
    for: "",
    available: false,
  });
  const [usernameSaving, setUsernameSaving] = useState(false);

  const usernameDraftLower = usernameDraft.trim().toLowerCase();
  const currentUsernameLower = String(
    account?.usernameLower || ""
  ).toLowerCase();
  const userDraftValid = /^[a-zA-Z0-9_]{3,20}$/.test(
    usernameDraftLower
  );
  const usernameUnchanged =
    userDraftValid &&
    usernameDraftLower === currentUsernameLower;

  useEffect(() => {
    if (!userDraftValid || usernameUnchanged) {
      return undefined;
    }

    let stale = false;

    const timer = setTimeout(async () => {
      let available;

      try {
        available =
          (await checkUsernameAvailable(
            usernameDraftLower
          )) === true;
      } catch {
        available = false;
      }

      if (!stale) {
        setAvailability({
          for: usernameDraftLower,
          available,
        });
      }
    }, 400);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [usernameDraftLower, userDraftValid, usernameUnchanged]);

  const checkedFor = availability.for === usernameDraftLower;
  const isCheckedAvailable = checkedFor && availability.available;
  const isCheckedTaken = checkedFor && !availability.available;

  const handleUsernameSave = async () => {
    if (usernameUnchanged) {
      showToast("Username is already set.");
      return;
    }

    if (!userDraftValid || !isCheckedAvailable) {
      showToast("Choose an available username.", "error");
      return;
    }

    setUsernameSaving(true);

    try {
      const next = await changeUsername(usernameDraft.trim());

      updateAccount("username", next.username);
      updateAccount("usernameLower", next.usernameLower);

      setUsernameDraft(next.username);
      setAvailability({ for: "", available: false });

      showToast("Username updated");
    } catch (error) {
      console.error("Username update error:", error);

      if (error.message === "USERNAME_TAKEN") {
        showToast("That username is already taken.", "error");
      } else {
        showToast(
          error.message || "Could not update username.",
          "error"
        );
      }
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleCvFileSelect = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || cvUploading) {
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      /\.pdf$/i.test(file.name);

    if (!isPdf) {
      setCvUploadError("Only PDF files are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCvUploadError("Your CV must be 5 MB or smaller.");
      return;
    }

    setCvUploading(true);
    setCvUploadError("");

    try {
      const { uploadUrl, objectKey } = await requestCvUpload(
        file.name,
        file.size
      );

      await uploadCvToR2(uploadUrl, file);

      await handleCvUpload({
        name: file.name,
        type: "pdf",
        storage: "r2",
        objectKey,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("CV upload failed:", error);
      setCvUploadError(
        error.message || "Could not upload your CV. Please try again."
      );
    } finally {
      setCvUploading(false);
    }
  };

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
  <div className="grid gap-5 sm:grid-cols-2">
    <Field
      label="Full name"
      value={account.name}
      onChange={(value) => updateAccount("name", value)}
    />

    <Field
      label="Username"
      value={usernameDraft}
      onChange={(value) => setUsernameDraft(value)}
      placeholder="yourusername"
    />

    <Field
      label="Email address"
      value={account.email}
      onChange={(value) => updateAccount("email", value)}
    />

    <Field
      label="City"
      value={account.city}
      onChange={(value) => updateAccount("city", value)}
    />

    <Field
      label="Professional headline"
      value={account.headline || ""}
      onChange={(value) => updateAccount("headline", value)}
      placeholder="e.g. Frontend Developer · CS Student"
    />
  </div>

  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
    <p
      className={`text-xs ${
        isCheckedTaken || !userDraftValid
          ? "text-red-600"
          : isCheckedAvailable
            ? "text-emerald-600"
            : "text-neutral-500"
      }`}
    >
      {!userDraftValid
        ? "3-20 characters: letters, numbers, and underscores."
        : usernameUnchanged
          ? "Your public @username. Shown to companies and other seekers."
          : isCheckedAvailable
            ? `@${usernameDraftLower} is available.`
            : isCheckedTaken
              ? "That username is already taken."
              : "Checking availability..."}
    </p>

    <button
      type="button"
      onClick={handleUsernameSave}
      disabled={
        usernameSaving ||
        !isCheckedAvailable
      }
      className="rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {usernameSaving ? "Saving..." : "Save username"}
    </button>
  </div>

  <div className="mt-6 rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
    <div>
      <h3 className="text-sm font-bold text-neutral-950">
        Professional summary
      </h3>

      <p className="mt-1 text-xs leading-5 text-neutral-500">
        Give companies a quick overview of who you are, what you can do,
        and what kind of opportunity you're looking for.
      </p>
    </div>

    <textarea
      value={account.summary || ""}
      onChange={(e) => updateAccount("summary", e.target.value)}
      placeholder="Tell companies about your background, skills, interests, and career goals..."
      rows={5}
      className="mt-4 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[var(--forsa-primary)] focus:ring-2 focus:ring-[var(--forsa-primary)]/10"
    />
  </div>

  <div className="mt-6 rounded-[24px] border border-neutral-100 bg-white p-4 sm:rounded-[26px] sm:p-5">
    <div>
      <h3 className="text-sm font-bold text-neutral-950">
        Education
      </h3>

      <p className="mt-1 text-xs leading-5 text-neutral-500">
        Add your current or previous education.
      </p>
    </div>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Field
        label="Institution"
        value={account.education?.institution || ""}
        onChange={(value) =>
          updateAccount("education", {
            ...account.education,
            institution: value,
          })
        }
        placeholder="e.g. CIS College"
      />

      <Field
        label="Degree / Program"
        value={account.education?.degree || ""}
        onChange={(value) =>
          updateAccount("education", {
            ...account.education,
            degree: value,
          })
        }
        placeholder="e.g. TS — MIS"
      />

      <Field
        label="Field of study"
        value={account.education?.field || ""}
        onChange={(value) =>
          updateAccount("education", {
            ...account.education,
            field: value,
          })
        }
        placeholder="e.g. Management Information Systems"
      />

      <Field
        label="Graduation year"
        value={account.education?.graduationYear || ""}
        onChange={(value) =>
          updateAccount("education", {
            ...account.education,
            graduationYear: value,
          })
        }
        placeholder="e.g. 2026"
      />

      <Field
        label="Location"
        value={account.education?.location || ""}
        onChange={(value) =>
          updateAccount("education", {
            ...account.education,
            location: value,
          })
        }
        placeholder="e.g. Beirut, Lebanon"
      />
    </div>
  </div>

  <div className="mt-6 rounded-[24px] border border-neutral-100 bg-white p-4 sm:rounded-[26px] sm:p-5">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h3 className="text-sm font-bold text-neutral-950">
        Experience
      </h3>

      <p className="mt-1 text-xs leading-5 text-neutral-500">
        Add your work, internship, freelance, or project experience.
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
        setExperiences((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            title: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
            employmentType: "",
            skills: [],
          },
        ]);
      }}
      className="forsa-click inline-flex w-full items-center justify-center rounded-full forsa-button px-4 py-2.5 text-sm font-medium text-white sm:w-fit"
    >
      + Add experience
    </button>
  </div>

  {experiences.length === 0 ? (
    <div className="mt-5 rounded-2xl bg-[var(--forsa-bg)] p-5 text-center">
      <p className="text-sm font-medium text-neutral-800">
        No experience added yet.
      </p>

      <p className="mt-1 text-xs leading-5 text-neutral-500">
        Add internships, jobs, freelance work, or relevant projects.
      </p>
    </div>
  ) : (
    <div className="mt-5 space-y-4">
      {experiences.map((experience) => (
        <div
  key={experience.id}
  className="rounded-2xl border border-neutral-200 bg-[var(--forsa-bg)] p-4"
>
  <div className="grid gap-4 sm:grid-cols-2">
    <Field
      label="Job title"
      value={experience.title}
      onChange={(value) => {
        setExperiences((prev) =>
          prev.map((item) =>
            item.id === experience.id
              ? { ...item, title: value }
              : item
          )
        );
      }}
      placeholder="e.g. Frontend Developer Intern"
    />

    <div>
  <label className="text-sm font-medium text-neutral-900">
    Employment type
  </label>

  <select
    value={experience.employmentType || ""}
    onChange={(e) => {
      const value = e.target.value;

      setExperiences((prev) =>
        prev.map((item) =>
          item.id === experience.id
            ? { ...item, employmentType: value }
            : item
        )
      );
    }}
    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-[var(--forsa-primary)] focus:ring-2 focus:ring-[var(--forsa-primary)]/10"
  >
    <option value="">Select type</option>
    <option value="Full-time">Full-time</option>
    <option value="Part-time">Part-time</option>
    <option value="Internship">Internship</option>
    <option value="Freelance">Freelance</option>
    <option value="Contract">Contract</option>
    <option value="Volunteer">Volunteer</option>
    <option value="Self-employed">Self-employed</option>
  </select>
</div>

    <Field
      label="Company / Organization"
      value={experience.company}
      onChange={(value) => {
        setExperiences((prev) =>
          prev.map((item) =>
            item.id === experience.id
              ? { ...item, company: value }
              : item
          )
        );
      }}
      placeholder="e.g. Vanrise Solutions"
    />

    <Field
      label="Location"
      value={experience.location}
      onChange={(value) => {
        setExperiences((prev) =>
          prev.map((item) =>
            item.id === experience.id
              ? { ...item, location: value }
              : item
          )
        );
      }}
      placeholder="e.g. Beirut"
    />

    <Field
      label="Start date"
      value={experience.startDate}
      onChange={(value) => {
        setExperiences((prev) =>
          prev.map((item) =>
            item.id === experience.id
              ? { ...item, startDate: value }
              : item
          )
        );
      }}
      placeholder="e.g. June 2025"
    />

    {!experience.current && (
      <Field
        label="End date"
        value={experience.endDate}
        onChange={(value) => {
          setExperiences((prev) =>
            prev.map((item) =>
              item.id === experience.id
                ? { ...item, endDate: value }
                : item
            )
          );
        }}
        placeholder="e.g. August 2025"
      />
    )}
  </div>

  <label className="mt-4 flex items-center gap-2 text-sm text-neutral-700">
    <input
      type="checkbox"
      checked={experience.current}
      onChange={(e) => {
        setExperiences((prev) =>
          prev.map((item) =>
            item.id === experience.id
              ? {
                  ...item,
                  current: e.target.checked,
                  endDate: e.target.checked ? "" : item.endDate,
                }
              : item
          )
        );
      }}
      className="h-4 w-4 rounded border-neutral-300"
    />

    I currently work here
  </label>
  <div className="mt-4">
  <label className="text-sm font-medium text-neutral-900">
    Skills used
  </label>

  <p className="mt-1 text-xs leading-5 text-neutral-500">
    Add the technologies or skills you used in this experience.
  </p>

  <div className="mt-3 flex flex-wrap gap-2">
    {(experience.skills || []).map((skill) => (
      <span
        key={skill}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700"
      >
        {skill}

        <button
          type="button"
          onClick={() => {
            setExperiences((prev) =>
              prev.map((item) =>
                item.id === experience.id
                  ? {
                      ...item,
                      skills: (item.skills || []).filter(
                        (value) => value !== skill
                      ),
                    }
                  : item
              )
            );
          }}
          className="text-neutral-400 transition hover:text-red-500"
          aria-label={`Remove ${skill}`}
        >
          ×
        </button>
      </span>
    ))}
  </div>

  <div className="mt-3 flex gap-2">
    <input
      type="text"
      placeholder="e.g. React"
      className="min-w-0 flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[var(--forsa-primary)] focus:ring-2 focus:ring-[var(--forsa-primary)]/10"
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;

        e.preventDefault();

        const value = e.currentTarget.value.trim();

        if (!value) return;

        setExperiences((prev) =>
          prev.map((item) => {
            if (item.id !== experience.id) return item;

            const currentSkills = item.skills || [];

            if (
              currentSkills.some(
                (skill) => skill.toLowerCase() === value.toLowerCase()
              )
            ) {
              return item;
            }

            return {
              ...item,
              skills: [...currentSkills, value],
            };
          })
        );

        e.currentTarget.value = "";
      }}
    />

    <button
      type="button"
      onClick={(e) => {
        const input = e.currentTarget.previousElementSibling;
        const value = input?.value.trim();

        if (!value) return;

        setExperiences((prev) =>
          prev.map((item) => {
            if (item.id !== experience.id) return item;

            const currentSkills = item.skills || [];

            if (
              currentSkills.some(
                (skill) => skill.toLowerCase() === value.toLowerCase()
              )
            ) {
              return item;
            }

            return {
              ...item,
              skills: [...currentSkills, value],
            };
          })
        );

        if (input) input.value = "";
      }}
      className="shrink-0 rounded-full border border-neutral-300 bg-white px-4 py-3 text-sm font-medium transition hover:border-neutral-500"
    >
      Add
    </button>
  </div>
</div>

  <div className="mt-4">
    <label className="text-sm font-medium text-neutral-900">
      Description
    </label>

    <textarea
      value={experience.description}
      onChange={(e) => {
        const value = e.target.value;

        setExperiences((prev) =>
          prev.map((item) =>
            item.id === experience.id
              ? { ...item, description: value }
              : item
          )
        );
      }}
      placeholder="Describe what you did, what you built, and what you learned..."
      rows={4}
      className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[var(--forsa-primary)] focus:ring-2 focus:ring-[var(--forsa-primary)]/10"
    />
  </div>

  <div className="mt-4 flex justify-end">
    <button
      type="button"
      onClick={() => {
        setExperiences((prev) =>
          prev.filter((item) => item.id !== experience.id)
        );
      }}
      className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-600 transition hover:border-red-300"
    >
      Delete experience
    </button>
  </div>
</div>
      ))}
    </div>
  )}
</div>

  <div className="mt-6 rounded-[24px] border border-neutral-100 bg-white p-4 sm:rounded-[26px] sm:p-5">
  <div>
    <h3 className="text-sm font-bold text-neutral-950">
      CV / Resume
    </h3>

    <p className="mt-1 text-xs leading-5 text-neutral-500">
      Upload your CV as a PDF. PDFs only, up to 5 MB.
    </p>
  </div>

  <div className="mt-4">
    {profile?.cv ? (
    <div className="flex flex-col gap-3 rounded-2xl bg-[var(--forsa-bg)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-900">
          {profile.cv.name || "CV / Resume link"}
        </p>

        <p className="mt-1 text-xs text-neutral-500">
          {profile.cv.size
            ? `${(profile.cv.size / 1024 / 1024).toFixed(2)} MB · PDF`
            : "CV saved"}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={handleCvView}
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium transition hover:border-neutral-500"
        >
          View
        </button>

        <button
          type="button"
          onClick={() => cvFileInputRef.current?.click()}
          disabled={cvUploading}
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium transition hover:border-neutral-500 disabled:cursor-wait disabled:opacity-60"
        >
          {cvUploading ? "Uploading…" : "Replace"}
        </button>

        <button
          type="button"
          onClick={removeCv}
          className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-600 transition hover:border-red-300"
        >
          Remove
        </button>
      </div>
    </div>
    ) : (
      <button
        type="button"
        onClick={() => cvFileInputRef.current?.click()}
        disabled={cvUploading}
        className="mt-3 w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium transition hover:border-neutral-500 disabled:cursor-wait disabled:opacity-60"
      >
        {cvUploading ? "Uploading…" : "Upload CV (PDF)"}
      </button>
    )}

    <input
      ref={cvFileInputRef}
      type="file"
      accept="application/pdf,.pdf"
      className="hidden"
      onChange={handleCvFileSelect}
    />

    {cvUploadError && (
      <p className="mt-2 text-xs font-medium text-red-600" role="alert">
        {cvUploadError}
      </p>
    )}
  </div>
</div>

  <div className="mt-6 rounded-[24px] border border-neutral-100 bg-white p-4 sm:rounded-[26px] sm:p-5">
  <div>
    <h3 className="text-sm font-bold text-neutral-950">
      Skills
    </h3>

    <p className="mt-1 text-xs leading-5 text-neutral-500">
      Add the skills and technologies you want companies to discover.
    </p>
  </div>

  <div className="mt-4">
    {/* Existing skills */}
    <div className="flex flex-wrap gap-2">
      {(profile.skills || []).map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-[var(--forsa-bg)] px-3 py-2 text-sm font-medium text-neutral-800"
        >
          {skill}

          <button
            type="button"
            onClick={() => {
              setProfile((prev) => ({
                ...prev,
                skills: (prev.skills || []).filter(
                  (item) => item !== skill
                ),
              }));
            }}
            className="text-neutral-400 transition hover:text-red-500"
            aria-label={`Remove ${skill}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>

    {/* Add skill */}
    <div className="mt-4 flex gap-2">
      <input
        type="text"
        id="profile-skill-input"
        placeholder="e.g. React"
        className="min-w-0 flex-1 rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forsa-green)]"
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;

          e.preventDefault();

          const value = e.currentTarget.value.trim();

          if (!value) return;

          setProfile((prev) => {
            const currentSkills = prev.skills || [];

            const alreadyExists = currentSkills.some(
              (skill) =>
                skill.toLowerCase() === value.toLowerCase()
            );

            if (alreadyExists) {
              return prev;
            }

            return {
              ...prev,
              skills: [...currentSkills, value],
            };
          });

          e.currentTarget.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => {
          const input = document.getElementById(
            "profile-skill-input"
          );

          const value = input?.value.trim();

          if (!value) return;

          setProfile((prev) => {
            const currentSkills = prev.skills || [];

            const alreadyExists = currentSkills.some(
              (skill) =>
                skill.toLowerCase() === value.toLowerCase()
            );

            if (alreadyExists) {
              return prev;
            }

            return {
              ...prev,
              skills: [...currentSkills, value],
            };
          });

          if (input) {
            input.value = "";
            input.focus();
          }
        }}
        className="shrink-0 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium transition hover:border-neutral-500"
      >
        Add
      </button>
    </div>

    <p className="mt-2 text-xs text-neutral-400">
      Press Enter or click Add to add each skill.
    </p>
  </div>
</div>

  <div className="mt-6 rounded-[24px] border border-neutral-100 bg-white p-4 sm:rounded-[26px] sm:p-5">
    <div>
      <h3 className="text-sm font-bold text-neutral-950">
        Career preferences
      </h3>

      <p className="mt-1 text-xs leading-5 text-neutral-500">
        Tell Forsa what kind of opportunity you're looking for.
      </p>
    </div>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Field
        label="Desired role"
        value={account.desiredRole || ""}
        onChange={(value) => updateAccount("desiredRole", value)}
        placeholder="e.g. Frontend Developer"
      />

      <Field
        label="Opportunity type"
        value={account.opportunityType || ""}
        onChange={(value) => updateAccount("opportunityType", value)}
        placeholder="e.g. Internship / Junior"
      />

      <Field
        label="Preferred location"
        value={account.preferredLocation || ""}
        onChange={(value) =>
          updateAccount("preferredLocation", value)
        }
        placeholder="e.g. Beirut"
      />

      <Field
        label="Work preference"
        value={account.workPreference || ""}
        onChange={(value) => updateAccount("workPreference", value)}
        placeholder="e.g. On-site / Hybrid / Remote"
      />
    </div>
  </div>
</>

      )}
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

function SettingsTab({
  logout,
  loggingOut,
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

        <button onClick={logout} disabled={loggingOut} className="forsa-click mt-5 w-full rounded-full forsa-button px-5 py-3 text-sm font-medium text-white sm:w-fit disabled:cursor-not-allowed disabled:opacity-60">
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>

      <div className="rounded-[24px] bg-[#fff5f5] p-4 sm:rounded-[26px] sm:p-5 md:col-span-2">
        <p className="font-medium text-red-700">Danger zone</p>
        <p className="mt-2 text-sm leading-6 text-red-600">
          Permanently deletes your account, your posted opportunities, and your saved local data. This action cannot be undone.
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
  const openCv = () => {
    if (cv?.url) {
      window.open(cv.url, "_blank", "noopener,noreferrer");
      return;
    }

    if (cv?.storage === "r2" && cv.objectKey) {
      requestCvView(cv.objectKey)
        .then(({ viewUrl }) => {
          window.open(viewUrl, "_blank", "noopener,noreferrer");
        })
        .catch((error) => {
          console.error("CV view failed:", error);
          showToast("Could not open this CV.", "error");
        });
    }
  };

  return (
    <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4 sm:rounded-[26px] sm:p-5">
      <p className="text-sm text-neutral-500">CV</p>

      {cv ? (
        <div className="mt-4 rounded-2xl bg-white p-4">
          <p className="truncate font-medium">{cv.name || "CV / Resume link"}</p>

          {cv.size ? (
            <p className="mt-1 text-sm text-neutral-500">
              {(cv.size / 1024 / 1024).toFixed(2)} MB · PDF
            </p>
          ) : null}

          <button
            type="button"
            onClick={openCv}
            className="mt-3 inline-flex items-center gap-2 rounded-full forsa-button px-4 py-2 text-xs font-medium text-white"
          >
            <FaExternalLinkAlt className="text-[10px]" />
            Open CV
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">No CV added yet.</p>
      )}
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

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forsa-green)]"
      />
    </div>
  );
}

function InfoBox({ title, items, empty }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div>
      <div>{title}</div>

      <div className="mt-4 flex flex-wrap gap-2">
        {safeItems.length > 0 ? (
          safeItems.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white px-3 py-1.5 text-sm"
            >
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