import { NavLink, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaBriefcase,
  FaCompass,
  FaPaperPlane,
  FaPlus,
  FaUser,
} from "react-icons/fa";
import BrandLogo from "/BrandLogo";

export default function AppHeader() {
  const navigate = useNavigate();

  const account = JSON.parse(localStorage.getItem("forsaAccount")) || null;

  const notifications =
    JSON.parse(localStorage.getItem("forsaNotifications")) || [];

  const unreadNotifications = notifications.filter(
    (item) =>
      !item.read &&
      (!item.targetEmail || item.targetEmail === account?.email)
  ).length;

  const isHiring = account?.accountType === "hiring";

  const linkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-black text-white"
        : "text-neutral-600 hover:bg-[#f1f1ef]"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-[#f7f7f5]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
        <div
          onClick={() => navigate("/")}
          className="cursor-pointer"
        >
          <BrandLogo />
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          <NavLink to="/explore" className={linkClass}>
            <span className="flex items-center gap-2">
              <FaCompass className="text-xs" />
              Explore
            </span>
          </NavLink>

          {account && (
            <>
              {isHiring && (
                <NavLink to="/post" className={linkClass}>
                  <span className="flex items-center gap-2">
                    <FaPlus className="text-xs" />
                    Post
                  </span>
                </NavLink>
              )}

              <NavLink to="/messages" className={linkClass}>
                <span className="flex items-center gap-2">
                  <FaPaperPlane className="text-xs" />
                  Messages
                </span>
              </NavLink>

              <NavLink to="/profile" className={linkClass}>
                <span className="flex items-center gap-2">
                  <FaUser className="text-xs" />
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
                  `relative flex h-11 w-11 items-center justify-center rounded-full border transition ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white hover:border-neutral-400"
                  }`
                }
              >
                <FaBell className="text-sm" />

                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadNotifications > 9
                      ? "9+"
                      : unreadNotifications}
                  </span>
                )}
              </NavLink>

              <button
                onClick={() => navigate(isHiring ? "/post" : "/explore")}
                className="hidden rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 sm:block"
              >
                {isHiring ? "Post opportunity" : "Explore"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/explore")}
                className="hidden rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium transition hover:border-neutral-500 sm:block"
              >
                Explore
              </button>

              <button
                onClick={() => navigate("/auth")}
                className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Join Forsa
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}