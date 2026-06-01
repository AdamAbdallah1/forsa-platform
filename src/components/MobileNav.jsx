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
    { label: "Applicants", to: "/applicants", icon: FaUsers },
    { label: "Post", to: "/post", icon: FaPlus },
    { label: "Messages", to: "/messages", icon: FaPaperPlane },
    { label: "Profile", to: "/profile", icon: FaUser },
  ];

  const items = !account ? guestItems : isHiring ? hiringItems : seekerItems;

  const gridConfig = {
    1: "grid-cols-1 max-w-[120px]", 
    4: "grid-cols-4",
    5: "grid-cols-5",
  };
  const currentGridClass = gridConfig[items.length] || "grid-cols-5";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] md:hidden">
      <div className={`mx-auto rounded-[24px] border border-white/60 bg-white/70 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.7)] backdrop-blur-xl transition-all duration-300 ${items.length === 1 ? 'max-w-[100px]' : 'max-w-md'}`}>
        <div className={`grid gap-0.5 ${currentGridClass} mx-auto`}>
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex min-h-[56px] flex-col items-center justify-center rounded-[18px] px-1 py-1.5 text-[10px] font-medium tracking-wide uppercase transition-all duration-300 active:scale-90 ${
                    isActive
                      ? "text-[var(--forsa-primary)] font-bold bg-[var(--forsa-primary)]/[0.04]"
                      : "text-neutral-400 hover:text-neutral-600 active:bg-neutral-100/50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`transition-transform duration-300 ${isActive ? "-translate-y-1 scale-110 text-[var(--forsa-primary)]" : ""}`}>
                      <Icon className="text-[16px]" />
                    </div>
                    
                    <span className="mt-1.5 text-[9px] leading-none tracking-tight font-semibold">
                      {item.label}
                    </span>

                    {isActive && (
                      <div className="absolute bottom-1 h-[3px] w-4 rounded-full bg-[var(--forsa-primary)] shadow-[0_1px_4px_rgba(0,0,0,0.15)] animate-fade-in" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}