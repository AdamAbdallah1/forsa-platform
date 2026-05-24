import { useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import {
  FaCheck,
  FaFlag,
  FaSearch,
  FaStar,
  FaTrash,
  FaBan,
  FaUndo,
  FaShieldAlt,
} from "react-icons/fa";

function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminReview() {
  const account = safeJson("forsaAccount", null);

  const [posts, setPosts] = useState(safeJson("forsaPosts", []));
  const [reports, setReports] = useState(safeJson("forsaReports", []));
  const [trustedPosters, setTrustedPosters] = useState(
    safeJson("forsaTrustedPosters", [])
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const isAdmin = account?.email === "adam@gmail.com";

  const analytics = safeJson("forsaPostAnalytics", {});

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const searchText = `${post.title} ${post.company} ${post.location} ${post.ownerEmail}`.toLowerCase();
      const matchesSearch = searchText.includes(query.toLowerCase());

      const status = post.status || "active";

      const matchesFilter =
        filter === "all" ||
        filter === status ||
        (filter === "featured" && post.featured) ||
        (filter === "reported" &&
          reports.some((report) => String(report.postId) === String(post.id)));

      return matchesSearch && matchesFilter;
    });
  }, [posts, query, filter, reports]);

  const stats = {
    total: posts.length,
    active: posts.filter((post) => (post.status || "active") === "active").length,
    closed: posts.filter((post) => post.status === "closed").length,
    featured: posts.filter((post) => post.featured).length,
    reports: reports.filter((report) => !report.reviewed).length,
  };

  const persistPosts = (nextPosts) => {
    setPosts(nextPosts);
    writeJson("forsaPosts", nextPosts);
  };

  const persistReports = (nextReports) => {
    setReports(nextReports);
    writeJson("forsaReports", nextReports);
  };

  const deletePost = (id) => {
    const confirmed = window.confirm("Delete this post permanently?");
    if (!confirmed) return;

    persistPosts(posts.filter((post) => post.id !== id));
  };

  const toggleStatus = (id) => {
    persistPosts(
      posts.map((post) =>
        post.id === id
          ? {
              ...post,
              status: post.status === "closed" ? "active" : "closed",
              reviewedAt: new Date().toISOString(),
            }
          : post
      )
    );
  };

  const toggleFeatured = (id) => {
    persistPosts(
      posts.map((post) =>
        post.id
          === id
          ? {
              ...post,
              featured: !post.featured,
              reviewedAt: new Date().toISOString(),
            }
          : post
      )
    );
  };

  const toggleTrustedPoster = (email) => {
    if (!email) return;

    const updated = trustedPosters.includes(email)
      ? trustedPosters.filter((item) => item !== email)
      : [email, ...trustedPosters];

    setTrustedPosters(updated);
    writeJson("forsaTrustedPosters", updated);
  };

  const markReportReviewed = (id) => {
    persistReports(
      reports.map((report) =>
        report.id === id
          ? { ...report, reviewed: true, reviewedAt: new Date().toISOString() }
          : report
      )
    );
  };

  const deleteReport = (id) => {
    persistReports(reports.filter((report) => report.id !== id));
  };

  if (!isAdmin) {
    return (
      <section>
        <AppHeader />

        <div className="mx-auto max-w-3xl px-5 py-20">
          <div className="rounded-[28px] border border-neutral-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
              <FaShieldAlt />
            </div>

            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
              Not authorized
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              This page is only for the Forsa admin.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-8 rounded-[30px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-neutral-500">Admin</p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Platform control panel
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
            Manage posts, reports, featured listings, closed opportunities, and
            trusted posters.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            <Stat label="Total" value={stats.total} />
            <Stat label="Active" value={stats.active} />
            <Stat label="Closed" value={stats.closed} />
            <Stat label="Featured" value={stats.featured} />
            <Stat label="Reports" value={stats.reports} />
          </div>
        </div>

        <div className="mt-5 rounded-[26px] border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-full border border-neutral-200 bg-[#f7f7f5] px-4 py-3">
              <FaSearch className="text-sm text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ReportsPanel
          reports={reports}
          posts={posts}
          markReportReviewed={markReportReviewed}
          deleteReport={deleteReport}
          toggleStatus={toggleStatus}
          deletePost={deletePost}
        />

        <div className="mt-6 grid gap-4">
          {filteredPosts.length === 0 ? (
            <div className="rounded-[28px] border border-neutral-200 bg-white p-8 text-center">
              <p className="font-medium">No posts found.</p>
              <p className="mt-2 text-sm text-neutral-500">
                Try another search or filter.
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <AdminPostCard
                key={post.id}
                post={post}
                analytics={analytics[post.id]}
                reportsCount={
                  reports.filter(
                    (report) => String(report.postId) === String(post.id)
                  ).length
                }
                trusted={trustedPosters.includes(post.ownerEmail)}
                toggleStatus={toggleStatus}
                toggleFeatured={toggleFeatured}
                deletePost={deletePost}
                toggleTrustedPoster={toggleTrustedPoster}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f7f7f5] p-4">
      <p className="text-xl font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function AdminPostCard({
  post,
  analytics,
  reportsCount,
  trusted,
  toggleStatus,
  toggleFeatured,
  deletePost,
  toggleTrustedPoster,
}) {
  const status = post.status || "active";

  return (
    <div className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="line-clamp-2 text-xl font-semibold tracking-[-0.02em]">
              {post.title}
            </h2>

            <StatusBadge status={status} />

            {post.featured && (
              <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
                Featured
              </span>
            )}

            {trusted && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                Trusted poster
              </span>
            )}

            {reportsCount > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                {reportsCount} report{reportsCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-neutral-500">
            {post.company || "Unknown company"} · {post.location || "Lebanon"} ·{" "}
            {post.pay || "No pay"}
          </p>

          <p className="mt-1 break-all text-xs text-neutral-400">
            Owner: {post.ownerEmail || post.contact || "Unknown"}
          </p>

          <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">
            {post.description || "No description."}
          </p>

          <p className="mt-3 text-xs text-neutral-400">
            Posted {formatDate(post.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-[#f7f7f5] p-3">
        <Mini label="Views" value={analytics?.views || 0} />
        <Mini label="Saves" value={analytics?.saves || 0} />
        <Mini label="Apps" value={analytics?.applications || 0} />
        <Mini label="Shares" value={analytics?.shares || 0} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => toggleStatus(post.id)}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium"
        >
          {status === "closed" ? <FaUndo className="text-xs" /> : <FaBan className="text-xs" />}
          {status === "closed" ? "Reopen" : "Close"}
        </button>

        <button
          onClick={() => toggleFeatured(post.id)}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium"
        >
          <FaStar className="text-xs" />
          {post.featured ? "Unfeature" : "Feature"}
        </button>

        <button
          onClick={() => toggleTrustedPoster(post.ownerEmail)}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium"
        >
          <FaCheck className="text-xs" />
          {trusted ? "Untrust poster" : "Trust poster"}
        </button>

        <button
          onClick={() => deletePost(post.id)}
          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600"
        >
          <FaTrash className="text-xs" />
          Delete
        </button>
      </div>
    </div>
  );
}

function ReportsPanel({
  reports,
  posts,
  markReportReviewed,
  deleteReport,
  toggleStatus,
  deletePost,
}) {
  const openReports = reports.filter((report) => !report.reviewed);

  if (openReports.length === 0) {
    return (
      <div className="mt-6 rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f7f5]">
            <FaFlag className="text-neutral-500" />
          </div>

          <div>
            <p className="font-medium">No open reports</p>
            <p className="mt-1 text-sm text-neutral-500">
              Reported posts will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[26px] border border-red-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
          <FaFlag />
        </div>

        <div>
          <p className="font-medium">Open reports</p>
          <p className="mt-1 text-sm text-neutral-500">
            Review reported posts and take action.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {openReports.map((report) => {
          const post = posts.find(
            (item) => String(item.id) === String(report.postId)
          );

          return (
            <div key={report.id} className="rounded-2xl bg-[#f7f7f5] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-medium">
                    {report.title || post?.title || "Reported post"}
                  </p>

                  <p className="mt-1 text-sm text-neutral-500">
                    {report.company || post?.company || "Unknown company"}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    Reason: {report.reason}
                  </p>

                  <p className="mt-2 break-all text-xs text-neutral-400">
                    Reporter: {report.reporterEmail || "guest"} ·{" "}
                    {formatDate(report.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {post && (
                    <>
                      <button
                        onClick={() => toggleStatus(post.id)}
                        className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium"
                      >
                        {post.status === "closed" ? "Reopen" : "Close"}
                      </button>

                      <button
                        onClick={() => deletePost(post.id)}
                        className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600"
                      >
                        Delete post
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => markReportReviewed(report.id)}
                    className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
                  >
                    Mark reviewed
                  </button>

                  <button
                    onClick={() => deleteReport(report.id)}
                    className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium"
                  >
                    Remove report
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

function Mini({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold">{value}</p>
      <p className="mt-1 text-[11px] text-neutral-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles =
    status === "closed"
      ? "bg-red-100 text-red-700"
      : "bg-[#f7f7f5] text-neutral-600";

  return (
    <span className={`rounded-full px-3 py-1 text-xs ${styles}`}>
      {status}
    </span>
  );
}