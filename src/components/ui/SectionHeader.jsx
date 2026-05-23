export default function SectionHeader({
  eyebrow,
  title,
  text,
  align = "left",
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p className="text-sm font-medium text-neutral-500">{eyebrow}</p>
      )}

      <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">
        {title}
      </h2>

      {text && <p className="mt-4 leading-7 text-neutral-600">{text}</p>}
    </div>
  );
}