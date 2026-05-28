import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--forsa-bg)] px-5">
      <div className="max-w-md text-center">
        <div className="inline-flex rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--forsa-primary)]">
          404 Error
        </div>

        <h1 className="mt-6 text-6xl font-semibold tracking-[-0.08em]">
          Lost?
        </h1>

        <p className="mt-4 text-sm leading-7 text-neutral-600">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-medium text-white"
          >
            <FaArrowLeft className="text-xs" />
            Back home
          </Link>

          <Link
            to="/explore"
            className="rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-medium text-neutral-700"
          >
            Explore jobs
          </Link>
        </div>
      </div>
    </main>
  );
}