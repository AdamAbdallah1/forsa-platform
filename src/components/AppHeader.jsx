import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaBookmark,
  FaCompass,
  FaPlus,
  FaBriefcase,
  FaUsers,
  FaTachometerAlt,
  FaInbox,
} from "react-icons/fa";
import { BsFillPeopleFill } from "react-icons/bs";

import BrandLogo from "./BrandLogo";

function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const [account, setAccount] = useState(() =>
    safeJson("forsaAccount", null)
  );

  const [notifications, setNotifications] = useState(() =>
    safeJson("forsaNotificationsCache", [])
  );

  const isHiring = account?.accountType === "hiring";
  const isAuthPage = location.pathname === "/auth";

  useEffect(() => {
    const refreshHeader = () => {
      setAccount(safeJson("forsaAccount", null));
      setNotifications(safeJson("forsaNotificationsCache", []));
    };

    refreshHeader();

    window.addEventListener("storage", refreshHeader);
    window.addEventListener("forsa:notifications-updated", refreshHeader);
    window.addEventListener("forsa:account-updated", refreshHeader);

    return () => {
      window.removeEventListener("storage", refreshHeader);
      window.removeEventListener(
        "forsa:notifications-updated",
        refreshHeader
      );
      window.removeEventListener("forsa:account-updated", refreshHeader);
    };
  }, []);

  const unreadNotifications = notifications.filter(
    (item) =>
      !item.read &&
      (!item.targetEmail || item.targetEmail === account?.email)
  );

  const unreadNot = unreadNotifications.length;

  const unreadMessages = unreadNotifications.filter(
    (item) => item.type === "message"
  ).length;

  const linkClass = ({ isActive }) =>
    `rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
      isActive
        ? "bg-[var(--forsa-primary)] text-white shadow-sm"
        : "text-neutral-500 hover:bg-white/80 hover:text-[var(--forsa-primary)]"
    }`;

  return (
    <header className="sticky top-0 z-40 border-[var(--forsa-border)]/80 bg-[var(--forsa-bg)]/85 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5 sm:px-6">
        <button
          onClick={() => navigate("/")}
          className="group flex shrink-0 items-center gap-2"
        >
          <BrandLogo />
        </button>

        <nav className="hidden items-center gap-1.5 rounded-full border border-[var(--forsa-border)] bg-white/65 p-1 shadow-sm lg:flex">
          {account && isHiring && (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <FaTachometerAlt className="text-[11px]" />
                  Dashboard
                </span>
              </NavLink>

              <NavLink to="/post" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <FaPlus className="text-[11px]" />
                  Post
                </span>
              </NavLink>

              <NavLink to="/applicants" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <FaUsers className="text-[11px]" />
                  Applicants
                </span>
              </NavLink>
            </>
          )}

          {account && !isHiring && (
            <>
              <NavLink to="/explore" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <FaCompass className="text-[11px]" />
                  Explore
                </span>
              </NavLink>

              <NavLink to="/saved" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <FaBookmark className="text-[11px]" />
                  Saved
                </span>
              </NavLink>

              <NavLink to="/people" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <BsFillPeopleFill className="text-[11px]" />
                  Connect
                </span>
              </NavLink>

              <NavLink to="/applications" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <FaBriefcase className="text-[11px]" />
                  Applications
                </span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {account ? (
            <>
              <NavLink
                to="/messages"
                className={({ isActive }) =>
                  `relative flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-all duration-200 ${
                    isActive
                      ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white shadow-sm"
                      : "border-[var(--forsa-border)] bg-white/80 text-neutral-600 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
                  }`
                }
              >
                <FaInbox className="text-xs" />

                {unreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--forsa-gold)] px-1 text-[9px] font-bold text-black ring-2 ring-[var(--forsa-bg)]">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </NavLink>

              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `relative flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-all duration-200 ${
                    isActive
                      ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white shadow-sm"
                      : "border-[var(--forsa-border)] bg-white/80 text-neutral-600 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
                  }`
                }
              >
                <FaBell className="text-xs" />

                {unreadNot > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--forsa-gold)] px-1 text-[9px] font-bold text-black ring-2 ring-[var(--forsa-bg)]">
                    {unreadNot > 9 ? "9+" : unreadNot}
                  </span>
                )}
              </NavLink>

              <button
                onClick={() => navigate("/profile")}
                className="hidden rounded-full bg-[var(--forsa-primary)] px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.01] hover:bg-[var(--forsa-primary-light)] sm:block"
              >
                Profile
              </button>
            </>
          ) : !isAuthPage ? (
            <button
              onClick={() => navigate("/auth")}
              className="rounded-full bg-[var(--forsa-primary)] px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.01] hover:bg-[var(--forsa-primary-light)]"
            >
              Join
            </button>
          ) : (
            <button
              onClick={() => navigate("/explore")}
              className="rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--forsa-primary)] transition hover:border-[var(--forsa-primary)]"
            >
              Explore
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
