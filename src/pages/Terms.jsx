import AppHeader from "../components/AppHeader";
import SEO from "../components/SEO";
import Footer from "../components/Footer";

export default function Terms() {
  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <SEO title="Terms of Service" />

      <AppHeader />

      <main className="mx-auto max-w-3xl px-5 pb-28 pt-8 sm:px-6 lg:pb-20">
        <div className="rounded-[32px] border border-[var(--forsa-border)] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-[var(--forsa-primary)]">
            Forsa
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
            Terms of Service
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            Last updated: May 2026
          </p>

          <div className="mt-8 space-y-7 text-sm leading-7 text-neutral-700">
            <Section title="1. Using Forsa">
              Forsa is a platform for finding work, posting opportunities,
              applying to roles, and managing applicant conversations.
            </Section>

            <Section title="2. User responsibility">
              Users are responsible for the accuracy of their profiles, posts,
              messages, and application information.
            </Section>

            <Section title="3. Opportunity posts">
              Companies and posters must avoid fake, misleading, unsafe, spam,
              or illegal opportunities. Forsa may remove posts that violate
              platform rules.
            </Section>

            <Section title="4. Applications and hiring">
              Forsa helps connect seekers and companies, but does not guarantee
              hiring, payment, interviews, or employment outcomes.
            </Section>

            <Section title="5. Account access">
              We may restrict or remove accounts that abuse the platform,
              impersonate others, spam users, or post harmful content.
            </Section>

            <Section title="6. Contact">
              For support, contact us at support@forsa.digital.
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