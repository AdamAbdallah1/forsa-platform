import { Link } from "react-router-dom";

export default function BrandLogo({ to = "/", size = "md" }) {
  const sizes = {
    sm: "h-7 w-7",
    md: "h-15 w-15",
    lg: "h-10 w-10",
  };

  return (
    <Link to={to} className="inline-flex items-center gap-2">
      <img
        src="/f-logo.png"
        alt="Forsa"
        className={`${sizes[size]} object-contain`}
      />
    </Link>
  );
}