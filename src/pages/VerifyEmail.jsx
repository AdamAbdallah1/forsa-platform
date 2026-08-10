import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaEnvelope, FaRedo, FaSignOutAlt } from "react-icons/fa";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import emailAnimation from "../assets/cta-hero.lottie";
import {
  auth,
  db,
} from "../lib/firebase";
import {
  completeEmailVerification,
  resendVerificationEmail,
  logout,
} from "../lib/auth";
import { doc, getDoc } from "firebase/firestore";

export default function VerifyEmail() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const email = auth.currentUser?.email || "";

  const handleCheckVerification = async () => {
    setChecking(true);
    setMessage("");
    setError("");

    try {
      const verified = await completeEmailVerification();

      if (!verified) {
        setError(
          "Your email hasn't been verified yet. Please check your inbox and click the verification link."
        );
        return;
      }

      /*
       * Get the user's profile so we can determine
       * which part of Forsa they should enter.
       */
      const uid = auth.currentUser.uid;
      const userDoc = await getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        throw new Error("User profile not found.");
      }

      const account = userDoc.data();

      if (account.accountType === "hiring") {
        navigate("/post", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (err) {
      console.error("Email verification check failed:", err);

      setError(
        err?.message ||
          "Something went wrong while checking your verification status."
      );
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setMessage("");
    setError("");

    try {
      await resendVerificationEmail();

      setMessage(
        "Verification email sent. Check your inbox and spam folder."
      );
    } catch (err) {
      console.error("Verification email resend failed:", err);

      setError(
        "We couldn't resend the verification email right now. Please wait a moment and try again."
      );
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: "var(--forsa-bg)",
        color: "var(--forsa-text)",
      }}
    >
      <main className="w-full max-w-md">
        <div
          className="rounded-2xl  p-7 sm:p-9"
          style={{
            background: "var(--forsa-surface)",
            borderColor: "var(--forsa-border)",
          }}
        >
<div className="flex justify-center mb-4">
  <div className="w-24 h-24 sm:w-28 sm:h-28">
    <DotLottieReact
      src={emailAnimation}
      loop
      autoplay
    />
  </div>
</div>

          {/* Heading */}
          <div className="text-center">
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: "var(--forsa-text)" }}
            >
              Verify your email
            </h1>

            <p
              className="mt-3 text-sm leading-6"
              style={{ color: "var(--forsa-muted)" }}
            >
              We sent a verification link to
            </p>

            <p
              className="mt-1 font-medium break-all"
              style={{ color: "var(--forsa-text)" }}
            >
              {email}
            </p>
          </div>

          {/* Instructions */}
          <div
            className="mt-7 rounded-xl border p-4"
            style={{
              background: "var(--forsa-bg)",
              borderColor: "var(--forsa-border)",
            }}
          >
            <div className="flex gap-3">
              <FaCheckCircle
                className="mt-1 flex-shrink-0"
                style={{
                  color: "var(--forsa-primary, #8b5cf6)",
                }}
              />

              <p
                className="text-sm leading-6"
                style={{ color: "var(--forsa-muted)" }}
              >
                Open the email from Forsa and click the verification link.
                Once you've done that, return here and continue.
              </p>
            </div>
          </div>

          {/* Status */}
          {message && (
            <div
              className="mt-5 rounded-xl border px-4 py-3 text-sm"
              style={{
                background: "rgba(34, 197, 94, 0.08)",
                borderColor: "rgba(34, 197, 94, 0.2)",
                color: "var(--forsa-text)",
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              className="mt-5 rounded-xl border px-4 py-3 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                borderColor: "rgba(239, 68, 68, 0.2)",
                color: "var(--forsa-text)",
              }}
            >
              {error}
            </div>
          )}

          {/* Primary action */}
          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full mt-6 h-11 rounded-xl font-semibold transition-opacity disabled:opacity-60"
            style={{
              background: "var(--forsa-primary, #8b5cf6)",
              color: "#fff",
            }}
          >
            {checking ? "Checking..." : "I've verified my email"}
          </button>

          {/* Resend */}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full mt-3 h-11 rounded-xl border font-medium transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              borderColor: "var(--forsa-border)",
              color: "var(--forsa-text)",
              background: "transparent",
            }}
          >
            <FaRedo className={resending ? "animate-spin" : ""} />
            {resending ? "Sending..." : "Resend verification email"}
          </button>

          {/* Help */}
          <p
            className="mt-5 text-center text-xs leading-5"
            style={{ color: "var(--forsa-muted)" }}
          >
            Didn't receive it? Check your spam or junk folder before
            requesting another email.
          </p>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="mx-auto mt-6 flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--forsa-muted)" }}
          >
            <FaSignOutAlt />
            Sign out
          </button>
        </div>

        {/* Brand */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--forsa-muted)" }}
        >
          Forsa · Find your next opportunity
        </p>
      </main>
    </div>
  );
}
