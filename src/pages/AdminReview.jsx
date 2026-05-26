import { useEffect, useMemo, useState } from "react";
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

export default function AdminReview() {
  const account = safeJson("forsaAccount", null);

  const [posts, setPosts] = useState(safeJson("forsaPostsCache", []));
  const [reports, setReports] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const isAdmin =
    account?.email === "adamabdallah@gmail.com" ||
    account?.email === "adam@gmail.com" ||
    account?.role === "admin";

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

  const analytics = safeJson("forsaPostAnalytics", {});
  const openReports = reports.filter((report) => report.status !== "reviewed");
  const pendingVerification = verificationRequests.filter((item) => (item.status || "pending") === "pending");

  const stats = {
    posts: posts.length,
    active: posts.filter((post) => (post.status || "active") === "active").length,
    closed: posts.filter((post) => post.status === "closed").length,
    reports: openReports.length,
    verifications: pendingVerification.length,
  };

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

  const toggleStatus = async (postId) => {
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
  };

  const toggleFeatured = async (postId) => {
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
  };

  const deletePost = async (postId) => {
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
  };

  const markReportReviewed = async (reportId) => {
    try {
      await updateReportStatus(reportId, "reviewed");
      setReports((prev) => prev.map((item) => item.id === reportId ? { ...item, status: "reviewed" } : item));
      showToast("Report marked reviewed");
    } catch (error) {
      console.error("Report review error:", error);
      showToast("Could not update report.", "error");
    }
  };

  const approveVerification = async (request) => {
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
  };

  const rejectVerification = async (request) => {
    try {
      await updateVerificationRequest(request.id, "rejected");
      setVerificationRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, status: "rejected" } : item));
      showToast("Verification rejected");
    } catch (error) {
      console.error("Reject verification error:", error);
      showToast("Could not reject verification.", "error");
    }
  };

  if (!isAdmin) {
    return (
      <section>
        <AppHeader />
        <div className="mx-auto max-w-3xl px-5 py-20">
          <div className="rounded-[28px] border border-[var(--forsa-border)] bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-green)] text-white">
              <FaShieldAlt />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">Not authorized</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">This page is only for the Forsa admin.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="relative mt-8 overflow-hidden rounded-[30px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[var(--forsa-gold-soft)]/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-64 w-64 rounded-full bg-[var(--forsa-green)]/10 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-medium text-neutral-500">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Moderation control panel</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
              Review reports, manage posts, and approve verified companies.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-5">
              <Stat label="Posts" value={stats.posts} />
              <Stat label="Active" value={stats.active} />
              <Stat label="Closed" value={stats.closed} />
              <Stat label="Reports" value={stats.reports} />
              <Stat label="Verify" value={stats.verifications} />
            </div>
          </div>
        </div>

        {loading ? (
          <EmptyCard title="Loading admin data..." text="Fetching reports, posts, and verification requests." />
        ) : (
          <>
            <VerificationPanel requests={pendingVerification} approveVerification={approveVerification} rejectVerification={rejectVerification} />
            <ReportsPanel reports={openReports} posts={posts} markReportReviewed={markReportReviewed} toggleStatus={toggleStatus} deletePost={deletePost} />

            <div className="mt-5 rounded-[26px] border border-[var(--forsa-border)] bg-white p-4 shadow-sm">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <div className="flex items-center gap-3 rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-4 py-3">
                  <FaSearch className="text-sm text-neutral-400" />
                  <input
                    value={queryText}
                    onChange={(event) => setQueryText(event.target.value)}
                    placeholder="Search posts, company, city, owner..."
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  {["all", "active", "closed", "featured", "reported"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium capitalize ${
                        filter === item
                          ? "border-[var(--forsa-green)] bg-[var(--forsa-green)] text-white"
                          : "border-[var(--forsa-border)] bg-white text-neutral-600"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {filteredPosts.length === 0 ? (
                <EmptyCard title="No posts found." text="Try another search or filter." />
              ) : (
                filteredPosts.map((post) => (
                  <AdminPostCard
                    key={post.id}
                    post={post}
                    analytics={analytics[post.id]}
                    reportsCount={reports.filter((report) => String(report.postId) === String(post.id)).length}
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

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--forsa-bg)] p-4">
      <p className="text-xl font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function VerificationPanel({ requests, approveVerification, rejectVerification }) {
  if (requests.length === 0) {
    return <EmptyPanel icon={<FaShieldAlt />} title="No pending verification requests" text="Company verification requests will appear here." />;
  }

  return (
    <div className="mt-6 rounded-[26px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm">
      <PanelHeader icon={<FaUserCheck />} title="Pending verification requests" text="Approve trusted companies after reviewing their proof." gold />
      <div className="mt-5 grid gap-3">
        {requests.map((request) => (
          <div key={request.id} className="rounded-2xl bg-[var(--forsa-bg)] p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{request.companyName || "Company"}</p>
                <p className="mt-1 break-all text-sm text-neutral-500">{request.companyEmail || request.requestedByEmail || "No email"}</p>
                <p className="mt-1 text-sm text-neutral-500">{request.city || "Lebanon"} · {formatDate(request.createdAt)}</p>
                <p className="mt-3 break-all text-sm text-neutral-600">Website: {request.website || "None"} · Instagram: {request.instagram || "None"}</p>
                <p className="mt-3 text-sm leading-6 text-neutral-700">Proof: {request.proof || "No proof text."}</p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                <button onClick={() => approveVerification(request)} className="inline-flex items-center gap-2 rounded-full bg-[var(--forsa-green)] px-4 py-2 text-sm font-medium text-white">
                  <FaCheck className="text-xs" />
                  Approve
                </button>

                <button onClick={() => rejectVerification(request)} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600">
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
  if (reports.length === 0) {
    return <EmptyPanel icon={<FaFlag />} title="No open reports" text="Reported posts will appear here." />;
  }

  return (
    <div className="mt-6 rounded-[26px] border border-red-100 bg-white p-5 shadow-sm">
      <PanelHeader icon={<FaFlag />} title="Open reports" text="Review reported posts and take action." danger />
      <div className="mt-5 grid gap-3">
        {reports.map((report) => {
          const post = posts.find((item) => String(item.id) === String(report.postId));

          return (
            <div key={report.id} className="rounded-2xl bg-[var(--forsa-bg)] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-medium">{report.title || post?.title || "Reported post"}</p>
                  <p className="mt-1 text-sm text-neutral-500">{report.company || post?.company || "Unknown company"}</p>
                  <p className="mt-3 text-sm leading-6 text-neutral-600">Reason: {report.reason}</p>
                  <p className="mt-2 break-all text-xs text-neutral-400">Reporter: {report.reporterEmail || "guest"} · {formatDate(report.createdAt)}</p>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {post && (
                    <>
                      <button onClick={() => toggleStatus(post.id)} className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium">
                        {post.status === "closed" ? "Reopen" : "Close"}
                      </button>

                      <button onClick={() => deletePost(post.id)} className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600">
                        Delete post
                      </button>
                    </>
                  )}

                  <button onClick={() => markReportReviewed(report.id)} className="rounded-full bg-[var(--forsa-green)] px-4 py-2 text-sm font-medium text-white">
                    Mark reviewed
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
    <div className="rounded-[26px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="line-clamp-2 text-xl font-semibold tracking-[-0.02em]">{post.title}</h2>
        <StatusBadge status={status} />
        {post.featured && <span className="rounded-full bg-[var(--forsa-gold)] px-3 py-1 text-xs text-black">Featured</span>}
        {reportsCount > 0 && <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">{reportsCount} report{reportsCount === 1 ? "" : "s"}</span>}
      </div>

      <p className="mt-2 text-sm text-neutral-500">{post.company || "Unknown company"} · {post.location || "Lebanon"} · {post.pay || "No pay"}</p>
      <p className="mt-1 break-all text-xs text-neutral-400">Owner: {post.ownerEmail || post.contact || "Unknown"}</p>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">{post.description || "No description."}</p>
      <p className="mt-3 text-xs text-neutral-400">Posted {formatDate(post.createdAt)}</p>

      <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-[var(--forsa-bg)] p-3">
        <Mini label="Views" value={analytics?.views || 0} />
        <Mini label="Saves" value={analytics?.saves || 0} />
        <Mini label="Apps" value={analytics?.applications || 0} />
        <Mini label="Shares" value={analytics?.shares || 0} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => toggleStatus(post.id)} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium">
          {status === "closed" ? <FaUndo className="text-xs" /> : <FaBan className="text-xs" />}
          {status === "closed" ? "Reopen" : "Close"}
        </button>

        <button onClick={() => toggleFeatured(post.id)} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium">
          <FaStar className="text-xs" />
          {post.featured ? "Unfeature" : "Feature"}
        </button>

        <button onClick={() => deletePost(post.id)} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600">
          <FaTrash className="text-xs" />
          Delete
        </button>
      </div>
    </div>
  );
}

function EmptyPanel({ icon, title, text }) {
  return (
    <div className="mt-6 rounded-[26px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--forsa-bg)] text-neutral-500">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-neutral-500">{text}</p>
        </div>
      </div>
    </div>
  );
}

function PanelHeader({ icon, title, text, gold, danger }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
        gold ? "bg-[var(--forsa-gold)] text-black" : danger ? "bg-red-100 text-red-600" : "bg-[var(--forsa-bg)] text-neutral-500"
      }`}>
        {icon}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-neutral-500">{text}</p>
      </div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold">{value}</p>
      <p className="mt-1 text-[11px] text-neutral-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = status === "closed" ? "bg-red-100 text-red-700" : "bg-[var(--forsa-bg)] text-neutral-600";
  return <span className={`rounded-full px-3 py-1 text-xs ${styles}`}>{status}</span>;
}

function EmptyCard({ title, text }) {
  return (
    <div className="mt-6 rounded-[28px] border border-[var(--forsa-border)] bg-white p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm text-neutral-500">{text}</p>
    </div>
  );
}
