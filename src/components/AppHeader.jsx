import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaBell, FaCompass, FaPaperPlane, FaPlus, FaUser } from "react-icons/fa";
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

  const account = safeJson("forsaAccount", null);
  const notifications = safeJson("forsaNotifications", []);
  const isHiring = account?.accountType === "hiring";
  const isAuthPage = location.pathname === "/auth";

  const unread = notifications.filter(
    (item) => !item.read && (!item.targetEmail || item.targetEmail === account?.email)
  ).length;

  const linkClass = ({ isActive }) =>
    `rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
      isActive ? "bg-black text-white" : "text-neutral-500 hover:bg-white hover:text-black"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-[#f7f7f5]/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-2.5 sm:px-6">
        <button onClick={() => navigate("/")} className="shrink-0 scale-[0.92]">
          <BrandLogo />
        </button>

        <nav className="hidden items-center gap-1.5 lg:flex">
          <NavLink to="/explore" className={linkClass}>
            <span className="flex items-center gap-1.5">
              <FaCompass className="text-[11px]" />
              Explore
            </span>
          </NavLink>

          {account && (
            <>
              {isHiring && (
                <NavLink to="/post" className={linkClass}>
                  <span className="flex items-center gap-1.5">
                    <FaPlus className="text-[11px]" />
                    Post
                  </span>
                </NavLink>
              )}

              <NavLink to="/messages" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <FaPaperPlane className="text-[11px]" />
                  Messages
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
                  `relative flex h-9 w-9 items-center justify-center rounded-full border text-sm transition ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white/80 text-neutral-600 hover:border-neutral-400"
                  }`
                }
              >
                <FaBell className="text-xs" />

                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </NavLink>

              <button
                onClick={() => navigate(isHiring ? "/post" : "/explore")}
                className="hidden rounded-full bg-black px-4 py-2 text-[13px] font-medium text-white transition hover:bg-neutral-800 sm:block"
              >
                {isHiring ? "Post" : "Explore"}
              </button>
            </>
          ) : (
            <>
              {!isAuthPage ? (
                <button
                  onClick={() => navigate("/auth")}
                  className="rounded-full bg-black px-4 py-2 text-[13px] font-medium text-white transition hover:bg-neutral-800"
                >
                  Join
                </button>
              ) : (
                <button
                  onClick={() => navigate("/explore")}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-[13px] font-medium transition hover:border-neutral-500"
                >
                  Explore
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}