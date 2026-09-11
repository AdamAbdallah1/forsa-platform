import { useEffect, useId, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaAngleDown,
  FaBell,
  FaBriefcase,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import { logout } from "../lib/auth";

function initialsOf(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "F";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AccountMenu({
  account,
  containerClassName = "",
  showLabel = true,
  notificationCount = 0,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuId = useId();

  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);

  const name = account?.name || account?.companyName || "Account";
  const email = account?.email || "";

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        close();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onWindowBlur = () => close();

    window.addEventListener("blur", onWindowBlur);

    return () => window.removeEventListener("blur", onWindowBlur);
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[0]?.focus();
  }, [open]);

  const handleMenuKeyDown = (event) => {
    const items = itemRefs.current.filter(Boolean);

    if (!items.length) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const currentIndex = items.indexOf(document.activeElement);
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex =
        currentIndex === -1
          ? 0
          : (currentIndex + delta + items.length) % items.length;
      items[nextIndex]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
    }
  };

  const go = (to) => {
    close();
    navigate(to);
  };

  const handleSignOut = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (signingOut) return;

    setSigningOut(true);

    try {
      await logout();
      close();
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Sign out failed:", error);
      setSigningOut(false);
    }
  };

  const items = [
    {
      key: "account",
      icon: FaUser,
      label: "Account",
      to: "/profile",
      active: location.pathname === "/profile",
    },
    {
      key: "applications",
      icon: FaBriefcase,
      label: "My applications",
      to: "/applications",
      active: location.pathname === "/applications",
    },
    {
      key: "notifications",
      icon: FaBell,
      label: "Notifications",
      to: "/notifications",
      active: location.pathname === "/notifications",
      badge: notificationCount,
    },
  ];

  const avatar = (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--forsa-primary),var(--forsa-glow))] text-xs font-bold text-white">
      {initialsOf(name)}
    </span>
  );

  const triggerSurface = open
    ? "border-[var(--forsa-primary)] bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)] shadow-sm"
    : "border-[var(--forsa-border)] bg-white text-neutral-700 shadow-sm hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]";

  return (
    <div ref={rootRef} className={`relative ${containerClassName}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={`transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 ${
          showLabel
            ? `flex h-9 items-center gap-2 rounded-full border pr-2 text-sm font-semibold ${triggerSurface}`
            : `flex h-9 w-9 items-center justify-center rounded-full border ${
                open
                  ? "border-[var(--forsa-primary)] ring-2 ring-[var(--forsa-primary)]/25"
                  : "border-neutral-200/80"
              }`
        }`}
      >
        {avatar}
        {showLabel && (
          <>
            <span className="max-w-24 truncate">{name}</span>
            <FaAngleDown
              className={`text-[9px] text-neutral-500 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label="Account menu"
        onKeyDown={handleMenuKeyDown}
        className={`absolute right-0 top-[calc(100%+8px)] z-50 w-64 max-w-[calc(100vw-1.5rem)] origin-top-right rounded-2xl border border-[var(--forsa-border)] bg-white p-1.5 shadow-[0_24px_70px_rgba(40,20,80,0.18)] transition-[opacity,transform,visibility] duration-150 ease-out ${
          open
            ? "visible translate-y-0 scale-100 opacity-100"
            : "pointer-events-none invisible -translate-y-1 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-xl bg-[var(--forsa-bg)] p-2.5">
          {avatar}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight text-[var(--forsa-text)]">
              {name}
            </p>
            <p className="mt-0.5 truncate text-[11px] leading-tight text-neutral-500">
              {email}
            </p>
          </div>
        </div>

        <div className="mx-2 my-1.5 h-px bg-[var(--forsa-border)]" />

        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              type="button"
              role="menuitem"
              onClick={() => go(item.to)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] ${
                item.active
                  ? "bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
                  : "text-neutral-700 hover:bg-neutral-50 hover:text-[var(--forsa-primary)]"
              }`}
            >
              <Icon className="text-xs" />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--forsa-gold)] px-1 text-[9px] font-bold text-black">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="mx-2 my-1.5 h-px bg-[var(--forsa-border)]" />

        <button
          ref={(el) => {
            itemRefs.current[items.length] = el;
          }}
          type="button"
          role="menuitem"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--forsa-red)] transition-colors duration-150 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-red)] disabled:cursor-wait disabled:opacity-60"
        >
          <FaSignOutAlt className="text-xs" />
          <span className="flex-1">Sign out</span>
          {signingOut && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--forsa-red)]/25 border-t-[var(--forsa-red)]" />
          )}
        </button>
      </div>
    </div>
  );
}