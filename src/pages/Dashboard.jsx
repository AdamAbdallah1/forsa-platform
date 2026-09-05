import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import AppHeader from "../components/AppHeader";
import Button from "../components/ui/Button";
import {
  FaPlus,
  FaBriefcase,
  FaEye,
  FaPaperPlane,
  FaBookmark,
  FaShareAlt,
  FaPercent,
  FaBullseye,
  FaFlag,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getCompanyAnalytics } from "../lib/analyticsService";
import {
  getPostsByOwner,
  updatePost,
  deletePost as deletePostFromFirestore,
} from "../lib/postService";

const formatNumber = (value) => Number(value || 0).toLocaleString();

function AnalyticsMetric({ icon, label, value, danger = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
        danger
          ? "border-red-200 bg-red-50/50"
          : "border-[var(--forsa-border)] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wider ${
              danger ? "text-red-600" : "text-neutral-500"
            }`}
          >
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm ${
            danger
              ? "bg-red-100 text-red-600"
              : "bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniAnalytics({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-3 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-neutral-900">{value}</p>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-900">{label}</label>

      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forsa-primary)]"
      />
    </div>
  );
}

function EditOpportunityCard({
  editingPost,
  editingError,
  saving,
  updateEditingPost,
  onSave,
  onCancel,
}) {
  if (!editingPost) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 sm:p-6">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-2xl rounded-3xl border border-[var(--forsa-border)] bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--forsa-border)] px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--forsa-primary)]">
                Opportunity management
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
                Edit Opportunity
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Update this listing without leaving the dashboard.
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close editor"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid gap-4">
              <EditField
                label="Title"
                value={editingPost.title}
                onChange={(value) => updateEditingPost("title", value)}
              />

              <EditField
                label="Location"
                value={editingPost.location}
                onChange={(value) => updateEditingPost("location", value)}
              />

              <EditField
                label="Pay"
                value={editingPost.pay}
                onChange={(value) => updateEditingPost("pay", value)}
              />

              <EditField
                label="Contact"
                value={editingPost.contact}
                onChange={(value) => updateEditingPost("contact", value)}
              />

              <div>
                <label className="text-sm font-medium text-neutral-900">
                  Application deadline
                </label>

                <input
                  type="date"
                  value={editingPost.deadline || ""}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(event) =>
                    updateEditingPost("deadline", event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forsa-primary)]"
                />

                <p className="mt-2 text-xs text-neutral-500">
                  Optional. Applications will close after this date.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-900">
                  Application destination
                </label>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateEditingPost("applicationMethod", "forsa")
                    }
                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      (editingPost.applicationMethod || "forsa") === "forsa"
                        ? "border-[var(--forsa-primary)] bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    Apply on Forsa
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateEditingPost("applicationMethod", "external")
                    }
                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      editingPost.applicationMethod === "external"
                        ? "border-[var(--forsa-primary)] bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    Apply externally ↗
                  </button>
                </div>

                {editingPost.applicationMethod === "external" && (
                  <div className="mt-3">
                    <EditField
                      label="Application URL"
                      value={editingPost.applicationUrl}
                      onChange={(value) =>
                        updateEditingPost("applicationUrl", value)
                      }
                      placeholder="https://company.com/careers/job..."
                    />

                    <p className="mt-2 text-xs text-neutral-500">
                      Applicants will leave Forsa and continue on the
                      company’s application page.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-900">
                  Description
                </label>

                <textarea
                  value={editingPost.description || ""}
                  onChange={(event) =>
                    updateEditingPost("description", event.target.value)
                  }
                  className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forsa-primary)]"
                />
              </div>
            </div>

            {editingError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {editingError}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-[var(--forsa-border)] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-full border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="forsa-click forsa-button rounded-full px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManageOpportunities({
  posts,
  loading,
  onView,
  onEdit,
  onApplicants,
  onToggleStatus,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--forsa-border)] bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-neutral-500">
          Loading your opportunities...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-[var(--forsa-border)] bg-white shadow-sm">
      <div className="border-b border-[var(--forsa-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              Manage Opportunities
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Full control of your job listings.
            </p>
          </div>

          <span className="w-fit rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--forsa-primary)]">
            {posts.length} {posts.length === 1 ? "listing" : "listings"}
          </span>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
            <FaBriefcase />
          </div>

          <h3 className="mt-4 text-base font-semibold text-neutral-900">
            No opportunities yet
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            Create your first listing to start finding candidates.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--forsa-border)]">
          {posts.map((post) => {
            const isClosed = post.status === "closed";

            const deadlinePassed =
              post.deadline &&
              new Date(`${post.deadline}T23:59:59`) < new Date();

            return (
              <div key={post.id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-bold text-neutral-900">
                        {post.title || "Untitled opportunity"}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          isClosed || deadlinePassed
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {deadlinePassed
                          ? "Deadline passed"
                          : isClosed
                            ? "Closed"
                            : "Live"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-neutral-500">
                      {post.location || "Lebanon"} ·{" "}
                      {post.category || post.type || "Opportunity"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                      <span>{formatNumber(post.views)} views</span>

                      <span>
                        {formatNumber(post.applications)} applications
                      </span>

                      {post.deadline && (
                        <span>
                          Deadline:{" "}
                          {new Date(
                            `${post.deadline}T00:00:00`
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => onView(post)}
                      className="text-xs"
                    >
                      View
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => onEdit(post)}
                      className="text-xs"
                    >
                      Edit
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => onApplicants(post)}
                      className="text-xs"
                    >
                      Applicants
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => onToggleStatus(post)}
                      className="text-xs"
                    >
                      {isClosed ? "Reopen" : "Close"}
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => onDelete(post)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ analytics, onNewPost, onOpenApplicants }) {
  const rows = analytics.rows || [];
  const totals = analytics.totals || {};
  const bestPost = analytics.bestPost;

  const activePostCount = rows.filter(
    (item) => item.post?.status !== "closed"
  ).length;

  return (
    <div className="mt-8 space-y-6 sm:space-y-8">
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsMetric
          icon={<FaBriefcase />}
          label="Open Opportunities"
          value={formatNumber(activePostCount)}
        />

        <AnalyticsMetric
          icon={<FaEye />}
          label="Total Views"
          value={formatNumber(totals.views)}
        />

        <AnalyticsMetric
          icon={<FaPaperPlane />}
          label="Applications"
          value={formatNumber(totals.applications)}
        />

        <AnalyticsMetric
          icon={<FaPercent />}
          label="Conversion Rate"
          value={`${totals.conversionRate || 0}%`}
        />
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <AnalyticsMetric
          icon={<FaBookmark />}
          label="Saves"
          value={formatNumber(totals.saves)}
        />

        <AnalyticsMetric
          icon={<FaShareAlt />}
          label="Shares"
          value={formatNumber(totals.shares)}
        />

        <AnalyticsMetric
          icon={<FaBullseye />}
          label="Avg Applicant Fit"
          value={`${totals.avgFit || 0}%`}
        />
      </div>

      {totals.reports > 0 && (
        <AnalyticsMetric
          icon={<FaFlag />}
          label="Flagged Reports"
          value={formatNumber(totals.reports)}
          danger
        />
      )}

      {bestPost && (
        <div className="rounded-2xl border border-[var(--forsa-border)] bg-gradient-to-r from-white to-[var(--forsa-bg-soft)] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--forsa-primary)]">
              Best performing opportunity
            </p>

            <button
              type="button"
              onClick={onOpenApplicants}
              className="w-fit text-xs font-semibold text-[var(--forsa-primary)] hover:underline"
            >
              Review applicants
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                {bestPost.post.title}
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                {bestPost.post.location || "Lebanon"} ·{" "}
                <span className="font-medium text-neutral-700">
                  {bestPost.post.pay || "Pay not set"}
                </span>
              </p>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 md:w-[360px]">
              <MiniAnalytics
                label="Views"
                value={formatNumber(bestPost.views)}
              />

              <MiniAnalytics
                label="Apps"
                value={formatNumber(bestPost.applications)}
              />

              <MiniAnalytics
                label="Conv."
                value={`${bestPost.conversionRate}%`}
              />
            </div>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
            <FaBriefcase className="text-lg" />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-neutral-900">
            No data analytics yet
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
            Post your first opportunity and start tracking your performance.
          </p>

          <Button
            onClick={onNewPost}
            className="mt-6 inline-flex items-center gap-2"
          >
            <FaPlus className="text-xs" />
            New Post
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--forsa-border)] bg-white shadow-sm">
          <div className="border-b border-[var(--forsa-border)] px-4 py-4 sm:px-6 sm:py-5">
            <h3 className="text-lg font-bold text-neutral-900">
              Opportunity performance
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              See which listings attract attention and applicants.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--forsa-border)] bg-[var(--forsa-bg)] text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  <th className="px-6 py-4">Opportunity</th>
                  <th className="px-4 py-4 text-center">Views</th>
                  <th className="px-4 py-4 text-center">Saves</th>
                  <th className="px-4 py-4 text-center">Apps</th>
                  <th className="px-4 py-4 text-center">Shares</th>
                  <th className="px-4 py-4 text-center">Conv.</th>
                  <th className="px-4 py-4 text-center">Fit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--forsa-border)]">
                {rows.map((row) => (
                  <tr
                    key={row.post.id}
                    className="group transition-colors hover:bg-neutral-50/50"
                  >
                    <td className="max-w-[280px] px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-neutral-900">
                          {row.post.title}
                        </span>

                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            row.post.status === "closed"
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {row.post.status === "closed" ? "Closed" : "Live"}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-neutral-500">
                        {row.post.location || "Lebanon"} ·{" "}
                        {row.post.category ||
                          row.post.type ||
                          "Opportunity"}
                      </p>

                      <div className="mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-[var(--forsa-primary)]"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(4, row.conversionRate)
                            )}%`,
                          }}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-medium text-neutral-900">
                      {formatNumber(row.views)}
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-medium text-neutral-600">
                      {formatNumber(row.saves)}
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-semibold text-neutral-900">
                      {formatNumber(row.applications)}
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-medium text-neutral-600">
                      {formatNumber(row.shares)}
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-bold text-neutral-900">
                      {row.conversionRate}%
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-medium text-neutral-900">
                      {row.avgFit || 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);

  const [analytics, setAnalytics] = useState({
    rows: [],
    totals: {
      views: 0,
      applications: 0,
      saves: 0,
      shares: 0,
      conversionRate: 0,
      avgFit: 0,
      reports: 0,
    },
    bestPost: null,
  });

  const [analyticsError, setAnalyticsError] = useState("");
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingError, setEditingError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const refreshDashboard = async (user, acc) => {
    if (!user || !acc?.uid) return;

    setAnalyticsError("");
    setPostsLoading(true);

    try {
      const [data, companyPosts] = await Promise.all([
        getCompanyAnalytics({
          uid: user.uid,
          email: user.email,
          name: acc.companyName || acc.name,
        }),
        getPostsByOwner({
          uid: user.uid,
        }),
      ]);

      setAnalytics(data);
      setPosts(companyPosts);
    } catch (error) {
      console.error("Dashboard load failed:", error);
      setAnalyticsError(
        "We could not refresh your dashboard right now."
      );
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAccount(null);
        setPosts([]);
        setPostsLoading(false);
        return;
      }

      let acc = null;

      try {
        acc = JSON.parse(
          localStorage.getItem("forsaAccount") || "null"
        );
      } catch {
        acc = null;
      }

      if (!acc?.uid) {
        setAccount(null);
        setPosts([]);
        setPostsLoading(false);
        return;
      }

      setAccount(acc);

      await refreshDashboard(user, acc);
    });

    return () => unsubscribe();
  }, []);

  const handleViewPost = (post) => {
    navigate(`/jobs/${post.id}`);
  };

  const handleEditPost = (post) => {
    setEditingError("");
    setEditingPostId(post.id);
    setEditingPost({ ...post });
  };

  const handleApplicants = (post) => {
    navigate(`/applicants?post=${post.id}`);
  };

  const updateEditingPost = (field, value) => {
    setEditingPost((current) => ({
      ...current,
      [field]: value,
    }));

    setEditingError("");
  };

  const cancelPostEdit = () => {
    if (savingEdit) return;

    setEditingPostId(null);
    setEditingPost(null);
    setEditingError("");
  };

  const savePostEdit = async () => {
    if (!editingPostId || !editingPost || savingEdit) {
      return;
    }

    const title = String(editingPost.title || "").trim();

    if (!title) {
      setEditingError("Please enter a title.");
      return;
    }

    if (editingPost.applicationMethod === "external") {
      const rawUrl = String(editingPost.applicationUrl || "").trim();

      if (!rawUrl) {
        setEditingError(
          "Please enter the external application URL."
        );
        return;
      }

      try {
        const url = new URL(rawUrl);

        if (
          url.protocol !== "http:" &&
          url.protocol !== "https:"
        ) {
          throw new Error("Unsupported URL protocol");
        }
      } catch {
        setEditingError("Please enter a valid application URL.");
        return;
      }
    }

    const updatePayload = {
      title,
      location: editingPost.location || "",
      pay: editingPost.pay || "",
      contact: editingPost.contact || "",
      applicationMethod:
        editingPost.applicationMethod || "forsa",
      applicationUrl: editingPost.applicationUrl || "",
      deadline: editingPost.deadline || "",
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

    setSavingEdit(true);
    setEditingError("");

    try {
      await updatePost(editingPostId, updatePayload);

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === editingPostId
            ? {
                ...post,
                ...updatePayload,
                updatedAt: new Date().toISOString(),
              }
            : post
        )
      );

      setAnalytics((currentAnalytics) => ({
        ...currentAnalytics,
        rows: (currentAnalytics.rows || []).map((row) =>
          row.post?.id === editingPostId
            ? {
                ...row,
                post: {
                  ...row.post,
                  ...updatePayload,
                  updatedAt: new Date().toISOString(),
                },
              }
            : row
        ),
        bestPost:
          currentAnalytics.bestPost?.post?.id === editingPostId
            ? {
                ...currentAnalytics.bestPost,
                post: {
                  ...currentAnalytics.bestPost.post,
                  ...updatePayload,
                  updatedAt: new Date().toISOString(),
                },
              }
            : currentAnalytics.bestPost,
      }));

      setEditingPostId(null);
      setEditingPost(null);
      setEditingError("");
    } catch (error) {
      console.error("Edit post error:", error);
      setEditingError(
        "Could not save the opportunity. Please try again."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (post) => {
    const nextStatus =
      post.status === "closed" ? "active" : "closed";

    try {
      await updatePost(post.id, {
        status: nextStatus,
      });

      setPosts((currentPosts) =>
        currentPosts.map((item) =>
          item.id === post.id
            ? {
                ...item,
                status: nextStatus,
              }
            : item
        )
      );

      setAnalytics((currentAnalytics) => ({
        ...currentAnalytics,
        rows: (currentAnalytics.rows || []).map((row) =>
          row.post?.id === post.id
            ? {
                ...row,
                post: {
                  ...row.post,
                  status: nextStatus,
                },
              }
            : row
        ),
        bestPost:
          currentAnalytics.bestPost?.post?.id === post.id
            ? {
                ...currentAnalytics.bestPost,
                post: {
                  ...currentAnalytics.bestPost.post,
                  status: nextStatus,
                },
              }
            : currentAnalytics.bestPost,
      }));
    } catch (error) {
      console.error("Update post status error:", error);
    }
  };

  const handleDeletePost = async (post) => {
    const confirmed = window.confirm(
      `Delete "${post.title || "this opportunity"}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deletePostFromFirestore(post.id);

      setPosts((currentPosts) =>
        currentPosts.filter((item) => item.id !== post.id)
      );

      setAnalytics((currentAnalytics) => ({
        ...currentAnalytics,
        rows: (currentAnalytics.rows || []).filter(
          (row) => row.post?.id !== post.id
        ),
        bestPost:
          currentAnalytics.bestPost?.post?.id === post.id
            ? null
            : currentAnalytics.bestPost,
      }));
    } catch (error) {
      console.error("Delete post error:", error);
    }
  };

  if (!account) {
    return (
      <div className="p-6">
        <AppHeader />

        <div className="mt-8 max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-600">
            Please sign in to access your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <AppHeader />

      <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 sm:px-6">
        <div className="rounded-2xl border border-[var(--forsa-border)] bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--forsa-primary)]">
                Company Dashboard
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                Welcome back, {account.name}
              </h1>

              <p className="mt-1.5 text-sm text-neutral-500">
                Manage your opportunities, applicants, and recruitment
                performance from one place.
              </p>
            </div>

            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:items-center">
              <Button
                onClick={() => navigate("/applicants")}
                variant="secondary"
                className="inline-flex items-center gap-2 self-start shadow-sm"
              >
                <FaPaperPlane className="text-xs" />
                <span>Review applicants</span>
              </Button>

              <Button
                onClick={() => navigate("/post")}
                className="inline-flex items-center gap-2 self-start shadow-sm md:self-auto"
              >
                <FaPlus className="text-xs" />
                <span>Create Listing</span>
              </Button>
            </div>
          </div>
        </div>

        {analyticsError ? (
          <div className="mt-8 rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900">
              Dashboard data could not be loaded
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              {analyticsError}
            </p>

            <Button
              onClick={() => {
                const user = auth.currentUser;

                if (user) {
                  refreshDashboard(user, account);
                }
              }}
              variant="secondary"
              className="mt-5"
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <ManageOpportunities
              posts={posts}
              loading={postsLoading}
              onView={handleViewPost}
              onEdit={handleEditPost}
              onApplicants={handleApplicants}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeletePost}
            />

            <AnalyticsTab
              analytics={analytics}
              onNewPost={() => navigate("/post")}
              onOpenApplicants={() => navigate("/applicants")}
            />
          </>
        )}
      </div>

      <EditOpportunityCard
        editingPost={editingPost}
        editingError={editingError}
        saving={savingEdit}
        updateEditingPost={updateEditingPost}
        onSave={savePostEdit}
        onCancel={cancelPostEdit}
      />
    </section>
  );
}