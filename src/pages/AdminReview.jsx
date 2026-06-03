import { useEffect, useMemo, useState, useCallback } from "react";
import AppHeader from "../components/AppHeader";
import { showToast } from "../lib/Toast";
import {
  deletePost as deletePostFromFirestore,
  getAdminPosts,
  updatePost,
} from "../lib/postService";
import { getReports, updateReportStatus } from "../lib/reportService";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
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
  FaExclamationTriangle,
  FaGlobe,
  FaBuilding,
} from "react-icons/fa";

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
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const toIso = (value) => {
  if (!value) return new Date().toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
};

const isAgencyPost = (post) =>
  post?.postSource === "agency" ||
  post?.sourceType === "agency" ||
  post?.category === "Recruitment Agency" ||
  post?.type === "Recruitment Agency";

const isPendingReview = (post) =>
  post?.reviewStatus === "pending" || post?.moderationStatus === "pending";

const isSuspicious = (post) =>
  post?.safetyStatus === "suspicious" || post?.suspicious === true;

async function getVerificationRequests() {
  const q = query(
    collection(db, "verificationRequests"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
    createdAt: toIso(item.data().createdAt),
    updatedAt: toIso(item.data().updatedAt),
  }));
}

async function updateVerificationRequest(id, data) {
  await updateDoc(doc(db, "verificationRequests", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

async function findUserByEmail(email) {
  if (!email) return null;

  const usersRef = collection(db, "users");
  const snap = await getDocs(query(usersRef, where("email", "==", email)));

  if (!snap.empty) {
    const item = snap.docs[0];
    return { id: item.id, ...item.data() };
  }

  const companySnap = await getDocs(
    query(usersRef, where("companyEmail", "==", email))
  );

  if (!companySnap.empty) {
    const item = companySnap.docs[0];
    return { id: item.id, ...item.data() };
  }

  return null;
}

async function verifyCompanyUser({ uid, email, verified }) {
  const user = uid ? { id: uid } : await findUserByEmail(email);

  if (!user?.id) {
    throw new Error("Company user was not found.");
  }

  await updateDoc(doc(db, "users", user.id), {
    verified,
    trusted: verified ? true : false,
    verifiedAt: verified ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });

  return user.id;
}

export default function AdminReview() {
  const account = safeJson("forsaAccount", null);

  const [posts, setPosts] = useState(() => safeJson("forsaPostsCache", []));
  const [reports, setReports] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const isAdmin = useMemo(() => {
    return (
      account?.email === "support.forsa@gmail.com" ||
      account?.email === "adamabdallahayln1@gmail.com" ||
      account?.role === "admin"
    );
  }, [account]);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);

    try {
      const [remotePosts, remoteReports, remoteVerificationRequests] =
        await Promise.all([
          getAdminPosts(),
          getReports(),
          getVerificationRequests(),
        ]);

      setPosts(remotePosts);
      setReports(remoteReports);
      setVerificationRequests(remoteVerificationRequests);
      localStorage.setItem("forsaPostsCache", JSON.stringify(remotePosts));
    } catch (error) {
      console.error("Admin review sync error:", error);
      showToast("Could not sync dashboard items.", "error");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    loadAdminData();
  }, [isAdmin, loadAdminData]);

  const analytics = useMemo(() => safeJson("forsaPostAnalytics", {}), []);
  const openReports = useMemo(
    () => reports.filter((item) => (item.status || "open") === "open"),
    [reports]
  );
  const pendingVerification = useMemo(
    () =>
      verificationRequests.filter(
        (item) => (item.status || "pending") === "pending"
      ),
    [verificationRequests]
  );
  const pendingAgencyPosts = useMemo(
    () => posts.filter((post) => isAgencyPost(post) && isPendingReview(post)),
    [posts]
  );

  const stats = useMemo(
    () => ({
      posts: posts.length,
      active: posts.filter((post) => (post.status || "active") === "active")
        .length,
      closed: posts.filter((post) => post.status === "closed").length,
      reports: openReports.length,
      verifications: pendingVerification.length,
      agency: pendingAgencyPosts.length,
      suspicious: posts.filter(isSuspicious).length,
    }),
    [posts, openReports, pendingVerification, pendingAgencyPosts]
  );

  const filteredPosts = useMemo(() => {
    const search = queryText.trim().toLowerCase();

    return posts.filter((post) => {
      const text = `${post.title || ""} ${post.company || ""} ${
        post.location || ""
      } ${post.ownerEmail || ""} ${post.contact || ""} ${
        post.workCountry || ""
      } ${post.hiringFor || ""}`.toLowerCase();

      const matchesSearch = !search || text.includes(search);
      const status = post.status || "active";

      const matchesFilter =
        filter === "all" ||
        filter === status ||
        (filter === "featured" && post.featured) ||
        (filter === "reported" &&
          reports.some((report) => String(report.postId) === String(post.id))) ||
        (filter === "agency" && isAgencyPost(post)) ||
        (filter === "pending" && isPendingReview(post)) ||
        (filter === "suspicious" && isSuspicious(post));

      return matchesSearch && matchesFilter;
    });
  }, [posts, queryText, filter, reports]);

  const patchPost = useCallback(async (postId, data, successMessage) => {
    setBusyId(postId);

    try {
      await updatePost(postId, data);
      setPosts((prev) =>
        prev.map((item) => (item.id === postId ? { ...item, ...data } : item))
      );
      showToast(successMessage || "Updated");
    } catch (error) {
      console.error(error);
      showToast("Update failed.", "error");
    } finally {
      setBusyId(null);
    }
  }, []);

  const toggleStatus = useCallback(
    async (postId) => {
      const post = posts.find((item) => item.id === postId);
      if (!post) return;

      const nextStatus = post.status === "closed" ? "active" : "closed";
      await patchPost(
        postId,
        { status: nextStatus },
        nextStatus === "closed" ? "Listing hidden" : "Listing activated"
      );
    },
    [posts, patchPost]
  );

  const toggleFeatured = useCallback(
    async (postId) => {
      const post = posts.find((item) => item.id === postId);
      if (!post) return;

      const nextFeatured = !post.featured;
      await patchPost(
        postId,
        { featured: nextFeatured },
        nextFeatured ? "Added to featured" : "Removed from featured"
      );
    },
    [posts, patchPost]
  );

  const approvePost = useCallback(
    async (postId) => {
      await patchPost(
        postId,
        {
          reviewStatus: "approved",
          moderationStatus: "approved",
          safetyStatus: "clear",
          suspicious: false,
          status: "active",
        },
        "Post approved"
      );
    },
    [patchPost]
  );

  const markSuspicious = useCallback(
    async (postId) => {
      await patchPost(
        postId,
        {
          safetyStatus: "suspicious",
          suspicious: true,
          featured: false,
        },
        "Marked as suspicious"
      );
    },
    [patchPost]
  );

  const rejectPost = useCallback(
    async (postId) => {
      await patchPost(
        postId,
        {
          reviewStatus: "rejected",
          moderationStatus: "rejected",
          status: "closed",
          featured: false,
        },
        "Post rejected and hidden"
      );
    },
    [patchPost]
  );

  const deletePost = useCallback(async (postId) => {
    const confirmed = window.confirm("Delete this listing permanently?");
    if (!confirmed) return;

    setBusyId(postId);

    try {
      await deletePostFromFirestore(postId);
      setPosts((prev) => prev.filter((item) => item.id !== postId));
      showToast("Deleted successfully");
    } catch (error) {
      console.error(error);
      showToast("Delete failed.", "error");
    } finally {
      setBusyId(null);
    }
  }, []);

  const markReportReviewed = useCallback(async (reportId, status = "reviewed") => {
    try {
      await updateReportStatus(reportId, status);
      setReports((prev) =>
        prev.map((item) => (item.id === reportId ? { ...item, status } : item))
      );
      showToast("Report updated");
    } catch (error) {
      console.error(error);
      showToast("Action failed.", "error");
    }
  }, []);

  const approveVerification = useCallback(async (request) => {
    try {
      const uid = await verifyCompanyUser({
        uid: request.uid,
        email: request.companyEmail || request.requestedByEmail,
        verified: true,
      });

      await updateVerificationRequest(request.id, {
        status: "approved",
        reviewedBy: account.email,
        reviewedAt: serverTimestamp(),
        uid,
      });

      setVerificationRequests((prev) =>
        prev.map((item) =>
          item.id === request.id ? { ...item, status: "approved", uid } : item
        )
      );

      showToast("Company verified");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Action failed.", "error");
    }
  }, [account?.email]);

  const rejectVerification = useCallback(async (request) => {
    try {
      await updateVerificationRequest(request.id, {
        status: "rejected",
        reviewedBy: account.email,
        reviewedAt: serverTimestamp(),
      });

      setVerificationRequests((prev) =>
        prev.map((item) =>
          item.id === request.id ? { ...item, status: "rejected" } : item
        )
      );

      showToast("Request rejected");
    } catch (error) {
      console.error(error);
      showToast("Action failed.", "error");
    }
  }, [account?.email]);

  if (!isAdmin) {
    return (
      <section className="min-h-screen bg-[#fafafa]">
        <AppHeader />
        <div className="mx-auto max-w-md px-4 py-32">
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-xs">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50 text-neutral-400">
              <FaShieldAlt className="text-sm" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-neutral-900">
              Access Restricted
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              This moderation desk is reserved for Forsa admins.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#fafafa] text-neutral-800">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <div className="flex flex-col gap-6 border-b border-neutral-200/60 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-500">
              <FaShieldAlt className="text-[10px]" />
              Forsa Trust Center
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-950">
              Moderation Desk
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Verify companies, approve agency posts, resolve reports, and stop suspicious listings before they hurt seekers.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="h-10 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-600"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Stat label="Total" value={stats.posts} />
          <Stat label="Active" value={stats.active} />
          <Stat label="Closed" value={stats.closed} />
          <Stat label="Reports" value={stats.reports} danger={stats.reports > 0} />
          <Stat label="Verify" value={stats.verifications} gold={stats.verifications > 0} />
          <Stat label="Agency" value={stats.agency} gold={stats.agency > 0} />
          <Stat label="Risk" value={stats.suspicious} danger={stats.suspicious > 0} />
        </div>

        {loading ? (
          <EmptyCard title="Updating entries" text="Syncing live data streams..." dataLoading />
        ) : (
          <>
            <TrustQueue
              requests={pendingVerification}
              agencyPosts={pendingAgencyPosts}
              approveVerification={approveVerification}
              rejectVerification={rejectVerification}
              approvePost={approvePost}
              rejectPost={rejectPost}
              markSuspicious={markSuspicious}
            />

            <ReportsPanel
              reports={openReports}
              posts={posts}
              markReportReviewed={markReportReviewed}
              toggleStatus={toggleStatus}
              deletePost={deletePost}
              markSuspicious={markSuspicious}
              rejectPost={rejectPost}
            />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 transition-all focus-within:border-neutral-400">
                <FaSearch className="shrink-0 text-xs text-neutral-400" />
                <input
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Search title, company, owner email, country..."
                  className="w-full bg-transparent text-xs text-neutral-800 outline-none placeholder:text-neutral-400"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  "all",
                  "active",
                  "closed",
                  "featured",
                  "reported",
                  "agency",
                  "pending",
                  "suspicious",
                ].map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-[11px] font-medium capitalize tracking-tight transition-all ${
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

            <div className="mt-4 space-y-3">
              {filteredPosts.length === 0 ? (
                <EmptyCard
                  title="No matching items"
                  text="No documents match the chosen filter."
                />
              ) : (
                filteredPosts.map((post) => (
                  <AdminPostCard
                    key={post.id}
                    post={post}
                    analytics={analytics[post.id]}
                    reportsCount={
                      reports.filter((r) => String(r.postId) === String(post.id))
                        .length
                    }
                    busy={busyId === post.id}
                    toggleStatus={toggleStatus}
                    toggleFeatured={toggleFeatured}
                    deletePost={deletePost}
                    approvePost={approvePost}
                    rejectPost={rejectPost}
                    markSuspicious={markSuspicious}
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

function Stat({ label, value, danger, gold }) {
  return (
    <div
      className={`rounded-xl border px-3.5 py-1.5 text-center transition-all ${
        danger
          ? "border-red-200 bg-red-50/40 text-red-600"
          : gold
          ? "border-amber-200 bg-amber-50/40 text-amber-700"
          : "border-neutral-200 bg-white text-neutral-800"
      }`}
    >
      <span className="text-xs font-bold">{value}</span>
      <span className="ml-1.5 text-[10px] font-medium lowercase text-neutral-400">
        {label}
      </span>
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

function TrustQueue({
  requests,
  agencyPosts,
  approveVerification,
  rejectVerification,
  approvePost,
  rejectPost,
  markSuspicious,
}) {
  if (requests.length === 0 && agencyPosts.length === 0) return null;

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {requests.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <PanelHeader
            icon={<FaUserCheck />}
            title="Verification Requests"
            text="Approve real companies and add trusted badges."
          />

          <div className="mt-4 divide-y divide-neutral-100">
            {requests.map((request) => (
              <div key={request.id} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm font-bold text-neutral-950">
                  {request.companyName || "Unnamed Company"}
                </p>
                <p className="mt-1 break-all text-xs text-neutral-500">
                  {request.companyEmail || request.requestedByEmail} ·{" "}
                  {request.city || "Lebanon"} · {formatDate(request.createdAt)}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  Web: <span className="text-neutral-800">{request.website || "none"}</span> ·
                  Insta: <span className="text-neutral-800"> @{request.instagram || "none"}</span>
                </p>

                <div className="mt-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-600">
                  <span className="mb-1 block font-semibold text-neutral-800">
                    Proof provided
                  </span>
                  {request.proof || "No supplemental details supplied."}
                </div>

                <div className="mt-3 flex gap-1.5">
                  <button
                    onClick={() => approveVerification(request)}
                    className="h-8 rounded-lg bg-neutral-900 px-3 text-[11px] font-medium text-white"
                  >
                    Approve company
                  </button>
                  <button
                    onClick={() => rejectVerification(request)}
                    className="h-8 rounded-lg border border-neutral-200 bg-white px-3 text-[11px] font-medium text-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {agencyPosts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-white p-5">
          <PanelHeader
            icon={<FaGlobe className="text-amber-600" />}
            title="Agency / Abroad Review"
            text="Approve placement posts before they appear trusted."
          />

          <div className="mt-4 divide-y divide-neutral-100">
            {agencyPosts.map((post) => (
              <div key={post.id} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm font-bold text-neutral-950">{post.title}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Posted by {post.company || "Agency"} · Hiring for{" "}
                  <span className="font-semibold text-neutral-800">
                    {post.hiringFor || "Employer"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Work country: {post.workCountry || "Abroad"} · Pay:{" "}
                  {post.pay || "Not specified"}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => approvePost(post.id)}
                    className="h-8 rounded-lg bg-neutral-900 px-3 text-[11px] font-medium text-white"
                  >
                    Approve post
                  </button>
                  <button
                    onClick={() => markSuspicious(post.id)}
                    className="h-8 rounded-lg border border-amber-200 bg-amber-50 px-3 text-[11px] font-medium text-amber-700"
                  >
                    Suspicious
                  </button>
                  <button
                    onClick={() => rejectPost(post.id)}
                    className="h-8 rounded-lg border border-red-200 bg-white px-3 text-[11px] font-medium text-red-600"
                  >
                    Reject / hide
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsPanel({
  reports,
  posts,
  markReportReviewed,
  toggleStatus,
  deletePost,
  markSuspicious,
  rejectPost,
}) {
  if (reports.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-red-200 bg-white p-5">
      <PanelHeader
        icon={<FaFlag className="text-red-500" />}
        title="Reports Pipeline"
        text="Resolve user reports and stop fake posts quickly."
      />

      <div className="mt-4 divide-y divide-neutral-100">
        {reports.map((report) => {
          const post = posts.find((item) => String(item.id) === String(report.postId));

          return (
            <div
              key={report.id}
              className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="space-y-0.5 text-xs">
                <h4 className="text-sm font-bold text-neutral-950">
                  {report.title || post?.title || "Flagged Listing"}
                </h4>
                <p className="font-medium text-neutral-400">
                  {report.company || post?.company || "Unknown Identity"}
                </p>
                <div className="my-2 rounded-xl border border-red-100/60 bg-red-50/40 p-3 text-red-800">
                  <span className="mb-0.5 block text-[11px] font-semibold text-red-900">
                    Reason
                  </span>
                  {report.reason}
                </div>
                <p className="text-[10px] text-neutral-400">
                  By:{" "}
                  <span className="text-neutral-600">
                    {report.reporterEmail || "Anonymous"}
                  </span>{" "}
                  · {formatDate(report.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1 sm:self-start">
                {post && (
                  <>
                    <button
                      onClick={() => toggleStatus(post.id)}
                      className="h-7 rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] font-medium text-neutral-600"
                    >
                      {post.status === "closed" ? "Open" : "Close"}
                    </button>
                    <button
                      onClick={() => markSuspicious(post.id)}
                      className="h-7 rounded-md border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-medium text-amber-700"
                    >
                      Risk
                    </button>
                    <button
                      onClick={() => rejectPost(post.id)}
                      className="h-7 rounded-md border border-red-200 bg-white px-2.5 text-[11px] font-medium text-red-600"
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="h-7 rounded-md border border-red-200 bg-white px-2.5 text-[11px] font-medium text-red-600"
                    >
                      Delete
                    </button>
                  </>
                )}
                <button
                  onClick={() => markReportReviewed(report.id)}
                  className="h-7 rounded-md bg-neutral-900 px-2.5 text-[11px] font-medium text-white"
                >
                  Clear
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminPostCard({
  post,
  analytics,
  reportsCount,
  busy,
  toggleStatus,
  toggleFeatured,
  deletePost,
  approvePost,
  rejectPost,
  markSuspicious,
}) {
  const status = post.status || "active";

  return (
    <div
      className={`rounded-2xl border bg-white p-5 transition hover:border-neutral-300 ${
        isSuspicious(post)
          ? "border-amber-200"
          : reportsCount > 0
          ? "border-red-200"
          : "border-neutral-200/80"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-1 text-base font-bold text-neutral-950">
              {post.title}
            </h3>

            <StatusBadge status={status} />

            {post.featured && (
              <SmallBadge tone="amber" icon={<FaStar />}>
                featured
              </SmallBadge>
            )}

            {isAgencyPost(post) && (
              <SmallBadge tone="blue" icon={<FaBuilding />}>
                agency
              </SmallBadge>
            )}

            {isPendingReview(post) && (
              <SmallBadge tone="amber" icon={<FaExclamationTriangle />}>
                pending review
              </SmallBadge>
            )}

            {isSuspicious(post) && (
              <SmallBadge tone="amber" icon={<FaBan />}>
                suspicious
              </SmallBadge>
            )}

            {reportsCount > 0 && (
              <SmallBadge tone="red" icon={<FaFlag />}>
                {reportsCount} report{reportsCount === 1 ? "" : "s"}
              </SmallBadge>
            )}
          </div>

          <p className="text-xs text-neutral-400">
            {post.company} · {post.location || "Lebanon"} ·{" "}
            <span className="font-medium text-neutral-700">
              {post.pay || "Unspecified"}
            </span>
          </p>

          {isAgencyPost(post) && (
            <p className="text-xs text-amber-700">
              Hiring for {post.hiringFor || "Employer"} · Work country{" "}
              {post.workCountry || "Abroad"}
            </p>
          )}

          <p className="pt-0.5 font-mono text-[10px] text-neutral-400">
            Owner: {post.ownerEmail || post.contact}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 border-l border-neutral-200 pl-2.5 text-xs leading-relaxed text-neutral-500">
        {post.description}
      </p>

      <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl border border-neutral-100 bg-neutral-50/60 p-2 text-center">
        <MiniMetric label="views" value={analytics?.views || 0} />
        <MiniMetric label="saves" value={analytics?.saves || 0} />
        <MiniMetric label="applies" value={analytics?.applications || 0} />
        <MiniMetric label="shares" value={analytics?.shares || 0} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-neutral-100 pt-3">
        {isPendingReview(post) && (
          <button
            disabled={busy}
            onClick={() => approvePost(post.id)}
            className="h-8 rounded-lg bg-neutral-900 px-3 text-[11px] font-medium text-white disabled:opacity-50"
          >
            Approve
          </button>
        )}

        <button
          disabled={busy}
          onClick={() => toggleStatus(post.id)}
          className="h-8 rounded-lg border border-neutral-200 bg-white px-3 text-[11px] font-medium text-neutral-600 disabled:opacity-50"
        >
          {status === "closed" ? "Activate" : "Deactivate"}
        </button>

        <button
          disabled={busy}
          onClick={() => toggleFeatured(post.id)}
          className="h-8 rounded-lg border border-neutral-200 bg-white px-3 text-[11px] font-medium text-neutral-600 disabled:opacity-50"
        >
          {post.featured ? "Unfeature" : "Feature"}
        </button>

        <button
          disabled={busy}
          onClick={() => markSuspicious(post.id)}
          className="h-8 rounded-lg border border-amber-200 bg-amber-50 px-3 text-[11px] font-medium text-amber-700 disabled:opacity-50"
        >
          Risk
        </button>

        <button
          disabled={busy}
          onClick={() => rejectPost(post.id)}
          className="h-8 rounded-lg border border-red-200 bg-white px-3 text-[11px] font-medium text-red-600 disabled:opacity-50"
        >
          Hide
        </button>

        <span className="ml-auto hidden text-[10px] text-neutral-400 sm:inline-block">
          Added {formatDate(post.createdAt)}
        </span>

        <button
          disabled={busy}
          onClick={() => deletePost(post.id)}
          className="h-8 rounded-lg border border-transparent px-2 text-[11px] font-medium text-neutral-400 transition hover:text-red-600 disabled:opacity-50 sm:ml-2"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
        status === "closed"
          ? "border-neutral-200 bg-neutral-50 text-neutral-400"
          : "border-emerald-100 bg-emerald-50 text-emerald-700"
      }`}
    >
      {status}
    </span>
  );
}

function SmallBadge({ children, icon, tone = "neutral" }) {
  const styles = {
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-600",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    red: "border-red-100 bg-red-50 text-red-600",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
        styles[tone] || styles.neutral
      }`}
    >
      {icon && <span className="text-[8px]">{icon}</span>}
      {children}
    </span>
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
      <p className="mx-auto mt-0.5 max-w-xs text-xs text-neutral-400">{text}</p>
    </div>
  );
}
