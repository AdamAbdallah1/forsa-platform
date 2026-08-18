import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

const ADMIN_EMAIL = "support.forsa@gmail.com";

export default function AdminEmail() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
  }, []);

  const sendEmail = async (e) => {
    e.preventDefault();
    setResult(null);

    if (!user) {
      setResult({ type: "error", text: "You are not signed in." });
      return;
    }

    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setResult({ type: "error", text: "Admin access required." });
      return;
    }

    if (!to.trim() || !subject.trim() || !message.trim()) {
      setResult({
        type: "error",
        text: "Recipient, subject, and message are required.",
      });
      return;
    }

    setSending(true);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch("/api/send-outreach-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email.");
      }

      setResult({
        type: "success",
        text: `Email sent successfully. ID: ${data.emailId || "unknown"}`,
      });

      setTo("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error(error);

      setResult({
        type: "error",
        text: error.message || "Failed to send email.",
      });
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white border p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            Admin access required
          </h1>
          <p className="mt-2 text-gray-500">
            This page is restricted to Forsa administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Forsa Email
          </h1>
          <p className="mt-2 text-gray-500">
            Send an email through your verified Forsa domain using Resend.
          </p>
        </div>

        <form
          onSubmit={sendEmail}
          className="rounded-2xl border bg-white p-6 shadow-sm"
        >
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Recipient
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="company@example.com"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Partnership opportunity with Forsa"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your email..."
                rows={12}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {result && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  result.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {result.text}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
