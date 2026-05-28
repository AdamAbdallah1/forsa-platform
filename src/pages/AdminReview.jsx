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
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
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
        showToast("Could not sync dashboard items.", "error");
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

  const toggleStatus = useCallback(async (postId) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const nextStatus = post.status === "closed" ? "active" : "closed";
    try {
      await updatePost(postId, { status: nextStatus });
      setPosts((prev) => prev.map((item) => item.id === postId ? { ...item, status: nextStatus } : item));
      showToast(nextStatus === "closed" ? "Listing disabled" : "Listing activated");
    } catch (error) {
      console.error(error);
      showToast("Update failed.", "error");
    }
  }, [posts]);

  const toggleFeatured = useCallback(async (postId) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const nextFeatured = !post.featured;
    try {
      await updatePost(postId, { featured: nextFeatured });
      setPosts((prev) => prev.map((item) => item.id === postId ? { ...item, featured: nextFeatured } : item));
      showToast(nextFeatured ? "Added to featured" : "Removed from featured");
    } catch (error) {
      console.error(error);
      showToast("Update failed.", "error");
    }
  }, [posts]);

  const deletePost = useCallback(async (postId) => {
    const confirmed = window.confirm("Delete this listing permanently?");
    if (!confirmed) return;

    try {
      await deletePostFromFirestore(postId);
      setPosts((prev) => prev.filter((item) => item.id !== postId));
      showToast("Deleted successfully");
    } catch (error) {
      console.error(error);
      showToast("Delete failed.", "error");
    }
  }, []);

  const markReportReviewed = useCallback(async (reportId) => {
    try {
      await updateReportStatus(reportId, "reviewed");
      setReports((prev) => prev.map((item) => item.id === reportId ? { ...item, status: "reviewed" } : item));
      showToast("Report cleared");
    } catch (error) {
      console.error(error);
      showToast("Action failed.", "error");
    }
  }, []);

  const approveVerification = useCallback(async (request) => {
    if (!request?.uid) {
      showToast("Missing user identity ID.", "error");
      return;
    }
    try {
      await Promise.all([
        updateVerificationRequest(request.id, "approved"),
        verifyCompanyUser(request.uid, true),
      ]);
      setVerificationRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, status: "approved" } : item));
      showToast("Company approved");
    } catch (error) {
      console.error(error);
      showToast("Action failed.", "error");
    }
  }, []);

  const rejectVerification = useCallback(async (request) => {
    try {
      await updateVerificationRequest(request.id, "rejected");
      setVerificationRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, status: "rejected" } : item));
      showToast("Request rejected");
    } catch (error) {
      console.error(error);
      showToast("Action failed.", "error");
    }
  }, []);

  if (!isAdmin) {
    return (
      <section className="min-h-screen bg-[#fafafa]">
        <AppHeader />
        <div className="mx-auto max-w-md px-4 py-32">
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-xs">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 text-neutral-400 border border-neutral-100">
              <FaShieldAlt className="text-sm" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-neutral-900">Access Restricted</h1>
            <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">This moderation desk is reserved solely for Forsa system executives.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#fafafa] text-neutral-800">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
        {/* Simple Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-neutral-200/60 pb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Moderation Desk</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Approve verified companies, resolve flags, and curate live dashboard opportunities.
            </p>
          </div>

          {/* Minimal Metrics Hub Container */}
          <div className="flex flex-wrap items-center gap-2">
            <Stat label="Total" value={stats.posts} />
            <Stat label="Active" value={stats.active} />
            <Stat label="Closed" value={stats.closed} />
            <Stat label="Reports" value={stats.reports} danger={stats.reports > 0} />
            <Stat label="Pending" value={stats.verifications} gold={stats.verifications > 0} />
          </div>
        </div>

        {loading ? (
          <EmptyCard title="Updating entries" text="Syncing live data streams..." dataLoading />
        ) : (
          <>
            {/* Context Sub-Panels */}
            <VerificationPanel requests={pendingVerification} approveVerification={approveVerification} rejectVerification={rejectVerification} />
            <ReportsPanel reports={openReports} posts={posts} markReportReviewed={markReportReviewed} toggleStatus={toggleStatus} deletePost={deletePost} />

            {/* Filter Search Input System */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 transition-all focus-within:border-neutral-400">
                <FaSearch className="text-neutral-400 text-xs shrink-0" />
                <input
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Search via title, email, or keywords..."
                  className="w-full bg-transparent text-xs text-neutral-800 placeholder-neutral-400 outline-none"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                {["all", "active", "closed", "featured", "reported"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-[11px] font-medium tracking-tight capitalize transition-all ${
                      filter === item
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Post Listing Feed Feed */}
            <div className="mt-4 space-y-3">
              {filteredPosts.length === 0 ? (
                <EmptyCard title="No matching items" text="No documents aligned with the chosen filter metrics." />
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
    <div className={`rounded-xl border px-3.5 py-1.5 text-center transition-all ${
      danger ? "border-red-200 bg-red-50/40 text-red-600" : gold ? "border-amber-200 bg-amber-50/40 text-amber-700" : "border-neutral-200 bg-white text-neutral-800"
    }`}>
      <span className="text-xs font-bold">{value}</span>
      <span className="ml-1.5 text-[10px] font-medium text-neutral-400 lowercase">{label}</span>
    </div>
  );
}

function PanelHeader({ icon, title, text }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-sm text-neutral-400">{icon}</div>
      <div>
        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        <p className="text-[11px] text-neutral-400">{text}</p>
      </div>
    </div>
  );
}

function VerificationPanel({ requests, approveVerification, rejectVerification }) {
  if (requests.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <PanelHeader icon={<FaUserCheck />} title="Verification Requests" text="Verify documents to append company authorization badges." />
      <div className="mt-4 divide-y divide-neutral-100">
        {requests.map((request) => (
          <div key={request.id} className="pt-4 first:pt-0 pb-4 last:pb-0 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 text-xs">
              <p className="font-bold text-neutral-950 text-sm">{request.companyName || "Unnamed Company"}</p>
              <div className="flex flex-wrap items-center gap-x-2 text-neutral-400">
                <span className="text-neutral-600">{request.companyEmail || request.requestedByEmail}</span>
                <span>•</span>
                <span>{request.city || "Lebanon"}</span>
                <span>•</span>
                <span>{formatDate(request.createdAt)}</span>
              </div>
              <div className="pt-1 text-[11px] text-neutral-500">
                Web: <span className="text-neutral-800">{request.website || "none"}</span> · Insta: <span className="text-neutral-800">@{request.instagram || "none"}</span>
              </div>
              <div className="mt-2 rounded-xl bg-neutral-50 p-3 text-neutral-600 border border-neutral-100">
                <span className="font-semibold text-neutral-800 block text-[11px] mb-0.5">Proof Provided:</span>
                {request.proof || "No supplemental details supplied."}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 sm:self-start">
              <button 
                onClick={() => approveVerification(request)} 
                className="h-8 rounded-lg bg-neutral-900 px-3 text-[11px] font-medium text-white hover:bg-neutral-800 transition"
              >
                Approve
              </button>
              <button 
                onClick={() => rejectVerification(request)} 
                className="h-8 rounded-lg border border-neutral-200 bg-white px-3 text-[11px] font-medium text-neutral-500 hover:bg-neutral-50 hover:text-red-600 transition"
              >
                Reject
              </button>
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
    <div className="mt-6 rounded-2xl border border-red-200 bg-white p-5">
      <PanelHeader icon={<FaFlag className="text-red-500" />} title="Flagged Content Pipeline" text="Manage user flags and reports for compliance safety." />
      <div className="mt-4 divide-y divide-neutral-100">
        {reports.map((report) => {
          const post = posts.find((item) => String(item.id) === String(report.postId));

          return (
            <div key={report.id} className="pt-4 first:pt-0 pb-4 last:pb-0 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-0.5 text-xs">
                <h4 className="font-bold text-neutral-950 text-sm">{report.title || post?.title || "Flagged Listing"}</h4>
                <p className="text-neutral-400 font-medium">{report.company || post?.company || "Unknown Identity"}</p>
                <div className="my-2 rounded-xl bg-red-50/40 border border-red-100/60 p-3 text-red-800">
                  <span className="font-semibold text-red-900 block text-[11px] mb-0.5">Reason:</span>
                  {report.reason}
                </div>
                <p className="text-[10px] text-neutral-400">
                  By: <span className="text-neutral-600">{report.reporterEmail || "Anonymous"}</span> · {formatDate(report.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0 sm:self-start">
                {post && (
                  <>
                    <button 
                      onClick={() => toggleStatus(post.id)} 
                      className="h-7 rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 transition"
                    >
                      {post.status === "closed" ? "Open" : "Close"}
                    </button>
                    <button 
                      onClick={() => deletePost(post.id)} 
                      className="h-7 rounded-md border border-red-200 bg-white px-2.5 text-[11px] font-medium text-red-600 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </>
                )}
                <button 
                  onClick={() => markReportReviewed(report.id)} 
                  className="h-7 rounded-md bg-neutral-900 px-2.5 text-[11px] font-medium text-white hover:bg-neutral-800 transition"
                >
                  Clear Flag
                </button>
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
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 transition hover:border-neutral-300">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-neutral-950 line-clamp-1">{post.title}</h3>
            
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${
              status === "closed" ? "bg-neutral-50 text-neutral-400 border-neutral-200" : "bg-emerald-50 text-emerald-700 border-emerald-100"
            }`}>{status}</span>
            
            {post.featured && (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                <FaStar className="text-[8px] text-amber-500" /> featured
              </span>
            )}
            {reportsCount > 0 && (
              <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600 border border-red-100">
                {reportsCount} flagged
              </span>
            )}
          </div>
          
          <p className="text-xs text-neutral-400">
            {post.company} · {post.location || "Lebanon"} · <span className="text-neutral-700 font-medium">{post.pay || "Unspecified"}</span>
          </p>
          <p className="text-[10px] font-mono text-neutral-400 pt-0.5">
            Owner: {post.ownerEmail || post.contact}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-neutral-500 border-l border-neutral-200 pl-2.5">
        {post.description}
      </p>

      {/* Tiny Analytics Summary */}
      <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-neutral-50/60 p-2 text-center border border-neutral-100">
        <MiniMetric label="views" value={analytics?.views || 0} />
        <MiniMetric label="saves" value={analytics?.saves || 0} />
        <MiniMetric label="applies" value={analytics?.applications || 0} />
        <MiniMetric label="shares" value={analytics?.shares || 0} />
      </div>

      {/* Admin Action Footnotes */}
      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-neutral-100 pt-3">
        <button 
          onClick={() => toggleStatus(post.id)} 
          className="h-8 rounded-lg border border-neutral-200 bg-white px-3 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 transition"
        >
          {status === "closed" ? "Activate" : "Deactivate"}
        </button>

        <button 
          onClick={() => toggleFeatured(post.id)} 
          className="h-8 rounded-lg border border-neutral-200 bg-white px-3 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 transition"
        >
          {post.featured ? "Remove Star" : "Feature"}
        </button>

        <span className="text-[10px] text-neutral-400 ml-auto hidden sm:inline-block">
          Added {formatDate(post.createdAt)}
        </span>

        <button 
          onClick={() => deletePost(post.id)} 
          className="h-8 rounded-lg border border-transparent text-neutral-400 hover:text-red-600 px-2 text-[11px] font-medium transition sm:ml-2"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div>
      <span className="text-xs font-bold text-neutral-800">{value}</span>
      <span className="ml-1 text-[10px] text-neutral-400">{label}</span>
    </div>
  );
}

function EmptyCard({ title, text, dataLoading }) {
  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-12 text-center">
      {dataLoading && (
        <div className="mx-auto mb-3 h-4 w-4 animate-spin rounded-full border-2 border-neutral-800 border-t-transparent" />
      )}
      <p className="text-xs font-bold text-neutral-900">{title}</p>
      <p className="mt-0.5 text-xs text-neutral-400 max-w-xs mx-auto">{text}</p>
    </div>
  );
}