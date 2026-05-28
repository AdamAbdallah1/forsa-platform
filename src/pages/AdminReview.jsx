import { useEffect, useMemo, useState, useCallback } from "react";
import AppHeader from "../components/AppHeader";
import { showToast } from "../lib/Toast";
import { deletePost as deletePostFromFirestore, getActivePosts, updatePost } from "../lib/postService";
import { getReports, updateReportStatus } from "../lib/reportService";
import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  FaBan,
  FaCheck,
  FaFlag,
  FaSearch,
  FaShieldAlt,
  FaStar,
  FaTrash,
  FaUndo,
  FaUserCheck,
} from "react-icons/fa";

// --- Helper Functions ---
function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const toIso = (value) => {
  if (!value) return new Date().toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
};

// --- API Service Calls ---
async function getVerificationRequests() {
  const q = query(collection(db, "verificationRequests"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
    createdAt: toIso(item.data().createdAt),
    updatedAt: toIso(item.data().updatedAt),
  }));
}

async function updateVerificationRequest(id, status) {
  await updateDoc(doc(db, "verificationRequests", id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

async function verifyCompanyUser(uid, verified) {
  await updateDoc(doc(db, "users", uid), {
    verified,
    verifiedAt: verified ? serverTimestamp() : null,
  });
}

// --- Main Admin Component ---
export default function AdminReview() {
  const account = safeJson("forsaAccount", null);

  const [posts, setPosts] = useState(() => safeJson("forsaPostsCache", []));
  const [reports, setReports] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => {
    return (
      account?.email === "adamabdallah@gmail.com" ||
      account?.email === "adam@gmail.com" ||
      account?.role === "admin"
    );
  }, [account]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [remotePosts, remoteReports, remoteVerificationRequests] =
          await Promise.all([getActivePosts(), getReports(), getVerificationRequests()]);

        if (!active) return;

        setPosts(remotePosts);
        setReports(remoteReports);
        setVerificationRequests(remoteVerificationRequests);
        localStorage.setItem("forsaPostsCache", JSON.stringify(remotePosts));
      } catch (error) {
        console.error("Admin load error:", error);
        showToast("Could not refresh admin data.", "error");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAdminData();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  const analytics = useMemo(() => safeJson("forsaPostAnalytics", {}), []);
  const openReports = useMemo(() => reports.filter((r) => r.status !== "reviewed"), [reports]);
  const pendingVerification = useMemo(() => verificationRequests.filter((item) => (item.status || "pending") === "pending"), [verificationRequests]);

  const stats = useMemo(() => ({
    posts: posts.length,
    active: posts.filter((post) => (post.status || "active") === "active").length,
    closed: posts.filter((post) => post.status === "closed").length,
    reports: openReports.length,
    verifications: pendingVerification.length,
  }), [posts, openReports, pendingVerification]);

  const filteredPosts = useMemo(() => {
    const search = queryText.trim().toLowerCase();
    return posts.filter((post) => {
      const text = `${post.title} ${post.company} ${post.location} ${post.ownerEmail} ${post.contact}`.toLowerCase();
      const matchesSearch = !search || text.includes(search);
      const status = post.status || "active";

      const matchesFilter =
        filter === "all" ||
        filter === status ||
        (filter === "featured" && post.featured) ||
        (filter === "reported" && reports.some((report) => String(report.postId) === String(post.id)));

      return matchesSearch && matchesFilter;
    });
  }, [posts, queryText, filter, reports]);

  // --- Handlers wrapped in useCallback ---
  const toggleStatus = useCallback(async (postId) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const nextStatus = post.status === "closed" ? "active" : "closed";
    try {
      await updatePost(postId, { status: nextStatus });
      setPosts((prev) => prev.map((item) => item.id === postId ? { ...item, status: nextStatus } : item));
      showToast(nextStatus === "closed" ? "Post closed" : "Post reopened");
    } catch (error) {
      console.error("Admin status error:", error);
      showToast("Could not update post.", "error");
    }
  }, [posts]);

  const toggleFeatured = useCallback(async (postId) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const nextFeatured = !post.featured;
    try {
      await updatePost(postId, { featured: nextFeatured });
      setPosts((prev) => prev.map((item) => item.id === postId ? { ...item, featured: nextFeatured } : item));
      showToast(nextFeatured ? "Post featured" : "Post unfeatured");
    } catch (error) {
      console.error("Admin featured error:", error);
      showToast("Could not update featured status.", "error");
    }
  }, [posts]);

  const deletePost = useCallback(async (postId) => {
    const confirmed = window.confirm("Delete this post permanently?");
    if (!confirmed) return;

    try {
      await deletePostFromFirestore(postId);
      setPosts((prev) => prev.filter((item) => item.id !== postId));
      showToast("Post deleted");
    } catch (error) {
      console.error("Admin delete post error:", error);
      showToast("Could not delete post.", "error");
    }
  }, []);

  const markReportReviewed = useCallback(async (reportId) => {
    try {
      await updateReportStatus(reportId, "reviewed");
      setReports((prev) => prev.map((item) => item.id === reportId ? { ...item, status: "reviewed" } : item));
      showToast("Report marked reviewed");
    } catch (error) {
      console.error("Report review error:", error);
      showToast("Could not update report.", "error");
    }
  }, []);

  const approveVerification = useCallback(async (request) => {
    if (!request?.uid) {
      showToast("Missing company UID.", "error");
      return;
    }
    try {
      await Promise.all([
        updateVerificationRequest(request.id, "approved"),
        verifyCompanyUser(request.uid, true),
      ]);
      setVerificationRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, status: "approved" } : item));
      showToast("Company verified");
    } catch (error) {
      console.error("Approve verification error:", error);
      showToast("Could not approve verification.", "error");
    }
  }, []);

  const rejectVerification = useCallback(async (request) => {
    try {
      await updateVerificationRequest(request.id, "rejected");
      setVerificationRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, status: "rejected" } : item));
      showToast("Verification rejected");
    } catch (error) {
      console.error("Reject verification error:", error);
      showToast("Could not reject verification.", "error");
    }
  }, []);

  if (!isAdmin) {
    return (
      <section className="min-h-screen bg-[var(--forsa-bg)]">
        <AppHeader />
        <div className="mx-auto max-w-2xl px-5 py-24">
          <div className="rounded-3xl border border-[var(--forsa-border)] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <FaShieldAlt className="text-xl" />
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-neutral-900">Access Denied</h1>
            <p className="mt-2 text-sm text-neutral-500">This moderation management module is restricted to Forsa system administrators.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#fafafa]">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:pb-24">
        {/* Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--forsa-border)] bg-white p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[var(--forsa-gold-soft)]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-[var(--forsa-primary)]/5 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 tracking-wide uppercase">Core Management</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Moderation Desk</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
              Oversee platform safety: review pending legal listings, handle active reports, and verify company domains.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Total Listings" value={stats.posts} />
              <Stat label="Active Posts" value={stats.active} />
              <Stat label="Archived/Closed" value={stats.closed} />
              <Stat label="Open Reports" value={stats.reports} danger={stats.reports > 0} />
              <Stat label="Verifications Pending" value={stats.verifications} gold={stats.verifications > 0} />
            </div>
          </div>
        </div>

        {loading ? (
          <EmptyCard title="Synchronizing global states..." text="Retrieving real-time reports, post configurations, and business identity requests." dataLoading />
        ) : (
          <>
            {/* Action Panels */}
            <VerificationPanel requests={pendingVerification} approveVerification={approveVerification} rejectVerification={rejectVerification} />
            <ReportsPanel reports={openReports} posts={posts} markReportReviewed={markReportReviewed} toggleStatus={toggleStatus} deletePost={deletePost} />

            {/* Filter Hub */}
            <div className="mt-6 rounded-2xl border border-[var(--forsa-border)] bg-white p-3 shadow-xs">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50 px-4 py-2.5 transition focus-within:border-neutral-400 focus-within:bg-white">
                  <FaSearch className="text-neutral-400 text-xs shrink-0" />
                  <input
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="Filter posts by title, organization, or user metadata..."
                    className="w-full bg-transparent text-sm text-neutral-800 placeholder-neutral-400 outline-none"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {["all", "active", "closed", "featured", "reported"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                        filter === item
                          ? "bg-neutral-900 text-white shadow-xs"
                          : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feed Architecture */}
            <div className="mt-6 grid gap-4">
              {filteredPosts.length === 0 ? (
                <EmptyCard title="No matches found" text="Try shifting criteria terms or resetting filtering matrices." />
              ) : (
                filteredPosts.map((post) => (
                  <AdminPostCard
                    key={post.id}
                    post={post}
                    analytics={analytics[post.id]}
                    reportsCount={reports.filter((r) => String(r.postId) === String(post.id)).length}
                    toggleStatus={toggleStatus}
                    toggleFeatured={toggleFeatured}
                    deletePost={deletePost}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// --- Subcomponents ---

function Stat({ label, value, danger, gold }) {
  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      danger ? "border-red-200 bg-red-50/50" : gold ? "border-amber-200 bg-amber-50/40" : "border-neutral-100 bg-neutral-50/60"
    }`}>
      <p className={`text-2xl font-bold tracking-tight ${danger ? "text-red-600" : gold ? "text-amber-700" : "text-neutral-900"}`}>{value}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
    </div>
  );
}

function PanelHeader({ icon, title, text, gold, danger }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
        gold ? "border-amber-200 bg-amber-50 text-amber-700" : danger ? "border-red-200 bg-red-50 text-red-600" : "border-neutral-200 bg-neutral-50 text-neutral-500"
      }`}>
        {icon}
      </div>
      <div>
        <h3 className="text-base font-bold text-neutral-900">{title}</h3>
        <p className="mt-0.5 text-xs text-neutral-500">{text}</p>
      </div>
    </div>
  );
}

function VerificationPanel({ requests, approveVerification, rejectVerification }) {
  if (requests.length === 0) return null;

  return (
    <div className="mt-6 rounded-3xl border border-amber-200/70 bg-white p-5 shadow-xs transition-all hover:shadow-sm sm:p-6">
      <PanelHeader icon={<FaUserCheck />} title="Identity Verification Requests" text="Review legal entity documentation and metadata to approve badges." gold />
      <div className="mt-5 space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4 transition-all hover:bg-neutral-50">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-neutral-900 text-base">{request.companyName || "Unnamed Organization"}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700">{request.companyEmail || request.requestedByEmail || "No Email Address"}</span>
                  <span>•</span>
                  <span>{request.city || "Lebanon"}</span>
                  <span>•</span>
                  <span>{formatDate(request.createdAt)}</span>
                </div>
                <div className="pt-2 text-xs text-neutral-600">
                  <span className="font-medium text-neutral-900">Digital footprint:</span> Website: <span className="underline">{request.website || "None"}</span> · Instagram: @{request.instagram || "None"}
                </div>
                <div className="mt-2 rounded-xl border border-neutral-200/60 bg-white p-3 text-neutral-700 text-xs leading-relaxed">
                  <span className="font-semibold text-neutral-800 block mb-0.5">Submitted Proof:</span>
                  {request.proof || "No complementary context provided."}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 lg:self-start">
                <button 
                  onClick={() => approveVerification(request)} 
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-neutral-900 px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
                >
                  <FaCheck className="text-[10px]" /> Approve
                </button>
                <button 
                  onClick={() => rejectVerification(request)} 
                  className="inline-flex h-9 items-center rounded-xl border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 hover:text-red-600"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsPanel({ reports, posts, markReportReviewed, toggleStatus, deletePost }) {
  if (reports.length === 0) return null;

  return (
    <div className="mt-6 rounded-3xl border border-red-200 bg-white p-5 shadow-xs sm:p-6">
      <PanelHeader icon={<FaFlag />} title="Flagged Content Pipeline" text="Investigate user reports regarding spam, misleading context, or safety violations." danger />
      <div className="mt-5 space-y-3">
        {reports.map((report) => {
          const post = posts.find((item) => String(item.id) === String(report.postId));

          return (
            <div key={report.id} className="rounded-2xl border border-neutral-100 bg-red-50/10 p-4 transition hover:bg-red-50/20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-neutral-900 text-sm">{report.title || post?.title || "Reported Entity Reference"}</h4>
                  <p className="text-xs font-medium text-neutral-500">{report.company || post?.company || "Unknown Identity"}</p>
                  <div className="my-2 rounded-xl bg-red-50/50 border border-red-100/60 p-3 text-xs leading-relaxed text-red-800">
                    <span className="font-bold text-red-900 block mb-0.5">Reason Category:</span>
                    {report.reason}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Flagged by: <span className="text-neutral-600 font-medium">{report.reporterEmail || "Anonymous guest"}</span> · Received {formatDate(report.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0 lg:self-start">
                  {post && (
                    <>
                      <button 
                        onClick={() => toggleStatus(post.id)} 
                        className="inline-flex h-8 items-center rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                      >
                        {post.status === "closed" ? "Reopen Module" : "Deactivate Block"}
                      </button>
                      <button 
                        onClick={() => deletePost(post.id)} 
                        className="inline-flex h-8 items-center rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Purge Core
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => markReportReviewed(report.id)} 
                    className="inline-flex h-8 items-center rounded-lg bg-neutral-900 px-3 text-xs font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Clear Event
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminPostCard({ post, analytics, reportsCount, toggleStatus, toggleFeatured, deletePost }) {
  const status = post.status || "active";

  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-xs transition hover:shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-neutral-900 line-clamp-1">{post.title}</h3>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${
              status === "closed" ? "bg-red-50 text-red-700 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
            }`}>{status}</span>
            
            {post.featured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                <FaStar className="text-[9px]" /> Featured
              </span>
            )}
            {reportsCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white animate-pulse">
                {reportsCount} Critical Action
              </span>
            )}
          </div>
          
          <p className="text-xs font-medium text-neutral-500">
            {post.company || "Generic Merchant"} · {post.location || "Lebanon Territory"} · <span className="text-neutral-700 font-semibold">{post.pay || "Unspecified Compensation"}</span>
          </p>
          <p className="text-[11px] text-neutral-400">
            Node Identity: <span className="font-mono text-neutral-600 bg-neutral-100 px-1 py-0.5 rounded">{post.ownerEmail || post.contact || "Undefined"}</span>
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-neutral-600 border-l-2 border-neutral-200 pl-3">
        {post.description || "No public explicit textual content provided for description rules."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-400">
        <span>Timeline Node: {formatDate(post.createdAt)}</span>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="mt-5 grid grid-cols-4 gap-2 rounded-xl bg-neutral-50/80 p-3 text-center border border-neutral-100">
        <MiniMetric label="Impressions" value={analytics?.views || 0} />
        <MiniMetric label="Bookmarks" value={analytics?.saves || 0} />
        <MiniMetric label="Submissions" value={analytics?.applications || 0} />
        <MiniMetric label="Dispatches" value={analytics?.shares || 0} />
      </div>

      {/* Component Core Call Actions */}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
        <button 
          onClick={() => toggleStatus(post.id)} 
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          {status === "closed" ? <FaUndo className="text-[10px]" /> : <FaBan className="text-[10px]" />}
          {status === "closed" ? "Restore Visibility" : "Deactivate Asset"}
        </button>

        <button 
          onClick={() => toggleFeatured(post.id)} 
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          <FaStar className={`text-[10px] ${post.featured ? "text-amber-500 fill-amber-500" : ""}`} />
          {post.featured ? "Strip Priority" : "Elevate Stream"}
        </button>

        <button 
          onClick={() => deletePost(post.id)} 
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-100 bg-red-50/30 px-4 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:border-red-200 ml-auto"
        >
          <FaTrash className="text-[10px]" /> Delete Document
        </button>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div>
      <p className="text-sm font-bold text-neutral-800">{value}</p>
      <p className="text-[10px] text-neutral-400 font-medium tracking-tight uppercase mt-0.5">{label}</p>
    </div>
  );
}

function EmptyPanel({ icon, title, text }) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-neutral-200 bg-white p-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 text-neutral-400 border border-neutral-100">
        {icon}
      </div>
      <h4 className="mt-3 text-sm font-semibold text-neutral-800">{title}</h4>
      <p className="mt-1 text-xs text-neutral-500">{text}</p>
    </div>
  );
}

function EmptyCard({ title, text, dataLoading }) {
  return (
    <div className="mt-8 rounded-3xl border border-neutral-200/80 bg-white p-12 text-center shadow-xs">
      {dataLoading && (
        <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-neutral-800 border-t-transparent" />
      )}
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">{text}</p>
    </div>
  );
}