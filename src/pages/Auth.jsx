import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginUser, registerUser, loginWithGoogle } from "../lib/auth";
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
  FaCheckCircle,
  FaLock,
} from "react-icons/fa";


// ============================================================
// VALIDATION
// ============================================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validatePassword = (password) => {
  const value = password.trim();

  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(value)) {
    return "Add at least one uppercase letter.";
  }

  if (!/[a-z]/.test(value)) {
    return "Add at least one lowercase letter.";
  }

  if (!/[0-9]/.test(value)) {
    return "Add at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return "Add at least one symbol.";
  }

  return "";
};

const getPasswordRequirements = (password) => {
  const value = password.trim();

  return {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  };
};

const validateName = (name, label = "Name") => {
  const value = name.trim();

  if (value.length < 2) {
    return `${label} must be at least 2 characters.`;
  }

  if (value.length > 60) {
    return `${label} is too long.`;
  }

  if (!/^[a-zA-Z\u0600-\u06FF\s.'-]+$/.test(value)) {
    return `${label} can only include letters, spaces, dots, hyphens, or apostrophes.`;
  }

  return "";
};

const validateCompanyName = (name) => {
  const value = name.trim();

  if (value.length < 2) {
    return "Company name must be at least 2 characters.";
  }

  if (value.length > 80) {
    return "Company name is too long.";
  }

  return "";
};

const validateCity = (city) => {
  const value = city.trim();

  if (value.length < 2) {
    return "City is required.";
  }

  if (value.length > 50) {
    return "City name is too long.";
  }

  return "";
};


// ============================================================
// FIREBASE / AUTH ERRORS
// ============================================================

const getFriendlyAuthError = (error, isSignup) => {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use":
      "This email is already registered. Please log in instead.",

    "auth/invalid-email":
      "Please enter a valid email address.",

    "auth/weak-password":
      "Password is too weak. Use 8+ characters with uppercase, lowercase, a number, and a symbol.",

    "auth/invalid-credential":
      "Email or password is incorrect.",

    "auth/user-not-found":
      "No account found with this email.",

    "auth/wrong-password":
      "Email or password is incorrect.",

    "auth/network-request-failed":
      "Network error. Check your connection and try again.",

    "auth/too-many-requests":
      "Too many attempts. Please wait a moment and try again.",

    "auth/popup-closed-by-user":
      "Google sign-in was cancelled. Please try again.",

    "auth/account-exists-with-different-credential":
      "An account already exists with this email. Try signing in with your original method.",
  };

  return (
    messages[code] ||
    (isSignup
      ? "We could not create your account. Please check your details and try again."
      : "We could not log you in. Please check your email and password.")
  );
};


