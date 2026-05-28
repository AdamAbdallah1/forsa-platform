import AppHeader from "../components/AppHeader";
import SEO from "../components/SEO";
import Footer from "../components/Footer";

export default function Privacy() {
  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <SEO title="Privacy Policy" />

      <AppHeader />

      <main className="mx-auto max-w-3xl px-5 pb-28 pt-8 sm:px-6 lg:pb-20">
        <div className="rounded-[32px] border border-[var(--forsa-border)] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-[var(--forsa-primary)]">
            Forsa
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
            Privacy Policy
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            Last updated: May 2026
          </p>

          <div className="mt-8 space-y-7 text-sm leading-7 text-neutral-700">
            <Section title="1. Information we collect">
              Forsa may collect basic account information such as your name,
              email, city, profile details, skills, applications, messages, and
              opportunity posts.
            </Section>

            <Section title="2. How we use information">
              We use this information to help users find opportunities, apply to
              posts, manage applicants, send notifications, and improve the
              platform experience.
            </Section>

            <Section title="3. Messages and applications">
              When you apply to an opportunity, your profile information,
              application message, answers, and CV metadata may be shared with
              the company or poster.
            </Section>

            <Section title="4. Data storage">
              Forsa may store data using browser storage and cloud services such
              as Firebase. We take reasonable steps to protect user data.
            </Section>

            <Section title="5. User control">
              Users can update their profile, remove saved jobs, and manage
              their information inside the platform.
            </Section>

            <Section title="6. Contact">
              For privacy questions, contact us at support@forsa.digital.
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </section>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-[-0.03em] text-black">
        {title}
      </h2>

      <p className="mt-2">{children}</p>
    </section>
  );
}