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

const formatNumber = (value) => Number(value || 0).toLocaleString();

// Modernized Metrics Component
function AnalyticsMetric({ icon, label, value, danger }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
      danger ? "border-red-200 bg-red-50/50" : "border-[var(--forsa-border)] bg-white"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${danger ? "text-red-600" : "text-neutral-500"}`}>
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm ${
          danger ? "bg-red-100 text-red-600" : "bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniAnalytics({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-3 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-neutral-900">{value}</p>
    </div>
  );
}

function AnalyticsTab({ analytics, onNewPost }) {
  const rows = analytics.rows || [];
  const totals = analytics.totals || {};
  const bestPost = analytics.bestPost;
  const activePostCount = rows.filter((item) => item.post?.status !== "closed").length;

  return (
    <div className="mt-8 space-y-8">
      {/* Overview Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsMetric icon={<FaBriefcase />} label="Open Opportunities" value={formatNumber(activePostCount)} />
        <AnalyticsMetric icon={<FaEye />} label="Total Views" value={formatNumber(totals.views)} />
        <AnalyticsMetric icon={<FaPaperPlane />} label="Applications" value={formatNumber(totals.applications)} />
        <AnalyticsMetric icon={<FaPercent />} label="Conversion Rate" value={`${totals.conversionRate || 0}%`} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <AnalyticsMetric icon={<FaBookmark />} label="Saves" value={formatNumber(totals.saves)} />
        <AnalyticsMetric icon={<FaShareAlt />} label="Shares" value={formatNumber(totals.shares)} />
        <AnalyticsMetric icon={<FaBullseye />} label="Avg Applicant Fit" value={`${totals.avgFit || 0}%`} />
      </div>

      {totals.reports > 0 && (
        <AnalyticsMetric icon={<FaFlag />} label="Flagged Reports" value={formatNumber(totals.reports)} danger />
      )}

      {/* Best Performing Post Highlight */}
      {bestPost && (
        <div className="rounded-2xl border border-[var(--forsa-border)] bg-gradient-to-r from-white to-[var(--forsa-bg-soft)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--forsa-primary)]">Best Performing Post</p>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 tracking-tight">{bestPost.post.title}</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {bestPost.post.location || "Lebanon"} · <span className="font-medium text-neutral-700">{bestPost.post.pay || "Pay not set"}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full md:w-[360px]">
              <MiniAnalytics label="Views" value={formatNumber(bestPost.views)} />
              <MiniAnalytics label="Apps" value={formatNumber(bestPost.applications)} />
              <MiniAnalytics label="Conv." value={`${bestPost.conversionRate}%`} />
            </div>
          </div>
        </div>
      )}

      {/* Main Table / Empty State */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
            <FaBriefcase className="text-lg" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">No data analytics yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
            Post your first opportunity and start tracking your performance.
          </p>
          <Button onClick={onNewPost} className="mt-6 inline-flex items-center gap-2">
            <FaPlus className="text-xs" /> New Post
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--forsa-border)] bg-white shadow-sm">
          <div className="border-b border-[var(--forsa-border)] px-6 py-5">
            <h3 className="font-bold text-neutral-900 text-lg">Post Performance</h3>
            <p className="text-sm text-neutral-500 mt-0.5">Detailed breakdown of active and historic listings.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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
                  <tr key={row.post.id} className="group hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 max-w-[280px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 truncate">{row.post.title}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          row.post.status === "closed" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {row.post.status === "closed" ? "Closed" : "Live"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {row.post.location || "Lebanon"} · {row.post.category || row.post.type || "Opportunity"}
                      </p>
                      
                      {/* Visual inline conversion bar */}
                      <div className="mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-[var(--forsa-primary)]"
                          style={{ width: `${Math.min(100, Math.max(4, row.conversionRate))}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-neutral-900 text-sm">{formatNumber(row.views)}</td>
                    <td className="px-4 py-4 text-center font-medium text-neutral-600 text-sm">{formatNumber(row.saves)}</td>
                    <td className="px-4 py-4 text-center font-semibold text-neutral-900 text-sm">{formatNumber(row.applications)}</td>
                    <td className="px-4 py-4 text-center font-medium text-neutral-600 text-sm">{formatNumber(row.shares)}</td>
                    <td className="px-4 py-4 text-center font-bold text-neutral-900 text-sm">{row.conversionRate}%</td>
                    <td className="px-4 py-4 text-center font-medium text-neutral-900 text-sm">{row.avgFit || 0}%</td>
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
        <div className="mt-8 max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-600">Please sign in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <AppHeader />

      <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 sm:px-6">
        
        {/* Modernized Header Banner */}
        <div className="rounded-2xl border border-[var(--forsa-border)] bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-[var(--forsa-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--forsa-primary)]">
                <FaBriefcase className="text-[10px]" />
                Employer Workspace
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                Welcome back, {account.name}
              </h1>
              <p className="mt-1.5 text-sm text-neutral-500">
                Track your active job performance metrics and recruitment health in real time.
              </p>
            </div>

            <Button onClick={() => navigate("/post")} className="inline-flex items-center gap-2 self-start md:self-auto shadow-sm">
              <FaPlus className="text-xs" />
              <span>Create Listing</span>
            </Button>
          </div>
        </div>

        <AnalyticsTab analytics={analytics} onNewPost={() => navigate("/post")} />
      </div>
    </section>
  );
}