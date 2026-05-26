import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../lib/auth";
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
    "auth/email-already-in-use":
      "This email is already registered. Please log in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password":
      "Password is too weak. Use 8+ characters with a number and symbol.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/network-request-failed":
      "Network error. Check your connection and try again.",
    "auth/too-many-requests":
      "Too many attempts. Please wait a moment and try again.",
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

  const [mode, setMode] = useState("signup");
  const [step, setStep] = useState("choice");
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
  const signupEmail = isHiring ? form.companyEmail : form.email;
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

  const validateBeforeSubmit = () => {
    const emailToCheck = isSignup && isHiring ? form.companyEmail : form.email;

    if (!emailRegex.test(emailToCheck.trim())) {
      return "Please enter a valid email address.";
    }

    if (!isSignup) {
      if (!form.password.trim()) return "Please enter your password.";
      return "";
    }

    const passError = validatePassword(form.password);
    if (passError) return passError;

    if (isHiring) {
      return (
        validateCompanyName(form.companyName) ||
        validateName(form.contactPerson, "Contact person") ||
        validateCity(form.city)
      );
    }

    return validateName(form.name, "Full name") || validateCity(form.city);
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

      const user = await registerUser({
        ...newAccount,
        password,
      });

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
      <section className="mx-auto grid min-h-screen max-w-6xl gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:items-center lg:gap-10 lg:py-8">
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

        <div className="mx-auto w-full max-w-[500px] rounded-[28px] border border-[var(--forsa-border)] bg-white p-4 shadow-sm sm:p-5">
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
                disabled={loading}
                className={`rounded-full px-3 py-2.5 text-sm font-medium transition ${
                  mode === "signup" ? "bg-white shadow-sm" : "text-neutral-500"
                }`}
              >
                Create
              </button>

              <button
                onClick={() => switchMode("login")}
                disabled={loading}
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
              canContinue={Boolean(canContinue)}
              onSubmit={handleSubmit}
              onBack={() => setStep("choice")}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              passwordIssue={passwordIssue}
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
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--forsa-primary-light)]"
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
    <div className="mt-5">
      {isSignup && (
        <button
          onClick={onBack}
          disabled={loading}
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
          <>
            <Field label="Full name" placeholder="Adam Abdallah" value={form.name} onChange={(value) => updateField("name", value)} />
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

        {isSignup && passwordIssue && form.password && (
          <p className="text-xs leading-5 text-neutral-500">{passwordIssue}</p>
        )}

        {isSignup && (
          <Field icon={<FaMapMarkerAlt />} label={isHiring ? "Company location" : "City"} placeholder="Beirut, Tripoli, Saida..." value={form.city} onChange={(value) => updateField("city", value)} />
        )}

        <button
          disabled={!canContinue || loading}
          onClick={onSubmit}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
            canContinue && !loading
              ? "bg-[var(--forsa-primary)] text-white hover:bg-[var(--forsa-primary-light)]"
              : "cursor-not-allowed bg-neutral-200 text-neutral-400"
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
    <button
      onClick={onClick}
      className={`rounded-[22px] border p-4 text-left transition ${
        active
          ? "border-black bg-[var(--forsa-primary)] text-white"
          : "border-[var(--forsa-border)] bg-white hover:border-neutral-400"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          active ? "bg-white text-black" : "bg-[#f7f7f5] text-black"
        }`}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm font-medium">{title}</p>
      <p
        className={`mt-2 text-xs leading-5 ${
          active ? "text-neutral-300" : "text-neutral-500"
        }`}
      >
        {text}
      </p>
    </button>
  );
}

function Field({ label, placeholder, value, onChange, type = "text", icon }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>

      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 transition focus-within:border-black">
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

      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 transition focus-within:border-black">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="8+ chars, number, symbol"
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
    <div className="rounded-2xl border border-[var(--forsa-border)] bg-white p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm leading-6 text-neutral-500">{text}</p>
    </div>
  );
}