import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaBookmark,
  FaBriefcase,
  FaCompass,
  FaInbox,
  FaPlus,
  FaTachometerAlt,
  FaUsers,
} from "react-icons/fa";
import { BsFillPeopleFill } from "react-icons/bs";

function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const [account, setAccount] = useState(() =>
    safeJson("forsaAccount", null)
  );

  const [notifications, setNotifications] = useState(() =>
    safeJson("forsaNotificationsCache", [])
  );

  const [hiddenOnScroll, setHiddenOnScroll] = useState(false);

  useEffect(() => {
    const refreshHeader = () => {
      setAccount(safeJson("forsaAccount", null));
      setNotifications(safeJson("forsaNotificationsCache", []));
    };

    refreshHeader();

    window.addEventListener("storage", refreshHeader);
    window.addEventListener("forsa:account-updated", refreshHeader);
    window.addEventListener("forsa:notifications-updated", refreshHeader);

    return () => {
      window.removeEventListener("storage", refreshHeader);
      window.removeEventListener("forsa:account-updated", refreshHeader);
      window.removeEventListener(
        "forsa:notifications-updated",
        refreshHeader
      );
    };
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastY;

        if (currentY <= 24) {
          setHiddenOnScroll(false);
        } else if (diff > 10) {
          setHiddenOnScroll(true);
        } else if (diff < -10) {
          setHiddenOnScroll(false);
        }

        lastY = currentY;
        ticking = false;
      });

      ticking = true;
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const hiddenRoutes = ["/", "/auth", "/onboarding"];

  const modalOpen =
    document.body.classList.contains("forsa-modal-open") ||
    document.documentElement.classList.contains("forsa-modal-open");

  if (modalOpen) return null;

  if (hiddenRoutes.includes(location.pathname)) return null;

  const isHiring = account?.accountType === "hiring";

  const unreadNotifications = notifications.filter(
    (item) =>
      !item.read &&
      (!item.targetEmail || item.targetEmail === account?.email)
  );

  const unreadNotificationsCount = unreadNotifications.length;

  const unreadMessagesCount = unreadNotifications.filter(
    (item) => item.type === "message"
  ).length;

  const seekerItems = [
    {
      label: "Explore",
      to: "/explore",
      icon: FaCompass,
    },
    {
      label: "Saved",
      to: "/saved",
      icon: FaBookmark,
    },
    {
      label: "Connect",
      to: "/people",
      icon: BsFillPeopleFill,
    },
    {
      label: "Applications",
      to: "/applications",
      icon: FaBriefcase,
    },
  ];

  const hiringItems = [
    {
      label: "Dashboard",
      to: "/dashboard",
      icon: FaTachometerAlt,
    },
    {
      label: "Post",
      to: "/post",
      icon: FaPlus,
    },
    {
      label: "Applicants",
      to: "/applicants",
      icon: FaUsers,
    },
  ];

  const items = account
    ? isHiring
      ? hiringItems
      : seekerItems
    : [];

  if (!items.length) return null;

  return (
    <>
      <div
  className={`fixed right-3 top-3 z-50 flex items-center gap-2 transition-all duration-300 ease-out md:hidden ${
    hiddenOnScroll
      ? "pointer-events-none -translate-y-[130%] opacity-0"
      : "translate-y-0 opacity-100"
  }`}
>
        <NavLink
          to="/messages"
          aria-label="Messages"
          className={({ isActive }) =>
            `relative flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-200 active:scale-95 ${
              isActive
                ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white shadow-sm"
                : "border-neutral-200/80 bg-white/90 text-neutral-600 shadow-sm hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
            }`
          }
        >
          <FaInbox className="text-[12px]" />

          {unreadMessagesCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--forsa-gold)] px-1 text-[9px] font-bold leading-none text-black ring-2 ring-white">
              {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/notifications"
          aria-label="Notifications"
          className={({ isActive }) =>
            `relative flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-200 active:scale-95 ${
              isActive
                ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white shadow-sm"
                : "border-neutral-200/80 bg-white/90 text-neutral-600 shadow-sm hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
            }`
          }
        >
          <FaBell className="text-[12px]" />

          {unreadNotificationsCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--forsa-gold)] px-1 text-[9px] font-bold leading-none text-black ring-2 ring-white">
              {unreadNotificationsCount > 9
                ? "9+"
                : unreadNotificationsCount}
            </span>
          )}
        </NavLink>

        <button
          type="button"
          aria-label="Profile"
          onClick={() => navigate("/profile")}
          className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-200 active:scale-95 ${
            location.pathname === "/profile"
              ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white shadow-sm"
              : "border-neutral-200/80 bg-[var(--forsa-primary)] text-white shadow-sm hover:bg-[var(--forsa-primary-light)]"
          }`}
        >
          <span className="text-[11px] font-bold">
            {account?.name?.trim()?.charAt(0)?.toUpperCase() || "P"}
          </span>
        </button>
      </div>

      <nav
        aria-label="Mobile navigation"
        className={`fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] transition-all duration-300 ease-out md:hidden ${
          hiddenOnScroll
            ? "pointer-events-none translate-y-[130%] opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="mx-auto w-full max-w-[430px]">
          <div className="rounded-[22px] border border-neutral-200/80 bg-white/90 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.10)] backdrop-blur-xl">
            <div
              className={`grid ${
                items.length === 3 ? "grid-cols-3" : "grid-cols-4"
              } gap-1`}
            >
              {items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `relative flex min-w-0 flex-col items-center justify-center rounded-[16px] px-1 py-2.5 transition-all duration-200 active:scale-[0.96] ${
                        isActive
                          ? "bg-[var(--forsa-primary)]/[0.07] text-[var(--forsa-primary)]"
                          : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`text-[15px] transition-transform duration-200 ${
                            isActive ? "scale-105" : ""
                          }`}
                        />

                        <span
                          className={`mt-1.5 max-w-full truncate text-[9px] leading-none tracking-[-0.01em] ${
                            isActive ? "font-bold" : "font-semibold"
                          }`}
                        >
                          {item.label}
                        </span>

                        {isActive && (
                          <span className="absolute bottom-1 h-[2.5px] w-4 rounded-full bg-[var(--forsa-primary)]" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}