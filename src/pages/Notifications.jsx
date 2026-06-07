import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { showToast } from "../lib/Toast";
import {
  FaBell,
  FaCheck,
  FaBriefcase,
  FaUserCheck,
  FaTrash,
  FaSpinner,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import {
  deleteNotification,
  getUserNotifications,
  markNotificationRead,
} from "../lib/notificationService";

const CACHE_KEY = "forsaNotificationsCache";

const safeJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

export default function Notifications() {
  const [account] = useState(() => safeJson("forsaAccount", null));
  const [notifications, setNotifications] = useState(() => safeJson(CACHE_KEY, []));
  const [loading, setLoading] = useState(true);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  useEffect(() => {
    if (!account?.email) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadNotifications = async () => {
      try {
        const data = await getUserNotifications(
  String(account.email || "").trim().toLowerCase()
);
        if (isMounted) {
          setNotifications(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }
      } catch (error) {
        console.error("Load notifications fallback loop:", error);
        showToast("Displaying localized offline inbox data assets.", "info");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadNotifications();
    return () => { isMounted = false; };
  }, [account?.email]);

  const filteredNotifications = useMemo(() => {
    if (!account?.email) return [];
    return notifications
      .filter((item) => {
  const target = String(item.targetEmail || "").trim().toLowerCase();
  const email = String(account.email || "").trim().toLowerCase();
  return !target || target === email;
})
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notifications, account?.email]);

  const stats = useMemo(() => {
    const total = filteredNotifications.length;
    const unread = filteredNotifications.filter((item) => !item.read).length;
    return { total, unread, read: total - unread };
  }, [filteredNotifications]);

  const handleMarkAsRead = async (id) => {
    const originalState = [...notifications];
    
    // Optimistic client-side state mutation
    const updated = notifications.map((item) =>
      item.id === id ? { ...item, read: true } : item
    );
    setNotifications(updated);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));

    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error("Mutation failure:", error);
      setNotifications(originalState);
      localStorage.setItem(CACHE_KEY, JSON.stringify(originalState));
      showToast("Sync transaction aborted. Please try again.", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = filteredNotifications.filter((item) => !item.read);
    if (unreadItems.length === 0) return;

    const originalState = [...notifications];
    setBatchActionLoading(true);

    // Optimistic batch updates
    const updated = notifications.map((item) =>
      !item.targetEmail || item.targetEmail === account.email
        ? { ...item, read: true }
        : item
    );
    setNotifications(updated);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));

    try {
      await Promise.all(unreadItems.map((item) => markNotificationRead(item.id)));
      showToast("Inbox clear status synced");
    } catch (error) {
      console.error("Batch mutation failure:", error);
      setNotifications(originalState);
      localStorage.setItem(CACHE_KEY, JSON.stringify(originalState));
      showToast("Could not clear notification queue indices.", "error");
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    const originalState = [...notifications];
    
    // Optimistic eviction processing
    const updated = notifications.filter((item) => item.id !== id);
    setNotifications(updated);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));

    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Eviction handling fault:", error);
      setNotifications(originalState);
      localStorage.setItem(CACHE_KEY, JSON.stringify(originalState));
      showToast("Failed to safely destroy notification resource node.", "error");
    }
  };

  if (!account) {
    return (
      <section className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)] antialiased">
        <AppHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[34px] border border-neutral-200/60 bg-white p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.015)] space-y-6 sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl forsa-button text-white shadow-sm">
              <FaBell className="text-lg" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-[-0.04em] text-neutral-950 sm:text-3xl">
                Identity Verification Required
              </h1>
              <p className="mx-auto max-w-md text-sm font-medium text-neutral-500 leading-relaxed">
                Unlock your centralized notification repository data to track inbound application feedback cycles and Forsa platform hooks.
              </p>
            </div>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-full forsa-button px-6 py-3.5 text-sm font-bold text-white tracking-tight shadow-sm transition hover:brightness-110"
            >
              Authenticate Account Setup
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)] antialiased">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-20">
        
        {/* Header Block Layer */}
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-neutral-100 pb-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--forsa-primary)] animate-pulse" />
              Operational Log
            </span>
            <h1 className="text-3xl font-bold tracking-[-0.05em] text-neutral-950 sm:text-4xl md:text-5xl">
              Updates and activity
            </h1>
            <p className="text-sm sm:text-base font-medium text-neutral-500 leading-relaxed max-w-xl">
              Track lifecycle tracking indicators, application feedback arrays, and Forsa infrastructure logs.
            </p>
          </div>

          {stats.unread > 0 && (
            <button
              disabled={batchActionLoading}
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center justify-center gap-2 w-full rounded-full border border-neutral-200 bg-white px-5 py-3.5 text-xs font-bold text-neutral-800 shadow-sm transition-all hover:border-neutral-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit"
            >
              {batchActionLoading && <FaSpinner className="animate-spin" />}
              Mark all records as read
            </button>
          )}
        </div>

        {/* Aggregate Stats Dashboard Modules */}
        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="All Signals" value={stats.total} variant="neutral" />
          <StatCard label="Pending Action" value={stats.unread} variant={stats.unread > 0 ? "active" : "neutral"} />
          <StatCard label="Cleared logs" value={stats.read} variant="neutral" />
        </div>

        {/* Main Interface Content Box Container */}
        <div className="mt-6 rounded-[32px] border border-neutral-200/70 bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.015)] sm:p-4">
          {loading ? (
            <LoadingNotifications />
          ) : filteredNotifications.length === 0 ? (
            <EmptyNotifications />
          ) : (
            <div className="divide-y divide-neutral-100/70">
              {filteredNotifications.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  onRead={() => handleMarkAsRead(item.id)}
                  onDelete={() => handleDeleteNotification(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function NotificationCard({ item, onRead, onDelete }) {
  const unread = !item.read;
  const Icon = item.type === "application_status" ? FaUserCheck : FaBriefcase;
  const [isProcessing, setIsProcessing] = useState(false);

  const executeAction = async (actionFn) => {
    if (isProcessing) return;
    setIsProcessing(true);
    await actionFn();
    // component safely tears down or updates context parent dynamically
  };

  return (
    <article
      className={`group relative flex items-start gap-4 p-4 transition-all duration-200 sm:p-5 ${
        unread ? "bg-neutral-50/40" : "bg-transparent"
      }`}
    >
      {/* Unread Visual Tracker Dot */}
      {unread && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[var(--forsa-primary)]" />
      )}

      {/* Dynamic Render Icon Containers */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
          unread
            ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
            : "border-neutral-200/60 bg-neutral-50 text-neutral-500"
        }`}
      >
        <Icon className="text-xs" />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`text-sm font-bold tracking-tight ${unread ? "text-neutral-950" : "text-neutral-700"}`}>
                {item.title}
              </h3>
              {unread && (
                <span className="inline-flex items-center rounded-md bg-[var(--forsa-primary)]/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[var(--forsa-primary)]">
                  New
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-medium leading-relaxed text-neutral-500 max-w-2xl">
              {item.text}
            </p>

            <p className="text-[10px] font-bold text-neutral-400 tracking-tight pt-1">
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}
            </p>
          </div>

          {/* Action Module Interfaces */}
          <div className="flex items-center gap-1.5 pt-1 sm:pt-0 shrink-0 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {unread && (
              <button
                disabled={isProcessing}
                onClick={() => executeAction(onRead)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:text-neutral-950 disabled:opacity-50"
                aria-label="Mark tracking telemetry item as read"
              >
                <FaCheck />
              </button>
            )}

            <button
              disabled={isProcessing}
              onClick={() => executeAction(onDelete)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs text-neutral-400 shadow-sm transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
              aria-label="Evict record row data node"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function LoadingNotifications() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <FaSpinner className="h-8 w-8 animate-spin text-neutral-400" />
      <h2 className="mt-4 text-sm font-bold text-neutral-950">Synchronizing database changes</h2>
      <p className="mt-1 text-xs font-medium text-neutral-400 max-w-xs leading-relaxed">
        Polling streaming network interface endpoints for mutations.
      </p>
    </div>
  );
}

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center space-y-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-50 border border-neutral-200/50 text-neutral-400">
        <FaBell className="text-sm" />
      </div>
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-neutral-950">Inbox completely verified</h2>
        <p className="text-xs font-medium text-neutral-400 max-w-xs leading-relaxed">
          Operational log returns zero unread references. New records append dynamically.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, variant }) {
  return (
    <div className="rounded-[20px] border border-neutral-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all">
      <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tracking-[-0.04em] ${
        variant === "active" ? "text-[var(--forsa-primary)]" : "text-neutral-950"
      }`}>
        {value}
      </p>
    </div>
  );
}