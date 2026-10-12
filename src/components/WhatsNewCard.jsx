import { Link } from "react-router-dom";
import { FaTag, FaBug, FaMagic } from "react-icons/fa";

const CATEGORY_CONFIG = {
  new: {
    label: "New",
    icon: FaMagic,
    className: "bg-emerald-100 text-emerald-800",
  },
  improved: {
    label: "Improved",
    icon: FaTag,
    className: "bg-blue-100 text-blue-800",
  },
  fixed: {
    label: "Fixed",
    icon: FaBug,
    className: "bg-amber-100 text-amber-800",
  },
};

/**
 * Individual release entry card.
 * Receives a single entry object from the release data.
 */
export default function WhatsNewCard({ entry }) {
  const config = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.improved;
  const Icon = config.icon;

  return (
    <article className="rounded-[24px] border border-[var(--forsa-border)] bg-white p-5 sm:p-6 transition hover:border-[var(--forsa-primary)]/50 hover:shadow-[0_8px_30px_rgba(109,40,217,0.08)]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${config.className}`}>
          <Icon className="text-[9px]" />
          {config.label}
        </span>
      </div>

      <h3 className="font-['Sora',sans-serif] text-lg font-semibold text-neutral-950 leading-tight mb-2">
        {entry.title}
      </h3>

      <p className="text-sm leading-6 text-neutral-600 mb-4">
        {entry.description}
      </p>

      {entry.relatedRoutes && entry.relatedRoutes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.relatedRoutes.map((route) => (
            <Link
              key={route}
              to={route}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--forsa-border)] bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
            >
              <span className="text-[10px] font-medium text-neutral-400">Open</span>
              <span className="font-mono text-[10px]">{route}</span>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}