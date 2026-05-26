import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { showToast } from "../lib/Toast";
import {
  FaBell,
  FaCheck,
  FaBriefcase,
  FaUserCheck,
  FaTrash,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import {
  deleteNotification,
  getUserNotifications,
  markNotificationRead,
} from "../lib/notificationService";

const safeJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

export default function Notifications() {
  const account = safeJson("forsaAccount", null);
  const [notifications, setNotifications] = useState(
    safeJson("forsaNotificationsCache", [])
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account?.email) {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      setLoading(true);

      try {
        const data = await getUserNotifications(account.email);
        setNotifications(data);
        localStorage.setItem("forsaNotificationsCache", JSON.stringify(data));
      } catch (error) {
        console.error("Load notifications error:", error);
        setNotifications(safeJson("forsaNotificationsCache", []));
        showToast("Could not refresh notifications. Showing saved data.", "info");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [account?.email]);

  const filteredNotifications = useMemo(() => {
    if (!account?.email) return [];

    return notifications
      .filter((item) => !item.targetEmail || item.targetEmail === account.email)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notifications, account]);

  const unreadCount = filteredNotifications.filter((item) => !item.read).length;

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);

      const updated = notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item
      );

      setNotifications(updated);
      localStorage.setItem("forsaNotificationsCache", JSON.stringify(updated));
      showToast("Notification marked as read");
    } catch (error) {
      console.error("Mark notification error:", error);
      showToast("Could not update notification.", "error");
    }
  };

  const markAllAsRead = async () => {
    const unread = filteredNotifications.filter((item) => !item.read);

    try {
      await Promise.all(unread.map((item) => markNotificationRead(item.id)));

      const updated = notifications.map((item) =>
        !item.targetEmail || item.targetEmail === account.email
          ? { ...item, read: true }
          : item
      );

      setNotifications(updated);
      localStorage.setItem("forsaNotificationsCache", JSON.stringify(updated));
      showToast("All notifications marked as read");
    } catch (error) {
      console.error("Mark all notifications error:", error);
      showToast("Could not update notifications.", "error");
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);

      const updated = notifications.filter((item) => item.id !== id);
      setNotifications(updated);
      localStorage.setItem("forsaNotificationsCache", JSON.stringify(updated));
      showToast("Notification deleted");
    } catch (error) {
      console.error("Delete notification error:", error);
      showToast("Could not delete notification.", "error");
    }
  };

  if (!account) {
    return (
      <section>
        <AppHeader />

        <div className="mx-auto max-w-3xl px-5 py-14 pb-28 sm:px-6 sm:py-20">
          <div className="rounded-[28px] border border-[var(--forsa-border)] bg-white p-6 text-center shadow-sm sm:rounded-[32px] sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full forsa-button text-white">
              <FaBell />
            </div>

            <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Login to view notifications
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
              Notifications help you track applications, updates, and opportunity activity.
            </p>

            <Link
              to="/auth"
              className="mt-7 inline-flex rounded-full forsa-button px-6 py-3 text-sm font-medium text-white"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-5xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-6 flex flex-col gap-4 sm:mt-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Notifications</p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
              Updates and activity
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
              Track applications, status changes, and Forsa activity in one clean inbox.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="w-full rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium transition hover:border-black sm:w-fit"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3">
          <StatCard label="All alerts" value={filteredNotifications.length} />
          <StatCard label="Unread" value={unreadCount} />
          <StatCard label="Read" value={filteredNotifications.length - unreadCount} />
        </div>

        <div className="mt-5 rounded-[28px] border border-[var(--forsa-border)] bg-white p-3 shadow-sm sm:mt-6 sm:rounded-[32px] sm:p-4">
          {loading ? (
            <LoadingNotifications />
          ) : filteredNotifications.length === 0 ? (
            <EmptyNotifications />
          ) : (
            <div className="grid gap-3">
              {filteredNotifications.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  onRead={() => markAsRead(item.id)}
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

  return (
    <article
      className={`rounded-[24px] border p-4 transition sm:rounded-[26px] sm:p-5 ${
        unread ? "border-black bg-[#fafafa]" : "border-[var(--forsa-border)] bg-white"
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${
            unread ? "forsa-button text-white" : "bg-[#f7f7f5] text-neutral-600"
          }`}
        >
          <Icon />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{item.title}</h3>

                {unread && (
                  <span className="rounded-full forsa-button px-2 py-0.5 text-[10px] font-medium text-white">
                    New
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {item.text}
              </p>

              <p className="mt-3 text-xs text-neutral-400">
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              {unread && (
                <button
                  onClick={onRead}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-sm transition hover:border-black"
                  aria-label="Mark as read"
                >
                  <FaCheck />
                </button>
              )}

              <button
                onClick={onDelete}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-sm text-red-600 transition hover:border-red-300"
                aria-label="Delete notification"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function LoadingNotifications() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
      <div className="h-14 w-14 animate-pulse rounded-full bg-[#f7f7f5]" />
      <h2 className="mt-5 text-2xl font-semibold">Loading notifications</h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
        Fetching your latest activity.
      </p>
    </div>
  );
}

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f7f7f5]">
        <FaBell className="text-neutral-500" />
      </div>

      <h2 className="mt-5 text-2xl font-semibold">No notifications yet</h2>

      <p className="mt-3 max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
        Activity like applications and status updates will appear here.
      </p>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[22px] border border-[var(--forsa-border)] bg-white p-4 shadow-sm sm:rounded-[26px]">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}