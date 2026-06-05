import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, registerUser, loginWithGoogle } from "../lib/auth";
import Footer from "../components/Footer";
import { showToast } from "../lib/Toast";
import SEO from "../components/SEO";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBriefcase,
  FaMapMarkerAlt,
  FaUserPlus,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaBuilding,
  FaEnvelope,
  FaUser,
} from "react-icons/fa";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validatePassword = (password) => {
  const value = password.trim();
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Add at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Add at least one lowercase letter.";
  if (!/[0-9]/.test(value)) return "Add at least one number.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Add at least one symbol.";
  return "";
};

const validateName = (name, label = "Name") => {
  const value = name.trim();
  if (value.length < 2) return `${label} must be at least 2 characters.`;
  if (value.length > 60) return `${label} is too long.`;
  if (!/^[a-zA-Z\u0600-\u06FF\s.'-]+$/.test(value)) {
    return `${label} can only include letters, spaces, dots, hyphens, or apostrophes.`;
  }
  return "";
};

const validateCompanyName = (name) => {
  const value = name.trim();
  if (value.length < 2) return "Company name must be at least 2 characters.";
  if (value.length > 80) return "Company name is too long.";
  return "";
};

const validateCity = (city) => {
  const value = city.trim();
  if (value.length < 2) return "City is required.";
  if (value.length > 50) return "City name is too long.";
  return "";
};

const getFriendlyAuthError = (error, isSignup) => {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "This email is already registered. Please log in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password is too weak. Use 8+ characters with a number and symbol.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled. Please try again.",
  };

  return (
    messages[code] ||
    (isSignup
      ? "We could not create your account. Please check your details and try again."
      : "We could not log you in. Please check your email and password.")
  );
};

