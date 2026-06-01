import { NavLink, useLocation } from "react-router-dom";
import {
  FaBriefcase,
  FaCompass,
  FaPaperPlane,
  FaPlus,
  FaUser,
  FaUsers,
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

  const guestItems = [
    { label: "Explore", to: "/explore", icon: FaCompass },
  ];

  const seekerItems = [
    { label: "Explore", to: "/explore", icon: FaCompass },
    { label: "Saved", to: "/saved", icon: FaBriefcase },
    { label: "Messages", to: "/messages", icon: FaPaperPlane },
    { label: "Profile", to: "/profile", icon: FaUser },
  ];

  const hiringItems = [
    { label: "Explore", to: "/explore", icon: FaCompass },
    { label: "Post", to: "/post", icon: FaPlus },
    { label: "Applicants", to: "/applicants", icon: FaUsers },
    { label: "Messages", to: "/messages", icon: FaPaperPlane },
    { label: "Profile", to: "/profile", icon: FaUser },
  ];

  const items = !account ? guestItems : isHiring ? hiringItems : seekerItems;

  return (
    // pb-[env(safe-area-inset-bottom,20px)] ensures it sits perfectly above iOS/Android home bars
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] md:hidden">
      <div className="mx-auto max-w-sm rounded-[24px] border border-neutral-200/40 bg-white/75 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.05)] backdrop-blur-xl">
        {/* flex instead of grid handles 1 item or 5 items flawlessly without stretching */}
        <div className="flex items-center justify-around gap-1">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex h-12 w-12 items-center justify-center rounded-[18px] transition-all duration-300 active:scale-90 ${
                    isActive
                      ? "bg-[var(--forsa-primary)]/10 text-[var(--forsa-primary)]"
                      : "text-neutral-400 active:bg-neutral-100"
                  }`
                }
                title={item.label}
              >
                {({ isActive }) => (
                  <div className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                    <Icon className="text-[18px]" />
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}