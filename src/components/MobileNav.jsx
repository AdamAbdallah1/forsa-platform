import { NavLink, useLocation } from "react-router-dom";
import {
  FaBell,
  FaBriefcase,
  FaCompass,
  FaPaperPlane,
  FaUser,
} from "react-icons/fa";

function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export default function MobileNav() {
  const location = useLocation();

  const hiddenRoutes = ["/", "/auth", "/onboarding"];
  if (hiddenRoutes.includes(location.pathname)) return null;

  const account = safeJson("forsaAccount", null);
  const isHiring = account?.accountType === "hiring";

  const notifications = safeJson("forsaNotificationsCache", []);
  const unread = notifications.filter(
    (item) =>
      !item.read && (!item.targetEmail || item.targetEmail === account?.email)
  ).length;

  const guestItems = [{ label: "Explore", to: "/explore", icon: FaCompass }];

  const userItems = [
    { label: "Explore", to: "/explore", icon: FaCompass },
    {
  label: isHiring ? "Post" : "Saved",
  to: isHiring ? "/post" : "/saved",
  icon: FaBriefcase,
},
    { label: "Messages", to: "/messages", icon: FaPaperPlane },
    { label: "Alerts", to: "/notifications", icon: FaBell, count: unread },
    { label: "Profile", to: "/profile", icon: FaUser },
  ];

  const items = account ? userItems : guestItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 md:hidden">
      <div className="mx-auto max-w-md rounded-[24px] border border-[var(--forsa-border)] bg-white/90 p-1.5 shadow-[0_18px_45px_rgba(18,60,47,0.16)] backdrop-blur-2xl">
        <div
          className={`grid gap-1 ${
            account ? "grid-cols-5" : "grid-cols-1"
          }`}
        >
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex min-h-[54px] flex-col items-center justify-center rounded-[18px] px-2 py-2 text-[11px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--forsa-primary)] text-white shadow-sm"
                      : "text-neutral-500 hover:bg-[var(--forsa-bg)] hover:text-[var(--forsa-primary)]"
                  }`
                }
              >
                <Icon className="mb-1 text-sm" />
                <span className="leading-none">{item.label}</span>

                {item.count > 0 && (
                  <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--forsa-gold)] px-1 text-[9px] font-bold text-black ring-2 ring-white">
                    {item.count > 9 ? "9+" : item.count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}