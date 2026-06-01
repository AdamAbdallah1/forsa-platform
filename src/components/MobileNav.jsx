import { NavLink, useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
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
  const containerRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

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

  // Calculates the position of the active link to slide the liquid pill smoothly
  useEffect(() => {
    if (!containerRef.current) return;
    
    const activeEl = containerRef.current.querySelector(".nav-item-active");
    
    if (activeEl) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      
      setPillStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
        opacity: 1,
      });
    } else {
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [location.pathname, items.length]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] md:hidden pointer-events-none">
      <div 
        ref={containerRef}
        className="relative mx-auto max-w-sm rounded-[24px] pointer-events-auto border border-white/60 bg-white/60 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.6)] backdrop-blur-xl transition-all duration-300"
      >
        {/* iOS Fluid Liquid Active Background Pill */}
        <div
          style={{
            transform: `translateX(${pillStyle.left}px)`,
            width: `${pillStyle.width}px`,
            opacity: pillStyle.opacity,
          }}
          className="absolute top-1.5 bottom-1.5 left-0 rounded-[18px] bg-[var(--forsa-primary)]/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1)"
        />

        {/* Navigation Items Track */}
        <div className="relative z-10 flex items-center justify-around gap-1">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex h-12 w-12 items-center justify-center rounded-[18px] transition-colors duration-300 active:scale-90 ${
                    isActive
                      ? "text-[var(--forsa-primary)] nav-item-active"
                      : "text-neutral-500/80 hover:text-neutral-800"
                  }`
                }
                title={item.label}
              >
                {({ isActive }) => (
                  <div className={`transition-transform duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${isActive ? "scale-110" : ""}`}>
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