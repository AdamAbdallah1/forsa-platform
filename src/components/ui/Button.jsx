export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-[var(--forsa-primary)] text-white shadow-[0_8px_20px_rgba(109,40,217,0.16)] hover:bg-[var(--forsa-primary-dark)] hover:shadow-[0_10px_24px_rgba(109,40,217,0.22)]",
    secondary:
      "border border-[var(--forsa-border)] bg-white text-neutral-800 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]",
    ghost: "text-neutral-600 hover:bg-[var(--forsa-bg-soft)] hover:text-[var(--forsa-primary)]",
    light: "border border-transparent bg-[var(--forsa-bg-soft)] text-neutral-900 hover:border-[var(--forsa-border)] hover:bg-white",
  };

  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}