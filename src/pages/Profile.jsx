import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
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

export default function Profile() {
  const navigate = useNavigate();

  const savedAccount = safeJson("forsaAccount", null);
  const savedProfile = safeJson("forsaProfile", {
    skills: [],
    lookingFor: [],
    cv: null,
  });

  const [account, setAccount] = useState(savedAccount);
  const [profile, setProfile] = useState(savedProfile);
  const [posts, setPosts] = useState(safeJson("forsaPosts", []));
  const [savedJobs, setSavedJobs] = useState(safeJson("forsaSavedJobs", []));
  const [messages, setMessages] = useState(safeJson("forsaMessages", []));
  const [selectedApplicantsPost, setSelectedApplicantsPost] = useState(null);
  const [tab, setTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  if (!account) {
    return (
      <section>
        <AppHeader />

        <div className="mx-auto max-w-3xl px-5 py-14 pb-28 sm:px-6 sm:py-20">
          <div className="rounded-[28px] border border-neutral-200 bg-white p-6 text-center shadow-sm sm:rounded-[32px] sm:p-8">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Create your Forsa profile first.
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
              Your profile will show your city, skills, CV, saved jobs, posts,
              and messages.
            </p>

            <Link
              to="/auth"
              className="mt-7 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const isHiring = account.accountType === "hiring";
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
          Boolean(profile.cv),
        ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  };

  const completionScore = getProfileCompletion();

  const updateApplicantStatus = (threadId, status) => {
    const updatedMessages = messages.map((thread) =>
      thread.id === threadId ? { ...thread, status } : thread
    );

    setMessages(updatedMessages);
    localStorage.setItem("forsaMessages", JSON.stringify(updatedMessages));

    const thread = messages.find((item) => item.id === threadId);
    const notifications = safeJson("forsaNotifications", []);

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

  const handleCvUpload = (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF CV only.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("CV must be less than 5MB.");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      cv: {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      },
    }));
  };

  const removeCv = () => {
    setProfile((prev) => ({ ...prev, cv: null }));
  };

  const saveChanges = () => {
    localStorage.setItem("forsaAccount", JSON.stringify(account));
    localStorage.setItem("forsaProfile", JSON.stringify(profile));
    setIsEditing(false);
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
  };

  const deletePost = (postId) => {
    const confirmed = window.confirm("Delete this opportunity?");
    if (!confirmed) return;

    const updatedPosts = posts.filter((post) => post.id !== postId);
    setPosts(updatedPosts);
    localStorage.setItem("forsaPosts", JSON.stringify(updatedPosts));
  };

  const togglePostStatus = (postId) => {
    const updatedPosts = posts.map((post) =>
      post.id === postId
        ? { ...post, status: post.status === "closed" ? "active" : "closed" }
        : post
    );

    setPosts(updatedPosts);
    localStorage.setItem("forsaPosts", JSON.stringify(updatedPosts));
  };

  const startEditPost = (post) => {
    setEditingPostId(post.id);
    setEditingPost({ ...post });
  };

  const updateEditingPost = (field, value) => {
    setEditingPost((prev) => ({ ...prev, [field]: value }));
  };

  const savePostEdit = () => {
    const updatedPosts = posts.map((post) =>
      post.id === editingPostId ? { ...post, ...editingPost } : post
    );

    setPosts(updatedPosts);
    localStorage.setItem("forsaPosts", JSON.stringify(updatedPosts));
    setEditingPostId(null);
    setEditingPost(null);
  };

  const cancelPostEdit = () => {
    setEditingPostId(null);
    setEditingPost(null);
  };

  const logout = () => {
    navigate("/auth");
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

    navigate("/auth");
  };

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-5 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:mt-8 sm:rounded-[36px] sm:p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-lg font-semibold text-white sm:h-16 sm:w-16 sm:text-xl">
                {initial}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="max-w-full truncate text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                    {account.name}
                  </h1>

                  <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs text-neutral-600">
                    {isHiring ? "Hiring account" : "Looking for work"}
                  </span>
                </div>

                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500 sm:text-base">
                  <FaMapMarkerAlt className="text-xs" />
                  <span>{account.city}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="break-all">{account.email}</span>
                </p>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium transition hover:border-neutral-500 sm:w-fit"
              >
                <FaEdit className="text-xs" />
                Edit profile
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  onClick={cancelEdit}
                  className="rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium transition hover:border-neutral-500"
                >
                  Cancel
                </button>

                <button
                  onClick={saveChanges}
                  className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Save changes
                </button>
              </div>
            )}
          </div>

          <div className="-mx-1 mt-7 flex gap-2 overflow-x-auto border-b border-neutral-200 px-1 pb-4">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<FaUser />}>
              Overview
            </TabButton>

            {isHiring ? (
              <TabButton active={tab === "posts"} onClick={() => setTab("posts")} icon={<FaBriefcase />}>
                My posts
              </TabButton>
            ) : (
              <TabButton active={tab === "saved"} onClick={() => setTab("saved")} icon={<FaBookmark />}>
                Saved jobs
              </TabButton>
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
              handleCvUpload={handleCvUpload}
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
                />
              )}

              {tab === "posts" && isHiring && (
                <PostsTab
                  posts={posts}
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

              {tab === "saved" && !isHiring && (
                <SavedJobsTab jobs={savedJobs} removeSavedJob={removeSavedJob} />
              )}

              {tab === "settings" && (
                <SettingsTab logout={logout} resetDemoAccount={resetDemoAccount} />
              )}
            </>
          )}
        </div>
      </div>

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

