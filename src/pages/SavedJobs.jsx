import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { FaBookmark, FaBriefcase, FaMapMarkerAlt, FaTrash } from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import { showToast } from "../lib/Toast";
import { getUserSavedJobs, unsaveJob } from "../lib/savedJobsService";

const safeJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

export default function SavedJobs() {
  const navigate = useNavigate();
  const account = safeJson("forsaAccount", null);

  const [savedJobs, setSavedJobs] = useState(safeJson("forsaSavedJobs", []));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account?.uid) {
      setLoading(false);
      return;
    }

    const loadSaved = async () => {
      try {
        const saved = await getUserSavedJobs(account.uid);
        const normalized = saved.map((item) => ({
          ...item.post,
          savedJobId: item.id,
          savedAt: item.savedAt,
        }));

        setSavedJobs(normalized);
        localStorage.setItem("forsaSavedJobs", JSON.stringify(normalized));
      } catch (error) {
        console.error("Load saved jobs error:", error);
        showToast("Could not refresh saved jobs.", "info");
      } finally {
        setLoading(false);
      }
    };

    loadSaved();
  }, [account?.uid]);

  const removeSaved = async (postId) => {
    try {
      await unsaveJob({
        userUid: account.uid,
        postId,
      });

      const updated = savedJobs.filter((job) => String(job.id) !== String(postId));
      setSavedJobs(updated);
      localStorage.setItem("forsaSavedJobs", JSON.stringify(updated));
      showToast("Removed from saved jobs");
    } catch (error) {
      console.error("Remove saved job error:", error);
      showToast("Could not remove saved job.", "error");
    }
  };

  if (!account) {
    return (
      <section>
        <AppHeader />

        <div className="mx-auto max-w-3xl px-5 py-14 pb-28 sm:px-6 sm:py-20">
          <div className="rounded-[28px] border border-[var(--forsa-border)] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full forsa-button text-white">
              <FaBookmark />
            </div>

            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
              Login to view saved jobs.
            </h1>

            <Link
              to="/auth"
              className="mt-6 inline-flex rounded-full forsa-button px-6 py-3 text-sm font-medium text-white"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-[1180px] px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-8 rounded-[30px] border border-[var(--forsa-border)] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Saved jobs</p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
            Your saved opportunities
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600">
            Keep interesting opportunities here and come back when you are ready to apply.
          </p>
        </div>

        {loading ? (
          <div className="mt-6 rounded-[28px] border border-[var(--forsa-border)] bg-white p-10 text-center">
            <p className="font-medium">Loading saved jobs...</p>
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-[var(--forsa-border)] bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg)] text-neutral-500">
              <FaBookmark />
            </div>

            <h2 className="mt-5 text-2xl font-semibold">No saved jobs yet.</h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600">
              Save opportunities from Explore and they will appear here.
            </p>

            <button
              onClick={() => navigate("/explore")}
              className="mt-6 rounded-full forsa-button px-5 py-3 text-sm font-medium text-white"
            >
              Explore jobs
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {savedJobs.map((job) => (
              <article
                key={job.id}
                className="rounded-[26px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(18,60,47,0.08)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full forsa-button text-white">
                    <FaBriefcase />
                  </div>

                  <div className="min-w-0">
                    <h2 className="line-clamp-2 font-semibold tracking-[-0.02em]">
                      {job.title}
                    </h2>

                    <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
                      <FaMapMarkerAlt className="text-[10px]" />
                      <span className="truncate">
                        {job.company} · {job.location}
                      </span>
                    </p>
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">
                  {job.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--forsa-bg)] px-3 py-1.5 text-xs text-neutral-600">
                    {job.type}
                  </span>

                  <span className="rounded-full bg-[var(--forsa-bg)] px-3 py-1.5 text-xs text-neutral-600">
                    {job.pay}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate(`/explore?post=${job.id}`)}
                    className="rounded-full forsa-button px-4 py-3 text-sm font-medium text-white"
                  >
                    View
                  </button>

                  <button
                    onClick={() => removeSaved(job.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600"
                  >
                    <FaTrash className="text-xs" />
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </section>
  );
}