export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#ede9fe] ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)]" />
    </div>
  );
}