function OverviewTab({ isHiring, profile, posts, savedJobs, completionScore }) {
  return (
    <div className="mt-6 sm:mt-8">
      <CompletionCard completionScore={completionScore} isHiring={isHiring} />

      <CompletionTips isHiring={isHiring} profile={profile} posts={posts} />

      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <StatCard
          label={isHiring ? "Active posts" : "Saved jobs"}
          value={isHiring ? posts.length : savedJobs.length}
        />
        <StatCard
          label={isHiring ? "Account type" : "Skills"}
          value={isHiring ? "Hiring" : profile.skills.length}
        />
        <StatCard
          label={isHiring ? "Visibility" : "Looking for"}
          value={isHiring ? "Public" : profile.lookingFor.length}
        />
      </div>

      <div className="mt-5 rounded-[24px] bg-[#f7f7f5] p-4 sm:mt-6 sm:rounded-[28px] sm:p-5">
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
        </div>
      )}

      {isHiring && (
        <div className="mt-5 rounded-[24px] bg-[#f7f7f5] p-4 sm:mt-6 sm:rounded-[28px] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Post a new opportunity</p>
              <p className="mt-1 text-sm text-neutral-600">
                Add a clear job, gig, internship, or local project.
              </p>
            </div>

            <Link
              to="/post"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white sm:w-fit"
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

function CompletionCard({ completionScore, isHiring }) {
  return (
    <div className="mb-5 rounded-[24px] bg-black p-4 text-white sm:mb-6 sm:rounded-[28px] sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-neutral-300 sm:text-sm">Profile completion</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
            {completionScore}% complete
          </h3>
        </div>

        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-black sm:text-sm">
          {completionScore >= 80 ? "Strong" : completionScore >= 50 ? "Good start" : "Needs work"}
        </span>
      </div>

      <div className="mt-5 h-2 rounded-full bg-white/15">
        <div className="h-2 rounded-full bg-white transition-all" style={{ width: `${completionScore}%` }} />
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-300">
        {isHiring
          ? "Complete your hiring profile and post opportunities to attract better applicants."
          : "Add your skills, goals, and CV to get better matches and stronger applications."}
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
        !profile.cv && "Upload a PDF CV.",
      ].filter(Boolean);

  if (tips.length === 0) return null;

  return (
    <div className="mb-5 rounded-[24px] border border-neutral-200 bg-white p-4 sm:mb-6 sm:rounded-[28px] sm:p-5">
      <p className="text-sm font-medium">Recommended next steps</p>

      <div className="mt-4 grid gap-2">
        {tips.map((tip) => (
          <div key={tip} className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-neutral-700">
            {tip}
          </div>
        ))}
      </div>
    </div>
  );
}

function PostsTab({
  posts,
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
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Your posted opportunities
          </h2>
        </div>

        <Link
          to="/post"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white sm:w-fit"
        >
          <FaPlus className="text-xs" />
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-[#f7f7f5] p-6 text-center sm:rounded-[28px] sm:p-8">
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
    <div className="rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
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
            className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-black"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button onClick={cancelPostEdit} className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium">
          Cancel
        </button>
        <button onClick={savePostEdit} className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
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
}) {
  const applicantsCount = getApplicantsCount(post.id);

  return (
    <div className="rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold">{post.title}</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {post.location} · {post.pay}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs">{post.type}</span>

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
        {(post.tags || []).slice(0, 6).map((tag) => (
          <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Applicants</p>
            <p className="mt-1 text-xs text-neutral-500">
              {applicantsCount} application{applicantsCount === 1 ? "" : "s"} received
            </p>
          </div>

          <button
            onClick={() => openApplicants(post)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white sm:w-fit"
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

function SavedJobsTab({ jobs, removeSavedJob }) {
  return (
    <div className="mt-6 sm:mt-8">
      <p className="text-sm font-medium text-neutral-500">Saved jobs</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
        Opportunities you liked
      </h2>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-[#f7f7f5] p-6 text-center sm:rounded-[28px] sm:p-8">
          <p className="text-xl font-semibold">No saved jobs yet.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
            Save opportunities from Explore and they will appear here.
          </p>

          <Link
            to="/explore"
            className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Explore opportunities
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
              <h3 className="font-semibold">{job.title}</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {job.company} · {job.location}
              </p>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">
                {job.description}
              </p>

              <button
                onClick={() => removeSavedJob(job.id)}
                className="mt-5 w-full rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 sm:w-fit"
              >
                Remove saved
              </button>
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
  handleCvUpload,
  removeCv,
}) {
  return (
    <div className="mt-6 sm:mt-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name / business name" value={account.name} onChange={(value) => updateAccount("name", value)} />
        <Field label="Email" value={account.email} onChange={(value) => updateAccount("email", value)} />
        <Field label="City" value={account.city} onChange={(value) => updateAccount("city", value)} />
      </div>

      {!isHiring && (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <EditBox title="Your skills" options={skillOptions} selected={profile.skills} onToggle={(item) => toggleProfileItem("skills", item)} />
            <EditBox title="Looking for" options={lookingOptions} selected={profile.lookingFor} onToggle={(item) => toggleProfileItem("lookingFor", item)} />
          </div>

          <div className="mt-6 rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
            <p className="font-medium">CV / Resume</p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              MVP mode stores file metadata only. Later Firebase Storage will upload the real PDF.
            </p>

            {profile.cv ? (
              <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium">{profile.cv.name}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {(profile.cv.size / 1024 / 1024).toFixed(2)} MB · PDF
                  </p>
                </div>

                <button onClick={removeCv} className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600">
                  Remove CV
                </button>
              </div>
            ) : (
              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center">
                <FaFileAlt />
                <span className="mt-3 text-sm font-medium">Upload PDF CV</span>
                <span className="mt-1 text-xs text-neutral-500">Max 5MB</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleCvUpload(e.target.files?.[0])} />
              </label>
            )}
          </div>
        </>
      )}

      {isHiring && (
        <div className="mt-6 rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
          <p className="font-medium">Hiring profile</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Hiring accounts can edit business name, city, email, and manage posts from the My posts tab.
          </p>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ logout, resetDemoAccount }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
        <p className="font-medium">Session</p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Login/logout is simulated with localStorage for now.
        </p>

        <button onClick={logout} className="mt-5 w-full rounded-full bg-black px-5 py-3 text-sm font-medium text-white sm:w-fit">
          Log out
        </button>
      </div>

      <div className="rounded-[24px] bg-[#fff5f5] p-4 sm:rounded-[28px] sm:p-5">
        <p className="font-medium text-red-700">Danger zone</p>
        <p className="mt-2 text-sm leading-6 text-red-600">
          Reset this demo account and remove saved local data.
        </p>

        <button onClick={resetDemoAccount} className="mt-5 w-full rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-medium text-red-600 sm:w-fit">
          Reset demo account
        </button>
      </div>
    </div>
  );
}

function CvBox({ cv }) {
  return (
    <div className="rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
      <p className="text-sm text-neutral-500">CV</p>

      {cv ? (
        <div className="mt-4 rounded-2xl bg-white p-4">
          <p className="truncate font-medium">{cv.name}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {(cv.size / 1024 / 1024).toFixed(2)} MB · PDF
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">No CV uploaded yet.</p>
      )}
    </div>
  );
}

function ApplicantsModal({ post, applicants, onClose, onStatusChange, onOpenMessage }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-0">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[28px] bg-white p-4 shadow-xl sm:rounded-[32px] sm:p-6">
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

          <button onClick={onClose} className="shrink-0 rounded-full bg-[#f7f7f5] px-4 py-2 text-sm font-medium">
            Close
          </button>
        </div>

        {applicants.length === 0 ? (
          <div className="mt-6 rounded-[24px] bg-[#f7f7f5] p-6 text-center sm:rounded-[28px] sm:p-8">
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
    <div className="rounded-[24px] border border-neutral-200 bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
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
              ? "bg-black text-white"
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
          className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
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
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? "bg-black text-white" : "bg-[#f7f7f5] text-neutral-600 hover:bg-white"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
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
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
      />
    </div>
  );
}

function EditBox({ title, options, selected, onToggle }) {
  return (
    <div className="rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
      <p className="text-sm font-medium">{title}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((item) => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              selected.includes(item)
                ? "border-black bg-black text-white"
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
    <div className="rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
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
