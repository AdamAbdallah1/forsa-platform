import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import {
  FaArrowRight,
  FaBriefcase,
  FaCheck,
  FaFileAlt,
  FaGlobe,
  FaLaptopCode,
  FaMapMarkerAlt,
  FaPlus,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import { showToast } from "../lib/Toast";

const skillOptions = [
  "React",
  "JavaScript",
  "Frontend",
  "Backend",
  "WordPress",
  "Shopify",
  "Design",
  "UI/UX",
  "Marketing",
  "Video editing",
  "Photography",
  "Writing",
  "Sales",
  "Customer service",
  "Barista",
  "Waiter",
  "Cashier",
  "Delivery",
  "Data entry",
];

const lookingOptions = [
  "Internship",
  "Freelance",
  "Part-time",
  "Full-time",
  "Remote",
  "Project",
  "Startup project",
  "Collaboration",
];

const availabilityOptions = [
  "Immediately",
  "This week",
  "Weekends",
  "After classes",
  "Evenings",
  "Flexible",
];

const safeJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

export default function Onboarding() {
  const navigate = useNavigate();

  // Lazy Initialization Strategy to Prevent Memory/Storage Sync Drops
  const [savedAccount] = useState(() => safeJson("forsaAccount", null));
  const [savedProfile] = useState(() => safeJson("forsaProfile", {
    skills: [],
    lookingFor: [],
    cityPreference: "",
    availability: "",
    portfolio: "",
    cv: null,
  }));

  const [step, setStep] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState(() => savedProfile.skills || []);
  const [selectedLooking, setSelectedLooking] = useState(() => savedProfile.lookingFor || []);
  const [cityPreference, setCityPreference] = useState(
    () => savedProfile.cityPreference || savedAccount?.city || ""
  );
  const [availability, setAvailability] = useState(() => savedProfile.availability || "");
  const [portfolio, setPortfolio] = useState(() => savedProfile.portfolio || "");
  const [customSkill, setCustomSkill] = useState("");

  const steps = [
    {
      label: "Location",
      title: "Where can you work?",
      text: "Set your preferred city and availability so Forsa can show better local matches.",
    },
    {
      label: "Skills",
      title: "What can you do?",
      text: "Choose skills that describe your work. These help power Forsa Fit.",
    },
    {
      label: "Goals",
      title: "What are you looking for?",
      text: "Pick the type of opportunities you want to receive.",
    },
    {
      label: "Finish",
      title: "Make your profile stronger.",
      text: "Add a portfolio link or continue now and complete it later.",
    },
  ];

  // Structural Alignment Score Calculations
  const progress = useMemo(() => {
    let score = 0;
    if (cityPreference.trim()) score += 20;
    if (availability) score += 15;
    if (selectedSkills.length >= 2) score += 30;
    else if (selectedSkills.length > 0) score += 15;
    if (selectedLooking.length > 0) score += 25;
    if (portfolio.trim() || savedProfile.cv) score += 10;
    return Math.min(100, score);
  }, [cityPreference, availability, selectedSkills, selectedLooking, portfolio, savedProfile.cv]);

  const canMoveStep = () => {
    if (step === 0) return cityPreference.trim() && availability;
    if (step === 1) return selectedSkills.length > 0;
    if (step === 2) return selectedLooking.length > 0;
    return true;
  };

  const canFinish = useMemo(() => {
    return (
      cityPreference.trim().length > 0 &&
      availability.length > 0 &&
      selectedSkills.length > 0 &&
      selectedLooking.length > 0
    );
  }, [cityPreference, availability, selectedSkills, selectedLooking]);

  const toggle = (item, state, setState) => {
    setState(
      state.includes(item)
        ? state.filter((value) => value !== item)
        : [...state, item]
    );
  };

  const addCustomSkill = () => {
    const value = customSkill.trim();
    if (!value) return;

    if (!selectedSkills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSelectedSkills((prev) => [...prev, value]);
    } else {
      showToast("Skill already selected", "info");
    }
    setCustomSkill("");
  };

  const nextStep = () => {
    if (!canMoveStep()) {
      showToast("Complete this step first", "info");
      return;
    }
    setStep((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const saveProfile = () => {
    if (!canFinish) {
      showToast("Complete the required profile basics", "info");
      return;
    }

    localStorage.setItem(
      "forsaProfile",
      JSON.stringify({
        ...savedProfile,
        skills: selectedSkills,
        lookingFor: selectedLooking,
        cityPreference: cityPreference.trim(),
        availability,
        portfolio: portfolio.trim(),
        cv: savedProfile.cv || null,
        completedAt: new Date().toISOString(),
      })
    );

    showToast("Profile completed successfully");
    navigate("/explore");
  };

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)] antialiased selection:bg-[var(--forsa-primary)] selection:text-white">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mt-6 grid grid-cols-1 gap-8 sm:mt-10 lg:grid-cols-[0.84fr_1.16fr] lg:gap-12">
          
          {/* Sidebar Controller Anchor */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-6 sm:space-y-8">
            <div className="relative overflow-hidden rounded-[34px] border border-neutral-200/60 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.015)] sm:p-8">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--forsa-primary)]/5 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[var(--forsa-primary)]/5 blur-3xl" />

              <div className="relative space-y-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--forsa-primary)]" />
                  Configuration
                </span>

                <h1 className="text-3xl font-bold tracking-[-0.05em] text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.05]">
                  Build your opportunity profile.
                </h1>

                <p className="text-sm leading-relaxed text-neutral-500 font-medium">
                  Add your skills, goals, availability, and location parameters so Forsa can deploy native matching layout layers.
                </p>
              </div>
            </div>

            {/* Completion Node Matrix */}
            <div className="rounded-[28px] border border-neutral-200/70 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.01)] sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold tracking-tight text-neutral-950">Profile strength</p>
                  <p className="mt-0.5 text-xs font-medium text-neutral-400">
                    Strong profiles maximize fit verification.
                  </p>
                </div>
                <span className="rounded-full forsa-button px-3 py-1 text-xs font-bold text-white shadow-sm">
                  {progress}%
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full rounded-full forsa-button transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid gap-2.5">
                <StepDone done={Boolean(cityPreference.trim()) && Boolean(availability)} text="Location and availability" />
                <StepDone done={selectedSkills.length > 0} text="Skills configuration" />
                <StepDone done={selectedLooking.length > 0} text="Target goals mapped" />
                <StepDone done={Boolean(portfolio.trim() || savedProfile.cv)} text="Portfolio or CV data assets" />
              </div>
            </div>
          </aside>

          {/* Core Multi-Step Configuration Interface */}
          <div className="overflow-hidden rounded-[34px] border border-neutral-200/70 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.015)]">
            
            {/* Step Navigation Bar */}
            <div className="border-b border-neutral-100 bg-neutral-50/50 p-4 sm:p-5">
              <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                {steps.map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (index <= step || canMoveStep()) setStep(index);
                      else showToast("Complete current step parameters first", "info");
                    }}
                    className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-bold tracking-tight transition-all duration-200 active:scale-[0.97] ${
                      step === index
                        ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                        : index < step
                        ? "border-neutral-200 bg-neutral-100 text-neutral-800"
                        : "border-neutral-200/80 bg-white text-neutral-400 hover:border-neutral-300"
                    }`}
                  >
                    {index + 1}. {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Step Window View */}
            <div className="p-5 sm:p-8 space-y-6">
              <div className="rounded-2xl bg-neutral-50/80 border border-neutral-100/70 p-5 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--forsa-primary)]">
                  Step {step + 1} of {steps.length}
                </p>
                <h2 className="text-2xl font-bold tracking-[-0.04em] text-neutral-950 sm:text-3xl">
                  {steps[step].title}
                </h2>
                <p className="text-sm leading-relaxed text-neutral-500 font-medium">
                  {steps[step].text}
                </p>
              </div>

              {/* Step Components Routing */}
              {step === 0 && (
                <div className="grid gap-5">
                  <FieldBlock icon={<FaMapMarkerAlt />} title="Preferred location" subtitle="City, area, or remote choice infrastructure.">
                    <input
                      value={cityPreference}
                      onChange={(e) => setCityPreference(e.target.value)}
                      placeholder="Beirut, Tripoli, Saida, Remote..."
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-medium text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-neutral-50/20"
                    />
                  </FieldBlock>

                  <FieldBlock icon={<FaGlobe />} title="Availability tracking" subtitle="When are you fully available to deploy output?">
                    <div className="flex flex-wrap gap-2">
                      {availabilityOptions.map((item) => (
                        <ChoicePill key={item} active={availability === item} onClick={() => setAvailability(item)}>
                          {item}
                        </ChoicePill>
                      ))}
                    </div>
                  </FieldBlock>
                </div>
              )}

              {step === 1 && (
                <OptionSection
                  icon={<FaLaptopCode />}
                  title="Your unique skills"
                  subtitle="Choose the parameters that best align with your stack."
                  options={skillOptions}
                  selected={selectedSkills}
                  onToggle={(skill) => toggle(skill, selectedSkills, setSelectedSkills)}
                  customSkill={customSkill}
                  setCustomSkill={setCustomSkill}
                  addCustomSkill={addCustomSkill}
                />
              )}

              {step === 2 && (
                <OptionSection
                  icon={<FaBriefcase />}
                  title="Looking for"
                  subtitle="Map out your operational targets."
                  options={lookingOptions}
                  selected={selectedLooking}
                  onToggle={(item) => toggle(item, selectedLooking, setSelectedLooking)}
                />
              )}

              {step === 3 && (
                <div className="grid gap-5">
                  <FieldBlock icon={<FaGlobe />} title="Portfolio / LinkedIn / Digital Hub" subtitle="Highly recommended link node parameters.">
                    <input
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="https://your-portfolio.com"
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-medium text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
                    />
                  </FieldBlock>

                  <div className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 border border-neutral-200/50 text-neutral-400">
                        <FaFileAlt className="text-sm" />
                      </div>
                      <div>
                        <p className="text-xs font-bold tracking-tight text-neutral-950 uppercase mt-0.5">CV metadata asset</p>
                        <p className="mt-1 text-sm leading-relaxed text-neutral-500 font-medium">
                          {savedProfile.cv
                            ? `${savedProfile.cv.name} successfully mounted.`
                            : "No localized CV compiled. You can manage attachments in your dashboard profile loops later."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <ProfilePreview
                    skills={selectedSkills}
                    lookingFor={selectedLooking}
                    city={cityPreference}
                    availability={availability}
                    portfolio={portfolio}
                  />
                </div>
              )}

              {/* Dynamic Bottom Context Footer Controls */}
              <div className="sticky bottom-0 -mx-5 mt-8 border-t border-neutral-100 bg-white/95 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0">
                <div className="grid gap-3 grid-cols-[0.35fr_0.65fr] sm:grid-cols-[140px_1fr]">
                  <button
                    type="button"
                    onClick={() => setStep((prev) => Math.max(0, prev - 1))}
                    disabled={step === 0}
                    className={`rounded-full border py-3.5 text-sm font-bold tracking-tight transition-all duration-200 ${
                      step === 0
                        ? "cursor-not-allowed border-neutral-100 text-neutral-300 bg-neutral-50/50"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 active:scale-[0.98]"
                    }`}
                  >
                    Back
                  </button>

                  {step < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="forsa-button flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 active:scale-[0.98] hover:brightness-110"
                    >
                      Continue
                      <FaArrowRight className="text-xs" />
                    </button>
                  ) : (
                    <button
                      disabled={!canFinish}
                      onClick={saveProfile}
                      className={`flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 text-sm font-bold transition-all duration-300 ${
                        canFinish
                          ? "forsa-button text-white hover:brightness-110 hover:shadow-[0_8px_24px_rgba(82,39,255,0.15)] active:scale-[0.98]"
                          : "cursor-not-allowed bg-neutral-100 text-neutral-400 border border-neutral-200/50"
                      }`}
                    >
                      Finish and explore
                      <FaArrowRight className="text-xs" />
                    </button>
                  )}
                </div>

                {!canFinish && step === steps.length - 1 && (
                  <p className="mt-3 text-center text-xs font-semibold text-neutral-400">
                    Complete basic requirements (Location, Availability, Skills, & Goals) to safely dispatch compilation parameters.
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
}

function OptionSection({
  icon,
  title,
  subtitle,
  options,
  selected,
  onToggle,
  customSkill,
  setCustomSkill,
  addCustomSkill,
}) {
  return (
    <div className="space-y-4">
      <FieldBlock icon={icon} title={title} subtitle={subtitle}>
        <div className="flex flex-wrap gap-2">
          {options.map((item) => {
            const isSelected = selected.includes(item);
            return (
              <ChoicePill key={item} active={isSelected} onClick={() => onToggle(item)}>
                {isSelected && <FaCheck className="text-[10px]" />}
                {item}
              </ChoicePill>
            );
          })}
        </div>

        {setCustomSkill && (
          <div className="mt-4 flex gap-2 rounded-2xl border border-neutral-200 bg-white p-1.5 focus-within:border-neutral-400 transition-all">
            <input
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
              placeholder="Inject custom capability node..."
              className="min-w-0 flex-1 bg-transparent px-2.5 text-sm font-medium text-neutral-800 outline-none placeholder:text-neutral-400"
            />
            <button
              type="button"
              onClick={addCustomSkill}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-neutral-900 transition-all duration-200"
            >
              <FaPlus className="text-[9px]" />
              Append
            </button>
          </div>
        )}
      </FieldBlock>

      {selected.length > 0 && (
        <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/40 p-4 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Selected Node Registry
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onToggle(item)}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-red-200 hover:text-red-600 transition-all duration-150"
              >
                {item}
                <FaTimes className="text-[9px] text-neutral-400 group-hover:text-red-500" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldBlock({ icon, title, subtitle, children }) {
  return (
    <div className="rounded-[24px] border border-neutral-200/70 bg-white p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl forsa-button text-white shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-neutral-950">{title}</p>
          <p className="text-xs font-medium text-neutral-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ChoicePill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
        active
          ? "border-neutral-950 forsa-button text-white shadow-sm"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
      }`}
    >
      {children}
    </button>
  );
}

