import { NavLink } from "react-router-dom";
import { FaBell, FaBriefcase, FaCompass, FaPaperPlane, FaUser } from "react-icons/fa";
import { useLocation } from "react-router-dom";

export default function MobileNav() {
  const account = JSON.parse(localStorage.getItem("forsaAccount")) || null;
  const isHiring = account?.accountType === "hiring";

  const location = useLocation();

const hiddenRoutes = ["/", "/auth", "/onboarding"];

if (hiddenRoutes.includes(location.pathname)) return null;

  const notifications = JSON.parse(localStorage.getItem("forsaNotifications")) || [];
  const unread = notifications.filter(
    (item) => !item.read && (!item.targetEmail || item.targetEmail === account?.email)
  ).length;

  const items = [
    { label: "Explore", to: "/explore", icon: FaCompass },
    { label: isHiring ? "Post" : "Saved", to: isHiring ? "/post" : "/profile", icon: FaBriefcase },
    { label: "Messages", to: "/messages", icon: FaPaperPlane },
    { label: "Alerts", to: "/notifications", icon: FaBell, count: unread },
    { label: "Profile", to: "/profile", icon: FaUser },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-[#f7f7f5]/90 px-3 py-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] transition ${
                  isActive ? "bg-black text-white" : "text-neutral-500"
                }`
              }
            >
              <Icon className="mb-1 text-sm" />
              {item.label}

              {item.count > 0 && (
                <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white ring-2 ring-[#f7f7f5]">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}