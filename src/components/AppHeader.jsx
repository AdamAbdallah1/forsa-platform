import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaBookmark,
  FaCompass,
  FaPlus,
  FaUser,
  FaUsers,
  FaTachometerAlt,
} from "react-icons/fa";
import BrandLogo from "./BrandLogo";
import { BsFillPeopleFill } from "react-icons/bs";

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

  const account = safeJson("forsaAccount", null);
  const notifications = safeJson("forsaNotificationsCache", []);

  const isHiring = account?.accountType === "hiring";
  const isAuthPage = location.pathname === "/auth";

  const unread = notifications.filter(
    (item) =>
      !item.read &&
      (!item.targetEmail || item.targetEmail === account?.email)
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

              <NavLink to="/applicants" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <FaUsers className="text-[11px]" />
                  Applicants
                </span>
              </NavLink>

              <NavLink to="/post" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <FaPlus className="text-[11px]" />
                  Post
                </span>
              </NavLink>

              <NavLink to="/profile" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <FaUser className="text-[11px]" />
                  Profile
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

              <NavLink to="/profile" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <FaUser className="text-[11px]" />
                  Profile
                </span>
              </NavLink>
            </>
          )}

        </nav>

        <div className="flex items-center gap-2">

          {account ? (
            <>
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

                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--forsa-gold)] px-1 text-[9px] font-bold text-black ring-2 ring-[var(--forsa-bg)]">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </NavLink>

              <button
                onClick={() =>
                  navigate(isHiring ? "/applicants" : "/applications")
                }
                className="hidden rounded-full bg-[var(--forsa-primary)] px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.01] hover:bg-[var(--forsa-primary-light)] sm:block"
              >
                {isHiring ? "Applicants" : "Applications"}
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