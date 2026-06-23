export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-[var(--forsa-primary)] text-white hover:bg-[var(--forsa-primary-dark)]",
    secondary:
      "border border-neutral-300 bg-white text-black hover:border-neutral-500",
    ghost: "text-neutral-600 hover:bg-white hover:text-black",
    light: "bg-white text-black hover:bg-neutral-200",
  };

  return (
    <button
      className={`rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}