// ============================================================
// MAIN AUTH PAGE
// ============================================================

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedMode = searchParams.get("mode");

  const initialMode =
    requestedMode === "login" || requestedMode === "signup"
      ? requestedMode
      : null;

  const [step, setStep] = useState(
    initialMode === "login" || initialMode === "signup"
      ? "form"
      : "welcome"
  );

  const [mode, setMode] = useState(initialMode || "signup");

  const [accountType, setAccountType] = useState("finder");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    companyName: "",
    companyEmail: "",
    contactPerson: "",
  });

  const isSignup = mode === "signup";
  const isHiring = accountType === "hiring";

  const passwordIssue = isSignup
    ? validatePassword(form.password)
    : "";

  const passwordRequirements = getPasswordRequirements(
    form.password
  );

  const passwordsMatch =
    !isSignup ||
    !form.confirmPassword ||
    form.password === form.confirmPassword;

  const canContinue = isSignup
    ? isHiring
      ? validateCompanyName(form.companyName) === "" &&
        emailRegex.test(form.companyEmail.trim()) &&
        validateName(form.contactPerson, "Contact person") === "" &&
        validateCity(form.city) === "" &&
        passwordIssue === "" &&
        form.confirmPassword.trim() !== "" &&
        form.password === form.confirmPassword
      : validateName(form.name, "Full name") === "" &&
        emailRegex.test(form.email.trim()) &&
        validateCity(form.city) === "" &&
        passwordIssue === "" &&
        form.confirmPassword.trim() !== "" &&
        form.password === form.confirmPassword
    : emailRegex.test(form.email.trim()) &&
      form.password.trim() !== "";

  const updateField = (field, value) => {
    setError("");

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const handleInitialChoice = (chosenMode) => {
    if (loading) return;

    setError("");
    setMode(chosenMode);

    navigate(`/auth?mode=${chosenMode}`, {
      replace: true,
    });

    setStep(
      chosenMode === "signup"
        ? "choice"
        : "form"
    );
  };

  const handleModeSwitch = (nextMode) => {
    if (loading) return;

    setError("");
    setMode(nextMode);

    navigate(`/auth?mode=${nextMode}`, {
      replace: true,
    });

    setStep(
      nextMode === "signup"
        ? "choice"
        : "form"
    );
  };


  // ==========================================================
  // VALIDATION BEFORE SUBMIT
  // ==========================================================

  const validateBeforeSubmit = () => {
    const emailToCheck =
      isSignup && isHiring
        ? form.companyEmail
        : form.email;

    if (!emailRegex.test(emailToCheck.trim())) {
      return "Please enter a valid email address.";
    }

    if (!isSignup) {
      if (!form.password.trim()) {
        return "Please enter your password.";
      }

      return "";
    }

    const passError = validatePassword(
      form.password
    );

    if (passError) {
      return passError;
    }

    if (!form.confirmPassword.trim()) {
      return "Please confirm your password.";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }

    if (isHiring) {
      return (
        validateCompanyName(form.companyName) ||
        validateName(
          form.contactPerson,
          "Contact person"
        ) ||
        validateCity(form.city)
      );
    }

    return (
      validateName(form.name, "Full name") ||
      validateCity(form.city)
    );
  };


  // ==========================================================
  // GOOGLE AUTH
  // ==========================================================

  const handleGoogleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { account, isNewUser } =
        await loginWithGoogle();

      showToast(
        isNewUser
          ? "Welcome to Forsa"
          : "Welcome back"
      );

      navigate(
        isNewUser
          ? "/onboarding"
          : account.accountType === "hiring"
          ? "/profile"
          : "/explore"
      );
    } catch (err) {
      console.error(
        "Google auth error:",
        err
      );

      setError(
        getFriendlyAuthError(
          err,
          false
        )
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // EMAIL AUTH
  // ==========================================================

  const handleSubmit = async () => {
    if (loading) return;

    const validationError =
      validateBeforeSubmit();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const loginEmail = form.email
        .trim()
        .toLowerCase();

      const companyEmail = form.companyEmail
        .trim()
        .toLowerCase();

      const finalEmail =
        isSignup && isHiring
          ? companyEmail
          : loginEmail;

      const password =
        form.password.trim();

      // ----------------------------
      // LOGIN
      // ----------------------------

      if (!isSignup) {
        const user = await loginUser(
          loginEmail,
          password
        );

        showToast("Welcome back");

        navigate(
          user.accountType === "hiring"
            ? "/profile"
            : "/explore"
        );

        return;
      }


      // ----------------------------
      // SIGNUP
      // ----------------------------

      const newAccount = isHiring
        ? {
            accountType: "hiring",
            name: form.companyName.trim(),
            email: finalEmail,
            city: form.city.trim(),
            companyName:
              form.companyName.trim(),
            companyEmail: finalEmail,
            contactPerson:
              form.contactPerson.trim(),
            trusted: false,
            verified: false,
          }
        : {
            accountType: "finder",
            name: form.name.trim(),
            email: finalEmail,
            city: form.city.trim(),
          };

      await registerUser({
        ...newAccount,
        password,
      });

      showToast(
        "Verification email sent. Please check your inbox."
      );

      navigate("/verify-email");
    } catch (err) {
      console.error(
        "Auth error:",
        err
      );

      setError(
        getFriendlyAuthError(
          err,
          isSignup
        )
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // ENTER KEY SUBMIT
  // ==========================================================

  const handleFormKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      canContinue &&
      !loading
    ) {
      event.preventDefault();
      handleSubmit();
    }
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f7f7f5] text-neutral-950">
      <SEO title="Join Forsa" />

      <section className="relative mx-auto flex min-h-[100dvh] w-full max-w-7xl items-center px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        
        {/* Background decoration */}

        <div className="pointer-events-none absolute left-[-140px] top-[-140px] h-80 w-80 rounded-full bg-[var(--forsa-primary)]/10 blur-3xl" />

        <div className="pointer-events-none absolute bottom-[-180px] right-[-140px] h-96 w-96 rounded-full bg-neutral-300/40 blur-3xl" />


        <div className="relative grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,470px)] lg:gap-16 xl:gap-24">


          {/* ==================================================
              DESKTOP BRAND PANEL
          ================================================== */}

          <div className="relative hidden lg:block">

            <div className="max-w-2xl">

              <h1 className="max-w-xl text-5xl font-semibold leading-[0.94] tracking-[-0.065em] text-neutral-950 xl:text-6xl">
                Find work.
                <br />
                Hire people.
                <br />
                <span className="text-[var(--forsa-primary)]">
                  Skip the chaos.
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-base leading-8 text-neutral-600">
                A local opportunity platform for
                students, freelancers, creators,
                and businesses across Lebanon.
              </p>

              <div className="mt-8 grid max-w-lg gap-3">
                <TrustItem
                  title="For people looking for opportunities"
                  text="Build your profile, discover relevant opportunities, and apply in one place."
                />

                <TrustItem
                  title="For companies and teams"
                  text="Create opportunities, discover talent, and manage applicants without the chaos."
                />
              </div>

            </div>
          </div>


          {/* ==================================================
              AUTH COLUMN
          ================================================== */}

          <div className="relative mx-auto flex w-full max-w-[470px] flex-col">

            {/* Mobile brand */}

            <div className="mb-6 lg:hidden">

              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--forsa-primary)]">
                Forsa
              </p>

              <h1 className="text-[34px] font-semibold leading-[0.95] tracking-[-0.06em] text-neutral-950 sm:text-[42px]">
                Work and hiring,
                <span className="block text-[var(--forsa-primary)]">
                  organized.
                </span>
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-neutral-600">
                Find jobs, internships,
                freelance gigs, and local
                projects across Lebanon.
              </p>

            </div>


            {/* ==================================================
                AUTH CARD
            ================================================== */}

            <div className="w-full rounded-[28px] border border-[var(--forsa-border)] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-7">


              {/* Error */}

              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                  {error}
                </div>
              )}


              {/* Welcome */}

              {step === "welcome" ? (
                <WelcomeStep
                  onChooseMode={
                    handleInitialChoice
                  }
                  onGoogleLogin={
                    handleGoogleLogin
                  }
                  loading={loading}
                />
              ) : (
                <div
                  onKeyDown={
                    handleFormKeyDown
                  }
                >

                  {/* Signup account type */}

                  {isSignup &&
                  step === "choice" ? (
                    <ChoiceStep
                      accountType={
                        accountType
                      }
                      setAccountType={
                        setAccountType
                      }
                      onContinue={() =>
                        setStep("form")
                      }
                      onBack={() =>
                        setStep("welcome")
                      }
                    />
                  ) : (
                    <FormStep
                      isSignup={isSignup}
                      accountType={
                        accountType
                      }
                      form={form}
                      updateField={
                        updateField
                      }
                      canContinue={
                        Boolean(
                          canContinue
                        )
                      }
                      onSubmit={
                        handleSubmit
                      }
                      onBack={() =>
                        isSignup
                          ? setStep("choice")
                          : setStep("welcome")
                      }
                      showPassword={
                        showPassword
                      }
                      setShowPassword={
                        setShowPassword
                      }
                      showConfirmPassword={
                        showConfirmPassword
                      }
                      setShowConfirmPassword={
                        setShowConfirmPassword
                      }
                      loading={loading}
                      passwordIssue={
                        passwordIssue
                      }
                      passwordRequirements={
                        passwordRequirements
                      }
                      passwordsMatch={
                        passwordsMatch
                      }
                      onModeSwitch={
                        handleModeSwitch
                      }
                    />
                  )}

                </div>
              )}

            </div>


            {/* Terms */}

            <p className="mt-5 px-4 text-center text-[11px] leading-5 text-neutral-400">
              By continuing, you agree to
              Forsa's{" "}
              <Link
                to="/terms"
                className="font-semibold text-neutral-600 transition hover:text-neutral-900 hover:underline"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="font-semibold text-neutral-600 transition hover:text-neutral-900 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>

          </div>

        </div>
      </section>
    </main>
  );
}


