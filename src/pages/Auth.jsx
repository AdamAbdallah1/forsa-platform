import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { findUser, getUsers, saveUser, setSession } from "../lib/auth";
import { showToast } from "../lib/Toast"

import {
  FaArrowLeft,
  FaArrowRight,
  FaBriefcase,
  FaMapMarkerAlt,
  FaUserPlus,
  FaEye,
  FaEyeSlash,
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
  });

  const isSignup = mode === "signup";

  const canContinue = isSignup
    ? form.name.trim() && form.email.trim() && form.password.trim() && form.city.trim()
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

    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();

    if (!isSignup) {
      const user = findUser(email, password);

      if (!user) {
        setError("Account not found. Create an account first or check your password.");
        return;
      }

      setSession(user);
      showToast("Welcome back");
      navigate(user.accountType === "hiring" ? "/profile" : "/explore");
      return;
    }

    const emailExists = getUsers().some((user) => user.email === email);

    if (emailExists) {
      setError("This email already has an account. Log in instead.");
      setMode("login");
      setStep("form");
      return;
    }

    const newAccount = {
      id: Date.now(),
      accountType,
      name: form.name.trim(),
      email,
      password,
      city: form.city.trim(),
      createdAt: new Date().toISOString(),
    };

    saveUser(newAccount);
    showToast("Welcome to Forsa");

    if (accountType === "hiring") {
      navigate("/post");
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111111]">
      <section className="mx-auto grid min-h-screen max-w-6xl gap-6 px-5 pb-8 pt-5 sm:px-6 lg:grid-cols-[0.88fr_1fr] lg:items-center lg:gap-12 lg:py-10">
        <div className="flex flex-col">
          <div className="mt-10 text-center lg:mt-16 lg:text-left">
            <p className="mx-auto w-fit rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-600 lg:mx-0">
              Local work platform for Lebanon
            </p>

            <h1 className="mx-auto mt-5 max-w-xl text-[38px] font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl md:text-6xl lg:mx-0">
              Find work. Hire people. Skip the chaos.
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-neutral-600 sm:text-base lg:mx-0">
              Forsa connects students, freelancers, creators, and small businesses
              through local jobs, gigs, internships, and projects.
            </p>
          </div>

          <div className="mt-7 hidden max-w-md gap-3 lg:grid">
            <TrustItem title="Local opportunities" text="Jobs and gigs made for Lebanon." />
            <TrustItem title="Less noise" text="No messy groups or lost WhatsApp posts." />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm sm:rounded-[34px] sm:p-5 lg:max-w-none">
          <div className="rounded-[24px] bg-[#f7f7f5] p-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => switchMode("signup")}
                className={`rounded-full px-3 py-3 text-sm font-medium transition ${
                  mode === "signup" ? "bg-white shadow-sm" : "text-neutral-500"
                }`}
              >
                Create
              </button>

              <button
                onClick={() => switchMode("login")}
                className={`rounded-full px-3 py-3 text-sm font-medium transition ${
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

        <div className="grid gap-3 lg:hidden">
          <TrustItem title="Local opportunities" text="Jobs and gigs made for Lebanon." />
          <TrustItem title="Less noise" text="No messy groups or lost WhatsApp posts." />
        </div>
      </section>
    </main>
  );
}

function ChoiceStep({ accountType, setAccountType, onContinue }) {
  return (
    <div className="mt-5">
      <p className="text-xs font-medium text-neutral-500">Step 1 of 2</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
        What brings you to Forsa?
      </h2>
      <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base sm:leading-7">
        Choose your path first. You can change this later.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <TypeCard active={accountType === "finder"} icon={<FaUserPlus />} title="Find opportunities" text="For students, freelancers, and people looking for work." onClick={() => setAccountType("finder")} />
        <TypeCard active={accountType === "hiring"} icon={<FaBriefcase />} title="Hire or post" text="For businesses, creators, and teams posting opportunities." onClick={() => setAccountType("hiring")} />
      </div>

      <button onClick={onContinue} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800">
        Continue <FaArrowRight className="text-xs" />
      </button>
    </div>
  );
}

function FormStep({ isSignup, accountType, form, updateField, canContinue, onSubmit, onBack, showPassword, setShowPassword }) {
  return (
    <div className="mt-5">
      {isSignup && (
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm text-neutral-500 transition hover:text-black">
          <FaArrowLeft className="text-xs" /> Change path
        </button>
      )}

      <p className="text-xs font-medium text-neutral-500">
        {isSignup ? "Step 2 of 2" : "Welcome back"}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
        {isSignup ? accountType === "hiring" ? "Create a hiring profile." : "Create your work profile." : "Log in to Forsa."}
      </h2>

      <div className="mt-5 grid gap-3">
        {isSignup && <Field label="Full name" placeholder="Adam Abdallah" value={form.name} onChange={(value) => updateField("name", value)} />}
        <Field label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(value) => updateField("email", value)} />
        <PasswordField value={form.password} onChange={(value) => updateField("password", value)} showPassword={showPassword} setShowPassword={setShowPassword} />

        {isSignup && (
          <div>
            <label className="text-sm font-medium">City</label>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition focus-within:border-black">
              <FaMapMarkerAlt className="text-neutral-400" />
              <input value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Beirut, Tripoli, Saida..." className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>
        )}

        <button disabled={!canContinue} onClick={onSubmit} className={`mt-2 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${canContinue ? "bg-black text-white hover:bg-neutral-800" : "cursor-not-allowed bg-neutral-200 text-neutral-400"}`}>
          {isSignup ? accountType === "hiring" ? "Continue to post" : "Continue to profile" : "Log in"}
          <FaArrowRight className="text-xs" />
        </button>
      </div>
    </div>
  );
}

function TypeCard({ active, icon, title, text, onClick }) {
  return (
    <button onClick={onClick} className={`rounded-[24px] border p-4 text-left transition ${active ? "border-black bg-black text-white" : "border-neutral-200 bg-white hover:border-neutral-400"}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-white text-black" : "bg-[#f7f7f5] text-black"}`}>
        {icon}
      </div>
      <p className="mt-4 text-sm font-medium sm:text-base">{title}</p>
      <p className={`mt-2 text-xs leading-5 sm:text-sm sm:leading-6 ${active ? "text-neutral-300" : "text-neutral-500"}`}>{text}</p>
    </button>
  );
}

function Field({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black" />
    </div>
  );
}

function PasswordField({ value, onChange, showPassword, setShowPassword }) {
  return (
    <div>
      <label className="text-sm font-medium">Password</label>
      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition focus-within:border-black">
        <input type={showPassword ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••" className="w-full bg-transparent text-sm outline-none" />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-400">
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