import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getCompanyAnalytics } from "../lib/analyticsService";

function StatCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 shadow-sm">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

const formatNumber = (value) => Number(value || 0).toLocaleString();

function AnalyticsTab({ analytics, onNewPost }) {
  const rows = analytics.rows || [];
  const totals = analytics.totals || {};
  const bestPost = analytics.bestPost;
  const activePostCount = rows.filter((item) => item.post?.status !== "closed").length;

  return (
    <div className="mt-6 sm:mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Company analytics</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
            Hiring performance
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
            Track views, saves, applications, shares, conversion rate, and average applicant fit across your posts.
          </p>
        </div>

        <Button onClick={onNewPost} className="inline-flex items-center gap-2 sm:w-fit">
          <FaPlus className="text-xs" />
          New post
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="rounded-[28px] border border-[var(--forsa-border)] p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Top insights</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{formatNumber(totals.applications)} applications, {formatNumber(totals.views)} views</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Your team has attracted interest across roles. Focus on top-performing posts, strong applicant fit, and share opportunities to keep momentum high.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Open opportunities" value={formatNumber(activePostCount)} />
            <StatCard label="Conversion rate" value={`${totals.conversionRate || 0}%`} />
            <StatCard label="Avg applicant fit" value={`${totals.avgFit || 0}%`} />
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Total saves" value={formatNumber(totals.saves)} />
          <StatCard label="Total shares" value={formatNumber(totals.shares)} />
        </div>
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
            <FaBriefcase />
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
                    <MiniAnalytics label="Fit" value={`${row.avgFit || 0}%`} />
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

function MiniAnalytics({ label, value }) {
  return (
    <div className="rounded-[18px] border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-3 text-center text-xs font-semibold text-neutral-700">
      <p>{label}</p>
      <p className="mt-2 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [analytics, setAnalytics] = useState({
    rows: [],
    totals: { views: 0, applications: 0, saves: 0, shares: 0, conversionRate: 0 },
    bestPost: null,
  });

  useEffect(() => {
    const acc = JSON.parse(localStorage.getItem("forsaAccount"));
    setAccount(acc);

    if (!acc?.uid) return;

    const load = async () => {
      try {
        const data = await getCompanyAnalytics({
          uid: acc.uid,
          email: acc.companyEmail || acc.email,
          name: acc.companyName || acc.name,
        });

        setAnalytics(data);
      } catch (error) {
        console.error("Dashboard analytics load failed:", error);
      }
    };

    load();
  }, []);

  if (!account) {
    return (
      <div className="p-6">
        <AppHeader />
        <p className="text-sm text-neutral-600">Please login first.</p>
      </div>
    );
  }

  const { rows, totals, bestPost } = analytics;

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <AppHeader />

      <div className="mx-auto max-w-[1180px] px-4 pb-20 sm:px-6">

        {/* HERO */}
        <div className="mt-6 rounded-[34px] border bg-white/85 p-6 shadow-sm backdrop-blur-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--forsa-primary)]">
                <FaBriefcase />
                Company analytics
              </p>

              <h1 className="mt-4 text-3xl font-semibold">
                Welcome, {account.name}
              </h1>

              <p className="mt-2 text-sm text-neutral-600">
                Track job performance and hiring metrics in real time.
              </p>
            </div>

            <Button onClick={() => navigate("/post")} className="inline-flex items-center gap-2">
              <FaPlus className="inline text-xs" />
              New Job
            </Button>
          </div>
        </div>

        <AnalyticsTab analytics={analytics} onNewPost={() => navigate("/post")} />

      </div>
    </section>
  );
}