function ProfilePreview({ skills, lookingFor, city, availability, portfolio }) {
  return (
    <div className="rounded-[24px] border border-neutral-200/70 bg-gradient-to-br from-white to-neutral-50/50 p-5 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Live configuration preview</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <PreviewItem title="Location Core" text={city || "Unset Parameter"} />
        <PreviewItem title="Availability Vector" text={availability || "Unset Parameter"} />
        <PreviewItem title="Skills Map" text={skills.length ? skills.join(", ") : "Empty Matrix"} />
        <PreviewItem title="Target Parameters" text={lookingFor.length ? lookingFor.join(", ") : "Empty Matrix"} />
      </div>

      {portfolio && (
        <p className="truncate rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-500">
          <span className="font-bold text-neutral-800">Deployment Node:</span> {portfolio}
        </p>
      )}
    </div>
  );
}

function PreviewItem({ title, text }) {
  return (
    <div className="rounded-xl border border-neutral-200/50 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">{title}</p>
      <p className="mt-1 line-clamp-2 text-sm font-bold text-neutral-800 tracking-tight leading-relaxed">{text}</p>
    </div>
  );
}

function StepDone({ done, text }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-200/40 bg-neutral-50/40 p-3.5 transition-all duration-300">
      <div className="flex items-center gap-3.5">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs transition-all duration-300 ${
            done ? "forsa-button text-white shadow-sm" : "bg-white text-neutral-400 border border-neutral-200"
          }`}
        >
          {done ? <FaCheck className="text-[9px]" /> : <FaUser className="text-[9px]" />}
        </div>
        <p className={`text-sm font-semibold tracking-tight transition-all duration-300 ${done ? "text-neutral-900" : "text-neutral-400"}`}>
          {text}
        </p>
      </div>
    </div>
  );
}