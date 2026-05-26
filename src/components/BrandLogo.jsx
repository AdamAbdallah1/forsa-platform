import { Link } from "react-router-dom";

export default function BrandLogo({ to = "/" }) {
  return (
    <Link to={to} className="group inline-flex items-center">
      <span
        className="
          relative
          text-[27px]
          font-black
          lowercase
          leading-none
          tracking-[-0.075em]
          text-[var(--forsa-text)]
          transition
          duration-300
          group-hover:text-[var(--forsa-primary)]
          sm:text-[30px]
        "
        style={{
          fontFamily:
            '"Plus Jakarta Sans", "Inter", "SF Pro Display", system-ui, sans-serif',
        }}
      >
        forsa
        <span className="absolute -right-2 top-0 h-1.5 w-1.5 rounded-full bg-[var(--forsa-primary)] shadow-[0_0_18px_rgba(109,40,217,0.65)]" />
      </span>
    </Link>
  );
}