import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheck, FaKey, FaLock } from "react-icons/fa";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { showToast } from "../lib/Toast";
import {
  verifyPasswordResetActionCode,
  confirmPasswordResetActionCode,
} from "../lib/auth";
import {
  validatePassword,
  getPasswordRequirements,
} from "../lib/password";

const getActionCodeError = (err) => {
  const code = err?.code || "";

  if (
    code === "auth/invalid-action-code" ||
    code === "auth/expired-action-code" ||
    code === "auth/action-code-invalid" ||
    code === "auth/internal-error"
  ) {
    return "This reset link is invalid or has expired. Please request a new one.";
  }

  if (code === "auth/user-disabled") {
    return "Your account has been disabled. Please contact support.";
  }

  if (code === "auth/network-request-failed") {
    return "Network error. Check your connection and try again.";
  }

  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return "We couldn't process this reset link. Please request a new one.";
};

const getResetSubmitError = (err) => {
  const code = err?.code || "";

  if (
    code === "auth/invalid-action-code" ||
    code === "auth/expired-action-code" ||
    code === "auth/action-code-invalid"
  ) {
    return "This reset link is invalid or has expired. Please request a new one.";
  }

  if (code === "auth/weak-password") {
    return validatePassword("");
  }

  if (code === "auth/network-request-failed") {
    return "Network error. Check your connection and try again.";
  }

  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return "We couldn't reset your password right now. Please try again.";
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  const [codeState, setCodeState] = useState("checking");
  const [resetEmail, setResetEmail] = useState("");
  const [codeError, setCodeError] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const invalidParams = !oobCode || (mode && mode !== "resetPassword");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      if (invalidParams) {
        if (cancelled) return;

        setCodeState("invalid");
        setCodeError("This reset link is invalid or incomplete. Please request a new one.");
        return;
      }

      try {
        /*
         * Firebase validates the oobCode server-side; the URL value is
         * never trusted or decoded by the client.
         */
        const email = await verifyPasswordResetActionCode(oobCode);

        if (cancelled) return;

        setResetEmail(email);
        setCodeState("ready");
      } catch (err) {
        if (cancelled) return;

        console.error("Password reset code validation failed:", err);
        setCodeError(getActionCodeError(err));
        setCodeState("invalid");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [oobCode, invalidParams]);

  const handleSubmit = async () => {
    if (submitting || codeState !== "ready") return;

    const trimmed = password.trim();
    const passwordIssue = validatePassword(trimmed);

    if (passwordIssue) {
      setFormError(passwordIssue);
      return;
    }

    if (confirm !== password) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      await confirmPasswordResetActionCode(oobCode, password);

      setSubmitting(false);

      /*
       * Firebase does not manufacture a session from a password reset.
       * Send the user to the login flow (replace so the reset-token URL
       * is not left behind in history).
       */
      showToast("Password reset successful. Sign in with your new password.");
      navigate("/auth?mode=login", { replace: true });
    } catch (err) {
      console.error("Password reset submit failed:", err);
      setFormError(getResetSubmitError(err));
      setSubmitting(false);
    }
  };

  const requirements = getPasswordRequirements(password);

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111111]">
      <SEO title="Reset password" />

      <section className="mx-auto flex min-h-screen max-w-xl items-center px-5 py-10 sm:px-6">
        <div className="w-full rounded-[32px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm sm:p-7">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 transition hover:text-[var(--forsa-primary)]"
          >
            <FaArrowLeft className="text-xs" />
            Back to login
          </Link>

          <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
            <FaKey />
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
            Password reset
          </h1>

          {codeState === "checking" && (
            <>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                Checking your reset link…
              </p>

              <div className="mt-6 h-1 w-full">
                <div
                  className="h-full"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--forsa-primary, #8b5cf6), #a78bfa)",
                  }}
                />
              </div>
            </>
          )}

          {codeState === "invalid" && (
            <>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                {codeError}
              </p>

              <Link
                to="/forgot-password"
                className="forsa-click mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-semibold text-white"
              >
                Request a new reset link
              </Link>
            </>
          )}

          {codeState === "ready" && (
            <>
              {resetEmail && (
                <p className="mt-3 text-sm leading-7 text-neutral-600">
                  Choose a new password
                  {resetEmail ? (
                    <>
                      {" "}
                      for{" "}
                      <span className="font-medium text-neutral-800">
                        {resetEmail}
                      </span>
                    </>
                  ) : null}
                  .
                </p>
              )}

              {formError && (
                <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                  {formError}
                </div>
              )}

              <div className="mt-6">
                <label className="text-sm font-medium">New password</label>

                <div className="forsa-focus mt-2 flex items-center gap-3 rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3">
                  <FaLock className="text-neutral-400" />

                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setFormError("");
                      setPassword(event.target.value);
                    }}
                    placeholder="At least 8 characters"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium">
                  Confirm new password
                </label>

                <div className="forsa-focus mt-2 flex items-center gap-3 rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3">
                  <FaLock className="text-neutral-400" />

                  <input
                    type="password"
                    value={confirm}
                    onChange={(event) => {
                      setFormError("");
                      setConfirm(event.target.value);
                    }}
                    placeholder="Re-enter your new password"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
                <span
                  className={
                    requirements.length
                      ? "font-medium text-green-600"
                      : ""
                  }
                >
                  {requirements.length ? <FaCheck className="mr-1 inline" /> : "•"} 8+ characters
                </span>
                <span
                  className={
                    requirements.uppercase
                      ? "font-medium text-green-600"
                      : ""
                  }
                >
                  {requirements.uppercase ? <FaCheck className="mr-1 inline" /> : "•"} Uppercase
                </span>
                <span
                  className={
                    requirements.lowercase
                      ? "font-medium text-green-600"
                      : ""
                  }
                >
                  {requirements.lowercase ? <FaCheck className="mr-1 inline" /> : "•"} Lowercase
                </span>
                <span
                  className={
                    requirements.number ? "font-medium text-green-600" : ""
                  }
                >
                  {requirements.number ? <FaCheck className="mr-1 inline" /> : "•"} Number
                </span>
                <span
                  className={
                    requirements.symbol ? "font-medium text-green-600" : ""
                  }
                >
                  {requirements.symbol ? <FaCheck className="mr-1 inline" /> : "•"} Symbol
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="forsa-click mt-5 flex w-full items-center justify-center rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
              >
                {submitting
                  ? "Saving new password..."
                  : "Reset password"}
              </button>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}