import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBriefcase,
  FaCheck,
  FaGraduationCap,
  FaLaptopCode,
  FaMapMarkerAlt,
  FaUser,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";

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

export default function Onboarding() {
  const navigate = useNavigate();

  const savedAccount = JSON.parse(localStorage.getItem("forsaAccount")) || null;
  const savedProfile = JSON.parse(localStorage.getItem("forsaProfile")) || {
    skills: [],
    lookingFor: [],
    cityPreference: "",
    cv: null,
  };

  const [selectedSkills, setSelectedSkills] = useState(savedProfile.skills || []);
  const [selectedLooking, setSelectedLooking] = useState(
    savedProfile.lookingFor || []
  );
  const [cityPreference, setCityPreference] = useState(
    savedProfile.cityPreference || savedAccount?.city || ""
  );

  const progress = useMemo(() => {
    let score = 0;
    if (selectedSkills.length > 0) score += 40;
    if (selectedLooking.length > 0) score += 40;
    if (cityPreference.trim()) score += 20;
    return score;
  }, [selectedSkills, selectedLooking, cityPreference]);

  const canContinue =
    selectedSkills.length > 0 &&
    selectedLooking.length > 0 &&
    cityPreference.trim();

  const toggle = (item, state, setState) => {
    setState(
      state.includes(item)
        ? state.filter((value) => value !== item)
        : [...state, item]
    );
  };

  const saveProfile = () => {
    if (!canContinue) return;

    localStorage.setItem(
      "forsaProfile",
      JSON.stringify({
        ...savedProfile,
        skills: selectedSkills,
        lookingFor: selectedLooking,
        cityPreference,
        cv: savedProfile.cv || null,
      })
    );

    navigate("/explore");
  };

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-6 grid gap-6 sm:mt-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-8">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-medium text-neutral-500">Profile setup</p>

            <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
              Build your opportunity profile.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
              Help Forsa understand your skills, goals, and preferred location
              so your matches feel more relevant.
            </p>

            <div className="mt-6 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 shadow-sm sm:mt-8 sm:rounded-[28px] sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Profile strength</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Complete the basics before exploring.
                  </p>
                </div>

                <span className="rounded-full bg-[var(--forsa-green)] px-3 py-1 text-xs font-medium text-white">
                  {progress}%
                </span>
              </div>

              <div className="mt-4 h-2 rounded-full bg-[#f7f7f5]">
                <div
                  className="h-2 rounded-full bg-[var(--forsa-green)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-5 grid gap-2">
                <StepDone done={selectedSkills.length > 0} text="Add skills" />
                <StepDone done={selectedLooking.length > 0} text="Choose goals" />
                <StepDone done={Boolean(cityPreference.trim())} text="Add preferred city" />
              </div>
            </div>
          </aside>

          <div className="rounded-[28px] border border-[var(--forsa-border)] bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6">
            <div className="rounded-[24px] bg-[#f7f7f5] p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-500">Step 1 of 1</p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                What fits you best?
              </h2>

              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Select multiple options. You can edit these later from your
                profile.
              </p>
            </div>

            <OptionSection
              icon={<FaLaptopCode />}
              title="Your skills"
              subtitle="What can you help with?"
              options={skillOptions}
              selected={selectedSkills}
              onToggle={(skill) => toggle(skill, selectedSkills, setSelectedSkills)}
            />

            <OptionSection
              icon={<FaBriefcase />}
              title="Looking for"
              subtitle="What type of opportunity do you want?"
              options={lookingOptions}
              selected={selectedLooking}
              onToggle={(item) => toggle(item, selectedLooking, setSelectedLooking)}
            />

            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--forsa-green)] text-white">
                  <FaMapMarkerAlt className="text-sm" />
                </div>

                <div>
                  <p className="text-sm font-medium">Preferred location</p>
                  <p className="text-xs text-neutral-500">
                    City, area, or remote preference.
                  </p>
                </div>
              </div>

              <input
                value={cityPreference}
                onChange={(e) => setCityPreference(e.target.value)}
                placeholder="Beirut, Tripoli, Saida, Remote..."
                className="w-full rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div className="sticky bottom-0 -mx-4 mt-8 border-t border-neutral-100 bg-white/95 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0">
              <button
                disabled={!canContinue}
                onClick={saveProfile}
                className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
                  canContinue
                    ? "bg-[var(--forsa-green)] text-white hover:bg-[var(--forsa-green-light)]"
                    : "cursor-not-allowed bg-neutral-200 text-neutral-400"
                }`}
              >
                Continue to opportunities
                <FaArrowRight className="text-xs" />
              </button>

              {!canContinue && (
                <p className="mt-2 text-center text-xs text-neutral-500">
                  Select at least one skill, one goal, and a location.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OptionSection({ icon, title, subtitle, options, selected, onToggle }) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--forsa-green)] text-white">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-neutral-500">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const active = selected.includes(item);

          return (
            <button
              type="button"
              key={item}
              onClick={() => onToggle(item)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition sm:px-4 ${
                active
                  ? "border-black bg-[var(--forsa-green)] text-white"
                  : "border-neutral-300 bg-white hover:border-neutral-500"
              }`}
            >
              {active && <FaCheck className="text-xs" />}
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDone({ done, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#f7f7f5] px-4 py-3">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
          done ? "bg-[var(--forsa-green)] text-white" : "bg-white text-neutral-400"
        }`}
      >
        {done ? <FaCheck /> : <FaUser />}
      </div>

      <p className={`text-sm ${done ? "text-black" : "text-neutral-500"}`}>
        {text}
      </p>
    </div>
  );
}