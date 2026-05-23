import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaCheck,
  FaBriefcase,
  FaUserCheck,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";

export default function Notifications() {
  const account =
    JSON.parse(localStorage.getItem("forsaAccount")) || null;

  const [notifications, setNotifications] = useState(
    JSON.parse(localStorage.getItem("forsaNotifications")) || []
  );

  const filteredNotifications = useMemo(() => {
    if (!account?.email) return [];

    return notifications.filter(
      (item) =>
        !item.targetEmail ||
        item.targetEmail === account.email
    );
  }, [notifications, account]);

  const unreadCount = filteredNotifications.filter(
    (item) => !item.read
  ).length;

  const markAsRead = (id) => {
    const updated = notifications.map((item) =>
      item.id === id
        ? {
            ...item,
            read: true,
          }
        : item
    );

    setNotifications(updated);

    localStorage.setItem(
      "forsaNotifications",
      JSON.stringify(updated)
    );
  };

  const markAllAsRead = () => {
    const updated = notifications.map((item) => ({
      ...item,
      read: true,
    }));

    setNotifications(updated);

    localStorage.setItem(
      "forsaNotifications",
      JSON.stringify(updated)
    );
  };

  if (!account) {
    return (
      <section>
        <AppHeader />

        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-[32px] border border-neutral-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
              <FaBell />
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em]">
              Login to view notifications
            </h1>

            <p className="mx-auto mt-4 max-w-md leading-7 text-neutral-600">
              Notifications help you track applications, updates,
              and opportunity activity.
            </p>

            <Link
              to="/auth"
              className="mt-7 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
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

      <div className="mx-auto max-w-5xl px-6 pb-20">
        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              Notifications
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">
              Updates and activity
            </h1>

            <p className="mt-4 max-w-xl leading-7 text-neutral-600">
              Stay updated with applications, status changes,
              and platform activity.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium transition hover:border-black"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="mt-8 rounded-[32px] border border-neutral-200 bg-white p-4 shadow-sm">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f7f7f5]">
                <FaBell className="text-neutral-500" />
              </div>

              <h2 className="mt-5 text-2xl font-semibold">
                No notifications yet
              </h2>

              <p className="mt-3 max-w-md leading-7 text-neutral-600">
                Activity like applications and status updates
                will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredNotifications.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-[26px] border p-5 transition ${
                    item.read
                      ? "border-neutral-200 bg-white"
                      : "border-black bg-[#fafafa]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full ${
                          item.read
                            ? "bg-[#f7f7f5]"
                            : "bg-black text-white"
                        }`}
                      >
                        {item.type === "application_status" ? (
                          <FaUserCheck />
                        ) : (
                          <FaBriefcase />
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-neutral-600">
                          {item.text}
                        </p>

                        <p className="mt-3 text-xs text-neutral-400">
                          {new Date(
                            item.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {!item.read && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="rounded-full border border-neutral-300 bg-white p-2 text-sm transition hover:border-black"
                      >
                        <FaCheck />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}