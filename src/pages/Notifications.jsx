import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { showToast } from "../lib/Toast";
import {
  FaBell,
  FaCheck,
  FaBriefcase,
  FaUserCheck,
  FaTrash,
  FaSpinner,
  FaUserPlus,
  FaTimes,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import {
  deleteNotification,
  getUserNotifications,
  markNotificationRead,
} from "../lib/notificationService";
import {
  acceptConnection,
  rejectConnection,
} from "../lib/connectionService";

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
  const [notifications, setNotifications] = useState(() =>
    safeJson(CACHE_KEY, [])
  );
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
        console.error("Load notifications error:", error);
        showToast("Could not load notifications.", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [account?.email]);

  const filteredNotifications = useMemo(() => {
    if (!account?.email) return [];

    return notifications
      .filter((item) => {
        const target = String(item.targetEmail || "").trim().toLowerCase();
        const email = String(account.email || "").trim().toLowerCase();
        return !target || target === email;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [notifications, account?.email]);

  const stats = useMemo(() => {
    const total = filteredNotifications.length;
    const unread = filteredNotifications.filter((item) => !item.read).length;
    return { total, unread, read: total - unread };
  }, [filteredNotifications]);

  const syncNotifications = (next) => {
    setNotifications(next);
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  };

  const handleMarkAsRead = async (id) => {
    const originalState = [...notifications];

    const updated = notifications.map((item) =>
      item.id === id ? { ...item, read: true } : item
    );

    syncNotifications(updated);

    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error("Notification read error:", error);
      syncNotifications(originalState);
      showToast("Could not mark as read.", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = filteredNotifications.filter((item) => !item.read);
    if (unreadItems.length === 0) return;

    const originalState = [...notifications];
    setBatchActionLoading(true);

    const updated = notifications.map((item) => {
      const target = String(item.targetEmail || "").trim().toLowerCase();
      const email = String(account.email || "").trim().toLowerCase();
      return !target || target === email ? { ...item, read: true } : item;
    });

    syncNotifications(updated);

    try {
      await Promise.all(unreadItems.map((item) => markNotificationRead(item.id)));
      showToast("All notifications marked as read");
    } catch (error) {
      console.error("Batch read error:", error);
      syncNotifications(originalState);
      showToast("Could not mark all as read.", "error");
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    const originalState = [...notifications];

    const updated = notifications.filter((item) => item.id !== id);
    syncNotifications(updated);

    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Notification delete error:", error);
      syncNotifications(originalState);
      showToast("Could not delete notification.", "error");
    }
  };

  const handleAcceptConnection = async (item) => {
    if (!item.connectionId) {
      showToast("Missing connection request.", "error");
      return;
    }

    const originalState = [...notifications];

    const updated = notifications.map((notification) =>
      notification.id === item.id
        ? {
            ...notification,
            read: true,
            accepted: true,
            title: "Connection accepted",
            text: `You accepted ${item.fromName || "this user"}'s connection request.`,
          }
        : notification
    );

    syncNotifications(updated);

    try {
      await acceptConnection(item.connectionId, account);
      await markNotificationRead(item.id);
      showToast("Connection accepted");
    } catch (error) {
      console.error("Accept connection error:", error);
      syncNotifications(originalState);
      showToast(error.message || "Could not accept connection.", "error");
    }
  };

  const handleRejectConnection = async (item) => {
    if (!item.connectionId) {
      showToast("Missing connection request.", "error");
      return;
    }

    const originalState = [...notifications];

    const updated = notifications.filter(
      (notification) => notification.id !== item.id
    );

    syncNotifications(updated);

    try {
      await rejectConnection(item.connectionId);
      await deleteNotification(item.id);
      showToast("Connection rejected");
    } catch (error) {
      console.error("Reject connection error:", error);
      syncNotifications(originalState);
      showToast(error.message || "Could not reject connection.", "error");
    }
  };

  if (!account) {
    return (
      <section className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)] antialiased">
        <AppHeader />

        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[34px] border border-neutral-200/60 bg-white p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.015)] sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl forsa-button text-white shadow-sm">
              <FaBell className="text-lg" />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-[-0.04em] text-neutral-950 sm:text-3xl">
              Login required
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-neutral-500">
              Login to view your updates, application activity, and connection requests.
            </p>

            <Link
              to="/auth"
              className="mt-6 inline-flex items-center justify-center rounded-full forsa-button px-6 py-3.5 text-sm font-bold text-white tracking-tight shadow-sm transition hover:brightness-110"
            >
              Login
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
        <div className="mt-6 flex flex-col gap-6 border-b border-neutral-100 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--forsa-primary)]" />
              Activity center
            </span>

            <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-neutral-950 sm:text-4xl md:text-5xl">
              Updates and activity
            </h1>

            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-neutral-500 sm:text-base">
              Track job updates, messages, and connection requests in one place.
            </p>
          </div>

          {stats.unread > 0 && (
            <button
              disabled={batchActionLoading}
              onClick={handleMarkAllAsRead}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3.5 text-xs font-bold text-neutral-800 shadow-sm transition-all hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit"
            >
              {batchActionLoading && <FaSpinner className="animate-spin" />}
              Mark all as read
            </button>
          )}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="All" value={stats.total} variant="neutral" />
          <StatCard
            label="Unread"
            value={stats.unread}
            variant={stats.unread > 0 ? "active" : "neutral"}
          />
          <StatCard label="Read" value={stats.read} variant="neutral" />
        </div>

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
                  onAccept={() => handleAcceptConnection(item)}
                  onReject={() => handleRejectConnection(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function NotificationCard({ item, onRead, onDelete, onAccept, onReject }) {
  const unread = !item.read;
  const isConnectionRequest =
    item.type === "connection_request" && !item.accepted;
  const Icon =
    item.type === "connection_request" || item.type === "connection_accepted"
      ? FaUserPlus
      : item.type === "application_status"
      ? FaUserCheck
      : FaBriefcase;

  const [isProcessing, setIsProcessing] = useState(false);

  const executeAction = async (actionFn) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await actionFn();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <article
      className={`group relative flex items-start gap-4 p-4 transition-all duration-200 sm:p-5 ${
        unread ? "bg-neutral-50/40" : "bg-transparent"
      }`}
    >
      {unread && (
        <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--forsa-primary)]" />
      )}

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`text-sm font-bold tracking-tight ${
                  unread ? "text-neutral-950" : "text-neutral-700"
                }`}
              >
                {item.title}
              </h3>

              {unread && (
                <span className="inline-flex items-center rounded-md bg-[var(--forsa-primary)]/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[var(--forsa-primary)]">
                  New
                </span>
              )}
            </div>

            <p className="max-w-2xl text-xs font-medium leading-relaxed text-neutral-500 sm:text-sm">
              {item.text}
            </p>

            <p className="pt-1 text-[10px] font-bold tracking-tight text-neutral-400">
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : "Just now"}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5 pt-1 sm:pt-0 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100">
            {isConnectionRequest && (
              <>
                <button
                  disabled={isProcessing}
                  onClick={() => executeAction(onAccept)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--forsa-primary)] px-3 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                >
                  <FaCheck className="text-[10px]" />
                  Accept
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => executeAction(onReject)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50"
                >
                  <FaTimes className="text-[10px]" />
                  Reject
                </button>
              </>
            )}

            {unread && !isConnectionRequest && (
              <button
                disabled={isProcessing}
                onClick={() => executeAction(onRead)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:text-neutral-950 disabled:opacity-50"
                aria-label="Mark as read"
              >
                <FaCheck />
              </button>
            )}

            <button
              disabled={isProcessing}
              onClick={() => executeAction(onDelete)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs text-neutral-400 shadow-sm transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
              aria-label="Delete notification"
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
      <h2 className="mt-4 text-sm font-bold text-neutral-950">
        Loading notifications
      </h2>
      <p className="mt-1 max-w-xs text-xs font-medium leading-relaxed text-neutral-400">
        Fetching your latest activity.
      </p>
    </div>
  );
}

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 px-4 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200/50 bg-neutral-50 text-neutral-400">
        <FaBell className="text-sm" />
      </div>

      <div>
        <h2 className="text-sm font-bold text-neutral-950">No notifications yet</h2>
        <p className="mt-1 max-w-xs text-xs font-medium leading-relaxed text-neutral-400">
          New activity, job updates, and connection requests will appear here.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, variant }) {
  return (
    <div className="rounded-[20px] border border-neutral-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all">
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        {label}
      </p>

      <p
        className={`mt-1.5 text-2xl font-bold tracking-[-0.04em] ${
          variant === "active" ? "text-[var(--forsa-primary)]" : "text-neutral-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}