// ============================================================
// WELCOME STEP
// ============================================================

function WelcomeStep({
  onChooseMode,
  onGoogleLogin,
  loading,
}) {
  return (
    <div>

      <div className="mb-7">

        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--forsa-primary)]">
          Get started
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
          Welcome to Forsa
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Find opportunities or connect
          with the people you need.
        </p>

      </div>


      <div className="flex flex-col gap-3">

        <button
          type="button"
          onClick={() =>
            onChooseMode("signup")
          }
          disabled={loading}
          className="forsa-click flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--forsa-primary-light)] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          Create an account
          <FaArrowRight className="text-xs" />
        </button>


        <button
          type="button"
          onClick={() =>
            onChooseMode("login")
          }
          disabled={loading}
          className="forsa-click flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          Log in
        </button>


        <div className="my-2 flex items-center gap-3">

          <div className="h-px flex-1 bg-[var(--forsa-border)]" />

          <span className="text-[11px] font-medium text-neutral-400">
            OR
          </span>

          <div className="h-px flex-1 bg-[var(--forsa-border)]" />

        </div>


        <button
          type="button"
          onClick={onGoogleLogin}
          disabled={loading}
          className="forsa-click flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          <FaGoogle className="text-sm" />

          {loading
            ? "Connecting..."
            : "Continue with Google"}
        </button>

      </div>

    </div>
  );
}


