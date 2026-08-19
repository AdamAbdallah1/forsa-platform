import { Link } from "react-router-dom";

export default function BrandLogo({ to = "/" }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center"
      aria-label="Forsa"
    >
      <img
        src="/forsa-logo.svg"
        alt="Forsa"
        className="h-8 w-auto transition duration-300 group-hover:opacity-80 sm:h-7"
      />
    </Link>
  );
}