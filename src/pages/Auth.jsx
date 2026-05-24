import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { findUser, getUsers, saveUser, setSession } from "../lib/auth";
import { showToast } from "../lib/Toast";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBriefcase,
  FaMapMarkerAlt,
  FaUserPlus,
  FaEye,
  FaEyeSlash,
  FaBuilding,
  FaEnvelope,
  FaUser,
} from "react-icons/fa";

export default function Auth() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("signup");
  const [step, setStep] = useState("choice");
  const [accountType, setAccountType] = useState("finder");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    companyName: "",
    companyEmail: "",
    contactPerson: "",
  });

  const isSignup = mode === "signup";
  const isHiring = accountType === "hiring";

  const canContinue = isSignup
    ? isHiring
      ? form.companyName.trim() &&
        form.companyEmail.trim() &&
        form.contactPerson.trim() &&
        form.password.trim() &&
        form.city.trim()
      : form.name.trim() &&
        form.email.trim() &&
        form.password.trim() &&
        form.city.trim()
    : form.email.trim() && form.password.trim();

  const updateField = (field, value) => {
    setError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const switchMode = (nextMode) => {
    setError("");
    setMode(nextMode);
    setStep(nextMode === "signup" ? "choice" : "form");
  };

  const handleSubmit = () => {
    if (!canContinue) return;

    const loginEmail = form.email.trim().toLowerCase();
    const companyEmail = form.companyEmail.trim().toLowerCase();
    const finalEmail = isSignup && isHiring ? companyEmail : loginEmail;
    const password = form.password.trim();

    if (!isSignup) {
      const user = findUser(loginEmail, password);

      if (!user) {
        setError("Account not found. Create an account first or check your password.");
        return;
      }

      setSession(user);
      showToast("Welcome back");
      navigate(user.accountType === "hiring" ? "/profile" : "/explore");
      return;
    }

    const emailExists = getUsers().some((user) => user.email === finalEmail);

    if (emailExists) {
      setError("This email already has an account. Log in instead.");
      setMode("login");
      setStep("form");
      return;
    }

    const newAccount = isHiring
      ? {
          id: Date.now(),
          accountType: "hiring",
          name: form.companyName.trim(),
          email: finalEmail,
          password,
          city: form.city.trim(),
          companyName: form.companyName.trim(),
          companyEmail: finalEmail,
          contactPerson: form.contactPerson.trim(),
          createdAt: new Date().toISOString(),
        }
      : {
          id: Date.now(),
          accountType: "finder",
          name: form.name.trim(),
          email: finalEmail,
          password,
          city: form.city.trim(),
          createdAt: new Date().toISOString(),
        };

    saveUser(newAccount);
    showToast(isHiring ? "Company account created" : "Welcome to Forsa");

    navigate(isHiring ? "/post" : "/onboarding");
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111111]">
      <section className="mx-auto grid min-h-screen max-w-6xl gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:items-center lg:gap-10 lg:py-8">
        <div className="hidden lg:block">
          <p className="w-fit rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-600">
            Local work platform for Lebanon
          </p>

          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em]">
            Find work. Hire people. Skip the chaos.
          </h1>

          <p className="mt-5 max-w-md text-sm leading-7 text-neutral-600">
            Forsa connects students, freelancers, creators, and small businesses
            through local jobs, gigs, internships, and projects.
          </p>

          <div className="mt-7 grid max-w-md gap-3">
            <TrustItem title="For seekers" text="Save jobs, apply, and track conversations." />
            <TrustItem title="For companies" text="Post opportunities and manage applicants." />
          </div>
        </div>

        <div className="mx-auto w-full max-w-[500px] rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 lg:hidden">
            <p className="text-sm font-semibold tracking-[-0.03em]">forsa</p>
            <h1 className="mt-4 text-3xl font-semibold leading-[1] tracking-[-0.05em]">
              Work and hiring, organized.
            </h1>
          </div>

          <div className="rounded-[22px] bg-[#f7f7f5] p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => switchMode("signup")}
                className={`rounded-full px-3 py-2.5 text-sm font-medium transition ${
                  mode === "signup" ? "bg-white shadow-sm" : "text-neutral-500"
                }`}
              >
                Create
              </button>

              <button
                onClick={() => switchMode("login")}
                className={`rounded-full px-3 py-2.5 text-sm font-medium transition ${
                  mode === "login" ? "bg-white shadow-sm" : "text-neutral-500"
                }`}
              >
                Log in
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
              {error}
            </div>
          )}

          {isSignup && step === "choice" ? (
            <ChoiceStep
              accountType={accountType}
              setAccountType={setAccountType}
              onContinue={() => setStep("form")}
            />
          ) : (
            <FormStep
              isSignup={isSignup}
              accountType={accountType}
              form={form}
              updateField={updateField}
              canContinue={canContinue}
              onSubmit={handleSubmit}
              onBack={() => setStep("choice")}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function ChoiceStep({ accountType, setAccountType, onContinue }) {
  return (
    <div className="mt-5">
      <p className="text-xs font-medium text-neutral-500">Step 1 of 2</p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
        Choose account type
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <TypeCard
          active={accountType === "finder"}
          icon={<FaUserPlus />}
          title="Find opportunities"
          text="For students, freelancers, and people looking for work."
          onClick={() => setAccountType("finder")}
        />

        <TypeCard
          active={accountType === "hiring"}
          icon={<FaBriefcase />}
          title="Company / hiring"
          text="For businesses, creators, and teams posting opportunities."
          onClick={() => setAccountType("hiring")}
        />
      </div>

      <button
        onClick={onContinue}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
      >
        Continue
        <FaArrowRight className="text-xs" />
      </button>
    </div>
  );
}

function FormStep({
  isSignup,
  accountType,
  form,
  updateField,
  canContinue,
  onSubmit,
  onBack,
  showPassword,
  setShowPassword,
}) {
  const isHiring = accountType === "hiring";

  return (
    <div className="mt-5">
      {isSignup && (
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-sm text-neutral-500 transition hover:text-black"
        >
          <FaArrowLeft className="text-xs" />
          Change type
        </button>
      )}

      <p className="text-xs font-medium text-neutral-500">
        {isSignup ? "Step 2 of 2" : "Welcome back"}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
        {isSignup
          ? isHiring
            ? "Create company account."
            : "Create your work profile."
          : "Log in to Forsa."}
      </h2>

      <div className="mt-5 grid gap-3">
        {isSignup && isHiring && (
          <>
            <Field icon={<FaBuilding />} label="Company name" placeholder="Pixel House" value={form.companyName} onChange={(value) => updateField("companyName", value)} />
            <Field icon={<FaEnvelope />} label="Company email" type="email" placeholder="jobs@company.com" value={form.companyEmail} onChange={(value) => updateField("companyEmail", value)} />
            <Field icon={<FaUser />} label="Contact person" placeholder="Adam Abdallah" value={form.contactPerson} onChange={(value) => updateField("contactPerson", value)} />
          </>
        )}

        {isSignup && !isHiring && (
          <Field label="Full name" placeholder="Adam Abdallah" value={form.name} onChange={(value) => updateField("name", value)} />
        )}

        {!isSignup && (
          <Field label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(value) => updateField("email", value)} />
        )}

        <PasswordField value={form.password} onChange={(value) => updateField("password", value)} showPassword={showPassword} setShowPassword={setShowPassword} />

        {isSignup && !isHiring && (
          <Field label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(value) => updateField("email", value)} />
        )}

        {isSignup && (
          <Field icon={<FaMapMarkerAlt />} label={isHiring ? "Company location" : "City"} placeholder="Beirut, Tripoli, Saida..." value={form.city} onChange={(value) => updateField("city", value)} />
        )}

        <button
          disabled={!canContinue}
          onClick={onSubmit}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
            canContinue
              ? "bg-black text-white hover:bg-neutral-800"
              : "cursor-not-allowed bg-neutral-200 text-neutral-400"
          }`}
        >
          {isSignup ? (isHiring ? "Continue to post" : "Continue to profile") : "Log in"}
          <FaArrowRight className="text-xs" />
        </button>
      </div>
    </div>
  );
}

function TypeCard({ active, icon, title, text, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[22px] border p-4 text-left transition ${
        active ? "border-black bg-black text-white" : "border-neutral-200 bg-white hover:border-neutral-400"
      }`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? "bg-white text-black" : "bg-[#f7f7f5] text-black"}`}>
        {icon}
      </div>

      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className={`mt-2 text-xs leading-5 ${active ? "text-neutral-300" : "text-neutral-500"}`}>
        {text}
      </p>
    </button>
  );
}

function Field({ label, placeholder, value, onChange, type = "text", icon }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>

      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition focus-within:border-black">
        {icon && <span className="text-neutral-400">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}

function PasswordField({ value, onChange, showPassword, setShowPassword }) {
  return (
    <div>
      <label className="text-sm font-medium">Password</label>

      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition focus-within:border-black">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-transparent text-sm outline-none"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-neutral-400"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
}

function TrustItem({ title, text }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm leading-6 text-neutral-500">{text}</p>
    </div>
  );
}