// ============================================================
// ACCOUNT TYPE CHOICE
// ============================================================

function ChoiceStep({
  accountType,
  setAccountType,
  onContinue,
  onBack,
}) {
  return (
    <div>

      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex min-h-8 items-center gap-2 text-xs font-medium text-neutral-500 transition hover:text-neutral-900"
      >
        <FaArrowLeft className="text-[10px]" />
        Back
      </button>


      <div className="mb-5">

        <div className="flex items-center justify-between">

          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--forsa-primary)]">
            Step 1 of 2
          </p>

          <span className="text-[11px] font-medium text-neutral-400">
            Choose your path
          </span>

        </div>

        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
          How will you use Forsa?
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Choose the account that best
          matches what you want to do.
        </p>

      </div>


      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        <TypeCard
          active={
            accountType === "finder"
          }
          icon={<FaUserPlus />}
          title="Find opportunities"
          text="For students, freelancers, creators, and people looking for work."
          onClick={() =>
            setAccountType("finder")
          }
        />

        <TypeCard
          active={
            accountType === "hiring"
          }
          icon={<FaBriefcase />}
          title="Company / hiring"
          text="For businesses, creators, and teams posting opportunities."
          onClick={() =>
            setAccountType("hiring")
          }
        />

      </div>


      <button
        type="button"
        onClick={onContinue}
        className="forsa-click mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--forsa-primary-light)] active:scale-[0.99]"
      >
        Continue
        <FaArrowRight className="text-xs" />
      </button>

    </div>
  );
}


