import { useState } from "react";
import { useNavigate } from "react-router-dom";

const skillOptions = [
  "React",
  "Design",
  "Marketing",
  "Video editing",
  "Photography",
  "Writing",
  "Sales",
  "Customer service",
];

const lookingOptions = [
  "Internship",
  "Freelance work",
  "Part-time job",
  "Remote work",
  "Startup project",
  "Collaboration",
];

export default function Onboarding() {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedLooking, setSelectedLooking] = useState([]);
  const navigate = useNavigate();

  const toggle = (item, state, setState) => {
    if (state.includes(item)) {
      setState(state.filter((value) => value !== item));
    } else {
      setState([...state, item]);
    }
  };

  const canContinue = selectedSkills.length > 0 && selectedLooking.length > 0;

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-xl font-semibold tracking-[-0.03em]">forsa</p>

      <div className="mt-14 rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm text-neutral-500">Step 1 of 2</p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">
          Build your opportunity profile.
        </h1>

        <p className="mt-4 max-w-xl leading-7 text-neutral-600">
          Choose what you can do and what kind of work you’re looking for.
        </p>

        <div className="mt-10">
          <p className="mb-4 text-sm font-medium">Your skills</p>

          <div className="flex flex-wrap gap-3">
            {skillOptions.map((skill) => (
              <button
                key={skill}
                onClick={() => toggle(skill, selectedSkills, setSelectedSkills)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selectedSkills.includes(skill)
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 bg-white"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <p className="mb-4 text-sm font-medium">Looking for</p>

          <div className="flex flex-wrap gap-3">
            {lookingOptions.map((item) => (
              <button
                key={item}
                onClick={() =>
                  toggle(item, selectedLooking, setSelectedLooking)
                }
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selectedLooking.includes(item)
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 bg-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!canContinue}
          onClick={() => {
            localStorage.setItem(
              "forsaProfile",
              JSON.stringify({
                skills: selectedSkills,
                lookingFor: selectedLooking,
              })
            );

            navigate("/explore");
          }}
          className={`mt-12 w-full rounded-full px-5 py-3 text-sm font-medium transition ${
            canContinue
              ? "bg-black text-white hover:bg-neutral-800"
              : "cursor-not-allowed bg-neutral-200 text-neutral-400"
          }`}
        >
          Continue to opportunities
        </button>
      </div>
    </section>
  );
}