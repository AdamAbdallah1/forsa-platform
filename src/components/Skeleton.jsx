export default function Skeleton({
  className = "",
}) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[#ede9fe] ${className}`}
    />
  );
}