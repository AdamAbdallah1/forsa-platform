import { useState } from "react";

const SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp or community groups" },
  { value: "friends_family", label: "Friends or family" },
  { value: "university", label: "University or educational institution" },
  { value: "search", label: "Google or another search engine" },
  { value: "other", label: "Other" },
];

export function SignupSource({
  value,
  onChange,
  otherValue,
  onOtherChange,
  error,

}) {
  const [showOtherInput, setShowOtherInput] = useState(false);

  const handleChange = (sourceValue) => {
    onChange(sourceValue);
    if (sourceValue === "other") {
      setShowOtherInput(true);
    } else {
      setShowOtherInput(false);
    }
  };


  return (
    <div className="w-full">
      <label className="block text-xs font-semibold tracking-tight text-neutral-700">
        How did you hear about Forsa?
        <span className="text-[var(--forsa-primary)]" aria-hidden="true">*</span>
      </label>

      <p className="mt-1 text-xs text-neutral-500">
        Help us understand how people discover Forsa.
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {SOURCES.map((source) => (
          <button
            key={source.value}
            type="button"
            onClick={() => handleChange(source.value)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 active:scale-[0.97] ${
              value === source.value
                ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)]/10 text-[var(--forsa-primary)] shadow-sm"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
            }`}
            aria-pressed={value === source.value}
          >
            {source.label}
          </button>
        ))}
      </div>

      {showOtherInput && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="w-full">
            <label className="block text-xs font-semibold tracking-tight text-neutral-700">
              Please specify
            </label>
            <div className="forsa-focus mt-1.5 flex min-h-12 items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 focus-within:border-[var(--forsa-primary)] focus-within:ring-4 focus-within:ring-[var(--forsa-primary)]/10">
              <input
                type="text"
                value={otherValue}
                onChange={(e) => onOtherChange(e.target.value)}
                placeholder="Please tell us where you heard about Forsa"
                className={`w-full min-w-0 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 ${
                  !otherValue.trim() ? "border-red-300 bg-red-50/50" : "border-[var(--forsa-border)] bg-white"
                }`}
              />
            </div>
          </div>
          {!otherValue.trim() && (
            <p className="text-[11px] font-medium text-red-600" role="alert">
              Please tell us where you heard about Forsa.
            </p>
          )}
        </div>
      )}

      {error && !showOtherInput && (
        <p className="mt-2 text-[11px] font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default SignupSource;