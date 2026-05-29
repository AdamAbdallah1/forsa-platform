import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaEnvelope } from "react-icons/fa";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { showToast } from "../lib/Toast";
import { resetPassword } from "../lib/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword(cleanEmail);
      setSent(true);
      showToast("Password reset email sent");
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Could not send reset email. Check the email and try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <FaEnvelope />
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
            Reset your password.
          </h1>

          <p className="mt-3 text-sm leading-7 text-neutral-600">
            Enter your email and Forsa will send you a password reset link.
          </p>

          {sent ? (
            <div className="mt-6 rounded-[24px] bg-green-50 p-5">
              <p className="font-semibold text-green-700">Check your email</p>
              <p className="mt-2 text-sm leading-6 text-green-700">
                If an account exists for {email}, you’ll receive a reset link shortly.
              </p>

              <Link
                to="/auth"
                className="mt-5 inline-flex rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-semibold text-white"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                  {error}
                </div>
              )}

              <div className="mt-6">
                <label className="text-sm font-medium">Email address</label>

                <div className="forsa-focus mt-2 flex items-center gap-3 rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3">
                  <FaEnvelope className="text-neutral-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setError("");
                      setEmail(event.target.value);
                    }}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleReset}
                disabled={loading}
                className="forsa-click mt-5 flex w-full items-center justify-center rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}