// ============================================================
// FORM STEP
// ============================================================

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
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  passwordIssue,
  passwordRequirements,
  passwordsMatch,
  onModeSwitch,
}) {
  const isHiring =
    accountType === "hiring";

  return (
    <div>

      {/* Top navigation */}

      <div className="mb-6 flex items-center justify-between gap-4">

        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="inline-flex min-h-8 items-center gap-2 text-xs font-medium text-neutral-500 transition hover:text-neutral-900 disabled:cursor-wait disabled:opacity-60"
        >
          <FaArrowLeft className="text-[10px]" />

          {isSignup
            ? "Change type"
            : "Back"}
        </button>


        <div className="flex items-center gap-2">

          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isSignup
                ? "bg-[var(--forsa-primary)]"
                : "bg-neutral-300"
            }`}
          />

          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isSignup
                ? "bg-[var(--forsa-primary)]"
                : "bg-neutral-300"
            }`}
          />

        </div>

      </div>


      {/* Heading */}

      <div className="mb-6">

        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--forsa-primary)]">
          {isSignup
            ? "Step 2 of 2"
            : "Welcome back"}
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
          {isSignup
            ? isHiring
              ? "Create company account"
              : "Create your work profile"
            : "Log in to Forsa"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          {isSignup
            ? isHiring
              ? "Set up your company details to start posting opportunities."
              : "Create your profile and start discovering opportunities."
            : "Enter your credentials to continue."}
        </p>

      </div>


      {/* Form */}

      <div className="grid gap-4">

        {/* Hiring fields */}

        {isSignup && isHiring && (
          <>
            <Field
              icon={<FaBuilding />}
              label="Company name"
              placeholder="Pixel House"
              value={form.companyName}
              onChange={(value) =>
                updateField(
                  "companyName",
                  value
                )
              }
              autoComplete="organization"
            />

            <Field
              icon={<FaEnvelope />}
              label="Company email"
              type="email"
              placeholder="jobs@company.com"
              value={form.companyEmail}
              onChange={(value) =>
                updateField(
                  "companyEmail",
                  value
                )
              }
              autoComplete="email"
            />

            <Field
              icon={<FaUser />}
              label="Contact person"
              placeholder="Enter your full name"
              value={form.contactPerson}
              onChange={(value) =>
                updateField(
                  "contactPerson",
                  value
                )
              }
              autoComplete="name"
            />
          </>
        )}


        {/* Finder fields */}

        {isSignup && !isHiring && (
          <>
            <Field
              icon={<FaUser />}
              label="Full name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={(value) =>
                updateField(
                  "name",
                  value
                )
              }
              autoComplete="name"
            />

            <Field
              icon={<FaEnvelope />}
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(value) =>
                updateField(
                  "email",
                  value
                )
              }
              autoComplete="email"
            />
          </>
        )}


        {/* Login email */}

        {!isSignup && (
          <Field
            icon={<FaEnvelope />}
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(value) =>
              updateField(
                "email",
                value
              )
            }
            autoComplete="email"
          />
        )}


        {/* Password */}

        <PasswordField
          value={form.password}
          onChange={(value) =>
            updateField(
              "password",
              value
            )
          }
          showPassword={
            showPassword
          }
          setShowPassword={
            setShowPassword
          }
          autoComplete={
            isSignup
              ? "new-password"
              : "current-password"
          }
        />


        {/* Password requirements */}

        {isSignup && (
          <div className="rounded-2xl border border-[var(--forsa-border)] bg-neutral-50/80 p-4">

            <p className="mb-3 text-[11px] font-semibold text-neutral-700">
              Password requirements
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

              <PasswordRequirement
                valid={
                  passwordRequirements.length
                }
                text="8+ characters"
              />

              <PasswordRequirement
                valid={
                  passwordRequirements.uppercase
                }
                text="One uppercase letter"
              />

              <PasswordRequirement
                valid={
                  passwordRequirements.lowercase
                }
                text="One lowercase letter"
              />

              <PasswordRequirement
                valid={
                  passwordRequirements.number
                }
                text="One number"
              />

              <PasswordRequirement
                valid={
                  passwordRequirements.symbol
                }
                text="One symbol"
              />

            </div>

          </div>
        )}


        {/* Confirm password */}

        {isSignup && (
          <div>

            <PasswordField
              value={
                form.confirmPassword
              }
              onChange={(value) =>
                updateField(
                  "confirmPassword",
                  value
                )
              }
              showPassword={
                showConfirmPassword
              }
              setShowPassword={
                setShowConfirmPassword
              }
              label="Confirm password"
              placeholder="Enter your password again"
              autoComplete="new-password"
            />

            {form.confirmPassword && (
              <p
                className={`mt-2 text-[11px] ${
                  passwordsMatch
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {passwordsMatch
                  ? "Passwords match."
                  : "Passwords do not match."}
              </p>
            )}

          </div>
        )}


        {/* Forgot password */}

        {!isSignup && (
          <div className="flex justify-end">

            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-[var(--forsa-primary)] transition hover:underline"
            >
              Forgot password?
            </Link>

          </div>
        )}


        {/* Signup location */}

        {isSignup && (
          <Field
            icon={<FaMapMarkerAlt />}
            label={
              isHiring
                ? "Company location"
                : "City"
            }
            placeholder="Beirut, Tripoli, Saida..."
            value={form.city}
            onChange={(value) =>
              updateField(
                "city",
                value
              )
            }
            autoComplete="address-level2"
          />
        )}


        {/* Submit */}

        <button
          type="button"
          disabled={
            !canContinue ||
            loading
          }
          onClick={onSubmit}
          className={`forsa-click mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition active:scale-[0.99] ${
            canContinue && !loading
              ? "bg-[var(--forsa-primary)] text-white shadow-sm hover:bg-[var(--forsa-primary-light)]"
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

          {!loading && (
            <FaArrowRight className="text-xs" />
          )}
        </button>


        {/* Mode switch */}

        <div className="pt-1 text-center text-xs text-neutral-500">

          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              onModeSwitch(
                isSignup
                  ? "login"
                  : "signup"
              )
            }
            className="ml-1 font-semibold text-[var(--forsa-primary)] hover:underline disabled:opacity-50"
          >
            {isSignup
              ? "Log in"
              : "Create one"}
          </button>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// TYPE CARD
// ============================================================

function SpotlightCard({
  active,
  children,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-[22px] border p-[1px] text-left transition duration-300 ${
        active
          ? "border-transparent shadow-[0_14px_40px_rgba(109,40,217,0.15)]"
          : "border-[var(--forsa-border)] shadow-sm hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(109,40,217,0.07)]"
      }`}
    >
      <div
        className={`relative h-full rounded-[21px] p-5 transition ${
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


function TypeCard({
  active,
  icon,
  title,
  text,
  onClick,
}) {
  return (
    <SpotlightCard
      active={active}
      onClick={onClick}
    >

      <div className="flex items-center justify-between gap-3">

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base shadow-sm ${
            active
              ? "bg-white/20 text-white ring-1 ring-white/25"
              : "bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
          }`}
        >
          {icon}
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
            active
              ? "bg-white/15 text-white"
              : "bg-[var(--forsa-bg)] text-neutral-500"
          }`}
        >
          {active
            ? "Selected"
            : "Choose"}
        </span>

      </div>

      <p className="mt-4 text-sm font-semibold tracking-[-0.02em] sm:text-base">
        {title}
      </p>

      <p
        className={`mt-1.5 text-xs leading-5 ${
          active
            ? "text-white/85"
            : "text-neutral-500"
        }`}
      >
        {text}
      </p>

      <div
        className={`mt-4 h-1 overflow-hidden rounded-full ${
          active
            ? "bg-white/20"
            : "bg-[var(--forsa-bg)]"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            active
              ? "w-full bg-white"
              : "w-1/3 bg-[var(--forsa-soft)]"
          }`}
        />
      </div>

    </SpotlightCard>
  );
}


// ============================================================
// INPUT FIELD
// ============================================================

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  icon,
  autoComplete = "off",
}) {
  return (
    <div className="w-full">

      <label className="block text-xs font-semibold tracking-tight text-neutral-700">
        {label}
      </label>

      <div className="forsa-focus mt-1.5 flex min-h-12 items-center gap-3 rounded-xl border border-[var(--forsa-border)] bg-white px-3.5 py-2.5 transition focus-within:border-[var(--forsa-primary)] focus-within:ring-4 focus-within:ring-[var(--forsa-primary)]/10">

        {icon && (
          <span className="shrink-0 text-sm text-neutral-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full min-w-0 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />

      </div>

    </div>
  );
}


// ============================================================
// PASSWORD FIELD
// ============================================================

function PasswordField({
  value,
  onChange,
  showPassword,
  setShowPassword,
  label = "Password",
  placeholder = "Enter your password",
  autoComplete = "current-password",
}) {
  return (
    <div className="w-full">

      <label className="block text-xs font-semibold tracking-tight text-neutral-700">
        {label}
      </label>

      <div className="forsa-focus mt-1.5 flex min-h-12 items-center gap-3 rounded-xl border border-[var(--forsa-border)] bg-white px-3.5 py-2.5 transition focus-within:border-[var(--forsa-primary)] focus-within:ring-4 focus-within:ring-[var(--forsa-primary)]/10">

        <FaLock className="shrink-0 text-sm text-neutral-400" />

        <input
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full min-w-0 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />

        <button
          type="button"
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
          onClick={() =>
            setShowPassword(
              !showPassword
            )
          }
          className="shrink-0 p-1 text-neutral-400 transition hover:text-neutral-700 active:scale-95"
        >
          {showPassword ? (
            <FaEyeSlash className="text-sm" />
          ) : (
            <FaEye className="text-sm" />
          )}
        </button>

      </div>

    </div>
  );
}


// ============================================================
// PASSWORD REQUIREMENT
// ============================================================

function PasswordRequirement({
  valid,
  text,
}) {
  return (
    <div
      className={`flex items-center gap-2 text-[11px] ${
        valid
          ? "text-emerald-600"
          : "text-neutral-400"
      }`}
    >

      <FaCheckCircle
        className={`shrink-0 text-[10px] ${
          valid
            ? "opacity-100"
            : "opacity-40"
        }`}
      />

      <span>{text}</span>

    </div>
  );
}


// ============================================================
// TRUST ITEMS
// ============================================================

function TrustItem({
  title,
  text,
}) {
  return (
    <div className="rounded-2xl border border-[var(--forsa-border)] bg-white/80 p-4 shadow-sm backdrop-blur-xl">

      <div className="flex items-start gap-3">

        <FaCheckCircle className="mt-1 shrink-0 text-sm text-[var(--forsa-primary)]" />

        <div>

          <p className="text-sm font-semibold text-neutral-900">
            {title}
          </p>

          <p className="mt-1 text-sm leading-6 text-neutral-500">
            {text}
          </p>

        </div>

      </div>

    </div>
  );
}