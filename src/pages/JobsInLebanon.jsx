import SEO from "../components/SEO";
import AppHeader from "../components/AppHeader";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function JobsInLebanon() {
  return (
    <div className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)]">
      <SEO
        title="Jobs in Lebanon | Find Jobs & Opportunities — Forsa"
        description="Find jobs in Lebanon with Forsa. Discover full-time jobs, internships, freelance opportunities, and career opportunities from companies across Lebanon."
      />

      <AppHeader />

      <main className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-24">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold text-[var(--forsa-primary)]">
            Jobs in Lebanon
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Find jobs and career opportunities in Lebanon
          </h1>

          <p className="mt-6 text-base leading-8 text-neutral-600 sm:text-lg">
            Forsa connects job seekers with companies, startups, businesses,
            and organizations hiring across Lebanon. Explore jobs,
            internships, freelance opportunities, and other career paths.
          </p>

          <Link
            to="/explore"
            className="mt-8 inline-flex rounded-full bg-[var(--forsa-primary)] px-6 py-3 text-sm font-semibold text-white"
          >
            Explore opportunities
          </Link>
        </section>

        <section className="mt-20 max-w-3xl">
          <h2 className="text-2xl font-semibold">
            Find opportunities across Lebanon
          </h2>

          <p className="mt-4 leading-8 text-neutral-600">
            Whether you are a student looking for an internship, a graduate
            searching for your first job, a freelancer looking for projects,
            or an experienced professional exploring new opportunities, Forsa
            provides one place to discover career opportunities in Lebanon.
          </p>

          <p className="mt-4 leading-8 text-neutral-600">
            Browse opportunities by type, location, and other useful filters,
            then connect with employers through Forsa.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}