export default function Auth() {
  const navigate = useNavigate();

  const [step, setStep] = useState("welcome"); 
  const [mode, setMode] = useState("signup"); 
  const [accountType, setAccountType] = useState("finder");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
  const passwordIssue = isSignup ? validatePassword(form.password) : "";

  const canContinue = isSignup
    ? isHiring
      ? validateCompanyName(form.companyName) === "" &&
        emailRegex.test(form.companyEmail.trim()) &&
        validateName(form.contactPerson, "Contact person") === "" &&
        validateCity(form.city) === "" &&
        passwordIssue === ""
      : validateName(form.name, "Full name") === "" &&
        emailRegex.test(form.email.trim()) &&
        validateCity(form.city) === "" &&
        passwordIssue === ""
    : emailRegex.test(form.email.trim()) && form.password.trim();

  const updateField = (field, value) => {
    setError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const switchMode = (nextMode) => {
    setError("");
    setMode(nextMode);
    setStep(nextMode === "signup" ? "choice" : "form");
  };

  const handleInitialChoice = (chosenMode) => {
    setError("");
    setMode(chosenMode);
    if (chosenMode === "signup") {
      setStep("choice");
    } else {
      setStep("form");
    }
  };

  const validateBeforeSubmit = () => {
    const emailToCheck = isSignup && isHiring ? form.companyEmail : form.email;

    if (!emailRegex.test(emailToCheck.trim())) return "Please enter a valid email address.";

    if (!isSignup) {
      if (!form.password.trim()) return "Please enter your password.";
      return "";
    }

    const passError = validatePassword(form.password);
    if (passError) return passError;

    if (isHiring) {
      return validateCompanyName(form.companyName) || validateName(form.contactPerson, "Contact person") || validateCity(form.city);
    }

    return validateName(form.name, "Full name") || validateCity(form.city);
  };

  const handleGoogleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { account, isNewUser } = await loginWithGoogle();

      showToast(isNewUser ? "Welcome to Forsa" : "Welcome back");

      navigate(
        isNewUser
          ? "/onboarding"
          : account.accountType === "hiring"
          ? "/profile"
          : "/explore"
      );
    } catch (err) {
      console.error("Google auth error:", err);
      setError(getFriendlyAuthError(err, false));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const loginEmail = form.email.trim().toLowerCase();
      const companyEmail = form.companyEmail.trim().toLowerCase();
      const finalEmail = isSignup && isHiring ? companyEmail : loginEmail;
      const password = form.password.trim();

      if (!isSignup) {
        const user = await loginUser(loginEmail, password);
        showToast("Welcome back");
        navigate(user.accountType === "hiring" ? "/profile" : "/explore");
        return;
      }

      const newAccount = isHiring
        ? {
            accountType: "hiring",
            name: form.companyName.trim(),
            email: finalEmail,
            city: form.city.trim(),
            companyName: form.companyName.trim(),
            companyEmail: finalEmail,
            contactPerson: form.contactPerson.trim(),
            trusted: false,
            verified: false,
          }
        : {
            accountType: "finder",
            name: form.name.trim(),
            email: finalEmail,
            city: form.city.trim(),
          };

      const user = await registerUser({ ...newAccount, password });

      showToast(isHiring ? "Company account created" : "Welcome to Forsa");
      navigate(user.accountType === "hiring" ? "/post" : "/onboarding");
    } catch (err) {
      console.error("Auth error:", err);
      setError(getFriendlyAuthError(err, isSignup));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111111]">
      <SEO title="Join" />

      {/* Grid container with optimized vertical mobile spacing (py-8 to py-12) */}
      <section className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:items-center lg:gap-10 lg:py-8">
        <div className="hidden lg:block">
          <p className="w-fit rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-medium text-neutral-600">
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

        {/* Clean, minimalist form box with refined organic mobile padding (p-5 sm:p-6) */}
        <div className="mx-auto w-full max-w-[460px] rounded-[24px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6">
          {/* Mobile Heading optimized with strict tracking and proper baseline leading */}
          <div className="mb-6 lg:hidden">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--forsa-primary)]">forsa</p>
            <h1 className="mt-2 text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-neutral-900">
              Work and hiring, organized.
            </h1>
          </div>

          {step === "welcome" ? (
            <WelcomeStep 
              onChooseMode={handleInitialChoice} 
              onGoogleLogin={handleGoogleLogin} 
              loading={loading} 
            />
          ) : (
            <>
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
                  onBack={() => setStep("welcome")}
                />
              ) : (
                <FormStep
                  isSignup={isSignup}
                  accountType={accountType}
                  form={form}
                  updateField={updateField}
                  canContinue={Boolean(canContinue)}
                  onSubmit={handleSubmit}
                  onBack={() => isSignup ? setStep("choice") : setStep("welcome")}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  loading={loading}
                  passwordIssue={passwordIssue}
                />
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function WelcomeStep({ onChooseMode, onGoogleLogin, loading }) {
  return (
    <div className="py-1">
      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-neutral-900">
        Welcome to Forsa
      </h2>
      <p className="mt-2 text-sm leading-6 text-neutral-500">
        Join the network connecting job seekers and local businesses across Lebanon.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onChooseMode("signup")}
          disabled={loading}
          className="forsa-click flex w-full items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--forsa-primary-light)]"
        >
          Create an Account
          <FaArrowRight className="text-xs" />
        </button>

        <button
          type="button"
          onClick={() => onChooseMode("login")}
          disabled={loading}
          className="forsa-click flex w-full items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
        >
          Log in to your Account
        </button>

        <div className="my-2 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--forsa-border)]" />
          <span className="text-xs font-medium text-neutral-400">or</span>
          <div className="h-px flex-1 bg-[var(--forsa-border)]" />
        </div>

        <button
          type="button"
          onClick={onGoogleLogin}
          disabled={loading}
          className="forsa-click flex w-full items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3.5 text-sm font-semibold text-neutral-800 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] disabled:cursor-wait disabled:opacity-60"
        >
          <FaGoogle className="text-sm" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

function SpotlightCard({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-[24px] border p-[1px] text-left transition duration-300 sm:rounded-[28px] ${
        active
          ? "border-transparent shadow-[0_14px_40px_rgba(109,40,217,0.15)]"
          : "border-[var(--forsa-border)] shadow-sm hover:shadow-[0_12px_30px_rgba(109,40,217,0.06)]"
      }`}
    >
      <div
        className={`relative h-full rounded-[23px] p-5 transition sm:rounded-[27px] ${
          active
            ? "bg-[linear-gradient(135deg,var(--forsa-primary),var(--forsa-glow))] text-white"
            : "bg-white text-[var(--forsa-text)]"
        }`}
      >
        {children}
      </div>
    </button>
  );
}

function ChoiceStep({ accountType, setAccountType, onContinue, onBack }) {
  return (
    <div className="mt-2">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-neutral-500 transition hover:text-black"
      >
        <FaArrowLeft className="text-[10px]" />
        Back to welcome
      </button>

      <div className="rounded-[20px] bg-[var(--forsa-bg-soft)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--forsa-primary)]">
          Step 1 of 2
        </p>

        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-neutral-900">
          How will you use Forsa?
        </h2>
      </div>

      {/* Stack cards natively on mobile layouts to avoid overflow and cramping */}
      <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
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
        className="forsa-click mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--forsa-primary-light)]"
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
  loading,
  passwordIssue,
}) {
  const isHiring = accountType === "hiring";

  return (
    <div className="mt-2">
      <button
        onClick={onBack}
        disabled={loading}
        className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-neutral-500 transition hover:text-black"
      >
        <FaArrowLeft className="text-[10px]" />
        {isSignup ? "Change type" : "Back to welcome"}
      </button>

      <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-neutral-400">
        {isSignup ? "Step 2 of 2" : "Welcome back"}
      </p>

      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-neutral-900">
        {isSignup
          ? isHiring
            ? "Create company account"
            : "Create your work profile"
          : "Log in to Forsa"}
      </h2>

      {/* Grid optimized with compact minimal gaps for cleaner mobile vertical rhythm */}
      <div className="mt-5 grid gap-4">
        {isSignup && isHiring && (
          <>
            <Field icon={<FaBuilding />} label="Company name" placeholder="Pixel House" value={form.companyName} onChange={(value) => updateField("companyName", value)} />
            <Field icon={<FaEnvelope />} label="Company email" type="email" placeholder="jobs@company.com" value={form.companyEmail} onChange={(value) => updateField("companyEmail", value)} />
            <Field icon={<FaUser />} label="Contact person" placeholder="Enter your full name" value={form.contactPerson} onChange={(value) => updateField("contactPerson", value)} />
          </>
        )}

        {isSignup && !isHiring && (
          <>
            <Field label="Full name" placeholder="Enter your full name" value={form.name} onChange={(value) => updateField("name", value)} />
            <Field label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(value) => updateField("email", value)} />
          </>
        )}

        {!isSignup && (
          <Field label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(value) => updateField("email", value)} />
        )}

        <PasswordField
          value={form.password}
          onChange={(value) => updateField("password", value)}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />

        {!isSignup && (
          <Link
            to="/forgot-password"
            className="w-fit text-xs font-semibold text-[var(--forsa-primary)] hover:underline"
          >
            Forgot password?
          </Link>
        )}

        {isSignup && passwordIssue && form.password && (
          <p className="rounded-xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-500 border border-[var(--forsa-border)]">{passwordIssue}</p>
        )}

        {isSignup && (
          <Field icon={<FaMapMarkerAlt />} label={isHiring ? "Company location" : "City"} placeholder="Beirut, Tripoli, Saida..." value={form.city} onChange={(value) => updateField("city", value)} />
        )}

        <button
          disabled={!canContinue || loading}
          onClick={onSubmit}
          className={`forsa-click mt-2 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition ${
            canContinue && !loading
              ? "bg-[var(--forsa-primary)] text-white hover:bg-[var(--forsa-primary-light)] shadow-sm"
              : "cursor-not-allowed bg-neutral-100 text-neutral-400"
          }`}
        >
          {loading
            ? "Please wait..."
            : isSignup
            ? isHiring
              ? "Continue to post"
              : "Continue to profile"
            : "Log in"}

          {!loading && <FaArrowRight className="text-xs" />}
        </button>
      </div>
    </div>
  );
}

function TypeCard({ active, icon, title, text, onClick }) {
  return (
    <SpotlightCard active={active} onClick={onClick}>
      <div className="flex items-center justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-base shadow-sm ${
            active
              ? "bg-white/18 text-white ring-1 ring-white/25"
              : "bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
          }`}
        >
          {icon}
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            active
              ? "bg-white/15 text-white"
              : "bg-[var(--forsa-bg)] text-neutral-500"
          }`}
        >
          {active ? "Selected" : "Choose"}
        </span>
      </div>

      <p className="mt-4 text-base font-semibold tracking-[-0.02em]">{title}</p>

      <p className={`mt-1.5 text-xs leading-5 ${active ? "text-white/85" : "text-neutral-500"}`}>
        {text}
      </p>

      <div className={`mt-4 h-1 overflow-hidden rounded-full ${active ? "bg-white/20" : "bg-[var(--forsa-bg)]"}`}>
        <div className={`h-full rounded-full transition-all duration-500 ${active ? "w-full bg-white" : "w-1/3 bg-[var(--forsa-soft)]"}`} />
      </div>
    </SpotlightCard>
  );
}

function Field({ label, placeholder, value, onChange, type = "text", icon }) {
  return (
    <div className="w-full">
      <label className="text-xs font-semibold tracking-tight text-neutral-700">{label}</label>

      <div className="forsa-focus mt-1.5 flex items-center gap-3 rounded-xl border border-[var(--forsa-border)] bg-white px-3.5 py-3">
        {icon && <span className="text-neutral-400 text-sm">{icon}</span>}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none"
        />
      </div>
    </div>
  );
}

function PasswordField({ value, onChange, showPassword, setShowPassword }) {
  return (
    <div className="w-full">
      <label className="text-xs font-semibold tracking-tight text-neutral-700">Password</label>

      <div className="forsa-focus mt-1.5 flex items-center gap-3 rounded-xl border border-[var(--forsa-border)] bg-white px-3.5 py-3">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="8+ chars, number, symbol"
          className="w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-neutral-400 p-0.5 hover:text-neutral-600 active:scale-95 transition"
        >
          {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
        </button>
      </div>
    </div>
  );
}

function TrustItem({ title, text }) {
  return (
    <div className="rounded-2xl border border-[var(--forsa-border)] bg-white p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm leading-6 text-neutral-500">{text}</p>
    </div>
  );
}