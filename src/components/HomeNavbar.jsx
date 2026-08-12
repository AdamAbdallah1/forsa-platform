import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaBars, FaTimes } from "react-icons/fa";
import BrandLogo from "./BrandLogo";

export default function HomeNavbar() {
  
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const goTo = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

        {/* Brand */}
        <button
          type="button"
          onClick={() => goTo("/")}
          className="shrink-0 transition-opacity duration-200 hover:opacity-80"
          aria-label="Forsa home"
        >
          <BrandLogo />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <button
            type="button"
            onClick={() => goTo("/explore")}
            className="relative text-[13px] font-medium text-neutral-500 transition-colors duration-200 hover:text-[var(--forsa-primary)]"
          >
            Explore
          </button>

          <button
            type="button"
            onClick={() => goTo("/companies")}
            className="relative text-[13px] font-medium text-neutral-500 transition-colors duration-200 hover:text-[var(--forsa-primary)]"
          >
            Companies
          </button>

          <button
            type="button"
            onClick={() => goTo("/auth")}
            className="relative text-[13px] font-medium text-neutral-500 transition-colors duration-200 hover:text-[var(--forsa-primary)]"
          >
            For employers
          </button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 sm:flex">

          <button
            type="button"
            onClick={() => goTo("/auth")}
            className="rounded-full px-4 py-2.5 text-[13px] font-semibold text-neutral-600 transition-all duration-200 hover:bg-purple-50 hover:text-[var(--forsa-primary)]"
          >
            Log in
          </button>

          <button
            type="button"
            onClick={() => goTo("/auth")}
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(82,39,255,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--forsa-primary-dark)] hover:shadow-[0_8px_22px_rgba(82,39,255,0.22)]"
          >
            Get started

            <FaArrowRight
              className="text-[10px] transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>

        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-neutral-600 transition-all duration-200 hover:border-purple-200 hover:bg-purple-50 hover:text-[var(--forsa-primary)] md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <FaTimes className="text-sm" />
          ) : (
            <FaBars className="text-sm" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="border-t border-neutral-100 bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-3 sm:px-8">

            <button
              type="button"
              onClick={() => goTo("/explore")}
              className="flex items-center justify-between border-b border-neutral-100 py-4 text-left text-sm font-medium text-neutral-700 transition-colors hover:text-[var(--forsa-primary)]"
            >
              Explore opportunities

              <FaArrowRight className="text-[10px] text-neutral-400" />
            </button>

            <button
              type="button"
              onClick={() => goTo("/companies")}
              className="flex items-center justify-between border-b border-neutral-100 py-4 text-left text-sm font-medium text-neutral-700 transition-colors hover:text-[var(--forsa-primary)]"
            >
              Browse companies

              <FaArrowRight className="text-[10px] text-neutral-400" />
            </button>

            <button
              type="button"
              onClick={() => goTo("/auth")}
              className="flex items-center justify-between border-b border-neutral-100 py-4 text-left text-sm font-medium text-neutral-700 transition-colors hover:text-[var(--forsa-primary)]"
            >
              For employers

              <FaArrowRight className="text-[10px] text-neutral-400" />
            </button>

            <div className="grid grid-cols-2 gap-2 pt-4 pb-2">

              <button
                type="button"
                onClick={() => goTo("/auth")}
                className="rounded-full border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 transition-all duration-200 hover:border-purple-200 hover:bg-purple-50 hover:text-[var(--forsa-primary)]"
              >
                Log in
              </button>

              <button
                type="button"
                onClick={() => goTo("/auth")}
                className="rounded-full bg-[var(--forsa-primary)] px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(82,39,255,0.15)] transition-all duration-200 hover:bg-[var(--forsa-primary-dark)]"
              >
                Get started
              </button>

            </div>
          </nav>
        </div>
      )}
    </header>
  );
}