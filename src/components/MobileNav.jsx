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
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 md:hidden">
      <div className="mx-auto max-w-md rounded-[26px] border border-white/70 bg-white/90 p-1.5 shadow-[0_18px_50px_rgba(109,40,217,0.16)] backdrop-blur-2xl">
        <div
          className={`grid gap-1 ${
            items.length === 5
              ? "grid-cols-5"
              : items.length === 4
              ? "grid-cols-4"
              : "grid-cols-1"
          }`}
        >
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex min-h-[54px] flex-col items-center justify-center rounded-[20px] px-1.5 py-2 text-[10.5px] font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[linear-gradient(135deg,var(--forsa-primary),var(--forsa-glow))] text-white shadow-[0_10px_24px_rgba(109,40,217,0.22)]"
                      : "text-neutral-500 hover:bg-[var(--forsa-bg-soft)] hover:text-[var(--forsa-primary)]"
                  }`
                }
              >
                <Icon className="mb-1 text-sm" />
                <span className="leading-none">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}