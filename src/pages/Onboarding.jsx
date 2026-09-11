import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { requestWelcomeEmail } from "../lib/welcomeEmail";
import { requestProfileCompleteEmail } from "../lib/profileCompleteEmail";
import {
  requestCvUpload,
  uploadCvToR2,
  CV_MAX_BYTES,
} from "../lib/cvUpload";

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
  const { account: savedAccount } = useAuth();

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
  const [cv, setCv] = useState(() => savedProfile.cv || null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUploadError, setCvUploadError] = useState("");
  const cvFileInputRef = useRef(null);
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
    if (portfolio.trim() || cv) score += 10;
    return Math.min(100, score);
  }, [cityPreference, availability, selectedSkills, selectedLooking, portfolio, cv]);

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

  const persistCv = async (nextCv) => {
    setCv(nextCv);

    localStorage.setItem(
      "forsaProfile",
      JSON.stringify({
        ...savedProfile,
        skills: selectedSkills,
        lookingFor: selectedLooking,
        cityPreference: cityPreference.trim(),
        availability,
        portfolio: portfolio.trim(),
        cv: nextCv,
      })
    );

    if (savedAccount?.uid) {
      await setDoc(
        doc(db, "users", savedAccount.uid),
        {
          cv: nextCv,
          publicCv: nextCv,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  };

  const handleCvFileSelect = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || cvUploading) {
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      /\.pdf$/i.test(file.name);

    if (!isPdf) {
      setCvUploadError("Only PDF files are supported.");
      return;
    }

    if (file.size > CV_MAX_BYTES) {
      setCvUploadError("Your CV must be 5 MB or smaller.");
      return;
    }

    setCvUploading(true);
    setCvUploadError("");

    try {
      const { uploadUrl, objectKey } = await requestCvUpload(
        file.name,
        file.size
      );

      await uploadCvToR2(uploadUrl, file);

      await persistCv({
        name: file.name,
        type: "pdf",
        storage: "r2",
        objectKey,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("CV upload failed:", error);
      setCvUploadError(
        error.message || "Could not upload your CV. Please try again."
      );
    } finally {
      setCvUploading(false);
    }
  };

  const nextStep = () => {
    if (!canMoveStep()) {
      showToast("Complete this step first", "info");
      return;
    }
    setStep((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const saveProfile = async () => {
    if (!canFinish) {
      showToast("Complete the required profile basics", "info");
      return;
    }

    const nextProfile = {
      ...savedProfile,
      skills: selectedSkills,
      lookingFor: selectedLooking,
      cityPreference: cityPreference.trim(),
      availability,
      portfolio: portfolio.trim(),
      cv: cv || null,
      completedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "forsaProfile",
      JSON.stringify(nextProfile)
    );

    /*
     * Persist the completed profile to Firestore so the server can
     * judge profile completeness independently from users/{uid}.
     * Onboarding previously only wrote to localStorage (except the CV),
     * which would have made the server-side profile-complete check
     * impossible for onboarding-completed profiles.
     */
    if (savedAccount?.uid) {
      try {
        await setDoc(
          doc(db, "users", savedAccount.uid),
          {
            name: savedAccount.name || "",
            city: cityPreference.trim(),
            availability,
            skills: selectedSkills,
            lookingFor: selectedLooking,
            cv: cv || null,
            portfolioLinks: portfolio.trim() || "",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Onboarding Firestore sync failed:", error);
      }
    }

    /*
     * Trigger the one-time welcome email ONLY after the profile has
     * been successfully saved.
     *
     * This is the exact and only registration-completion moment:
     * - a new user's after-registration flow ends here,
     * - it never runs on login, on page render, or on profile editing,
     * - the server independently authenticates the user and enforces
     *   exactly-once delivery via an atomic Firestore claim, so
     *   double clicks / repeated requests cannot send duplicates,
     * - it is non-blocking: the email can never fail profile creation.
     */
    void requestWelcomeEmail();

    /*
     * Trigger the one-time profile-complete email. It runs after the
     * Firestore sync above so the server reads the persisted profile.
     * Independent of the welcome email: same claim pattern, separate
     * marker (profileCompleteEmailSentAt), seeker-only, and no-op for
     * an incomplete profile.
     */
    void requestProfileCompleteEmail();

    showToast("Profile completed successfully");
    navigate("/explore", { replace: true });
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


                <h1 className="text-3xl font-bold tracking-[-0.05em] text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.05]">
                  Build your opportunity profile.
                </h1>

                <p className="text-sm leading-relaxed text-neutral-500 font-medium">
                  Add your skills, goals, availability, and location so Forsa can show more relevant opportunities.
                </p>
              </div>
            </div>

            {/* Completion Node Matrix */}
            <div className="rounded-[28px] border border-neutral-200/70 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.01)] sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold tracking-tight text-neutral-950">Profile strength</p>
                  <p className="mt-0.5 text-xs font-medium text-neutral-400">
                    Complete profiles get better matches.
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
                <StepDone done={selectedSkills.length > 0} text="Skills added" />
                <StepDone done={selectedLooking.length > 0} text="Work preferences" />
                <StepDone done={Boolean(portfolio.trim() || cv)} text="Portfolio or CV" />
              </div>
            </div>
          </aside>

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
                        ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white shadow-sm"
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

            <div className="p-5 sm:p-8 space-y-6">
              <div className="rounded-2xl bg-neutral-50/80 border border-neutral-100/70 p-5 space-y-1.5">

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
                  <FieldBlock icon={<FaMapMarkerAlt />} title="Preferred location" subtitle="Tell employers where you can work.">
                    <input
                      value={cityPreference}
                      onChange={(e) => setCityPreference(e.target.value)}
                      placeholder="Beirut, Tripoli, Saida, Remote..."
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-medium text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-[var(--forsa-primary)] focus:ring-4 focus:ring-[var(--forsa-primary)]/10"
                    />
                  </FieldBlock>

                  <FieldBlock icon={<FaGlobe />} title="Availability" subtitle="When could you start working?">
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
                  <FieldBlock icon={<FaGlobe />} title="Portfolio or LinkedIn" subtitle="Add a link so employers can learn more about your work.">
                    <input
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="https://your-portfolio.com"
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-medium text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-[#824DED]"
                    />
                  </FieldBlock>

                  <div className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 border border-neutral-200/50 text-neutral-400">
                        <FaFileAlt className="text-sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold tracking-tight text-neutral-950 uppercase mt-0.5">CV or resume</p>
                        <p className="mt-1 text-sm leading-relaxed text-neutral-500 font-medium">
                          Upload your CV as a PDF. PDFs only, up to 5 MB. This step is optional.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      {cv ? (
                        <div className="flex flex-col gap-3 rounded-2xl bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-900">{cv.name}</p>
                            <p className="mt-0.5 text-xs text-neutral-500">is attached to your profile.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => cvFileInputRef.current?.click()}
                            disabled={cvUploading}
                            className="shrink-0 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-500 disabled:cursor-wait disabled:opacity-60"
                          >
                            {cvUploading ? "Uploading…" : "Replace CV"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => cvFileInputRef.current?.click()}
                          disabled={cvUploading}
                          className="w-full rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-500 disabled:cursor-wait disabled:opacity-60"
                        >
                          {cvUploading ? "Uploading…" : "Upload CV (PDF)"}
                        </button>
                      )}

                      <input
                        ref={cvFileInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={handleCvFileSelect}
                      />

                      {cvUploadError && (
                        <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                          {cvUploadError}
                        </p>
                      )}
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
                    Add your location, availability, skills, and work preferences to continue.
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
              placeholder="Add another skill..."
              className="min-w-0 flex-1 bg-transparent px-2.5 text-sm font-medium text-neutral-800 outline-none placeholder:text-neutral-400"
            />
            <button
              type="button"
              onClick={addCustomSkill}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--forsa-primary)] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-neutral-900 transition-all duration-200"
            >
              <FaPlus className="text-[9px]" />
              Add
            </button>
          </div>
        )}
      </FieldBlock>

      {selected.length > 0 && (
        <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/40 p-4 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Selected skills
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
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Profile preview</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <PreviewItem title="Location" text={city || "Not added yet"} />
        <PreviewItem title="Availability" text={availability || "Not added yet"} />
        <PreviewItem title="Skills" text={skills.length ? skills.join(", ") : "No skills selected"} />
        <PreviewItem title="Looking for" text={lookingFor.length ? lookingFor.join(", ") : "No preferences selected"} />
      </div>

      {portfolio && (
        <p className="truncate rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-500">
          <span className="font-bold text-neutral-800">Portfolio:</span> {portfolio}
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