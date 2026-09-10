import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBuilding,
  FaCompass,
  FaEnvelope,
  FaGlobe,
  FaInstagram,
  FaLinkedin,
  FaUsers,
} from "react-icons/fa";
import SEO from "../components/SEO";
import HomeNavbar from "../components/HomeNavbar";
import Footer from "../components/Footer";

const typeTag =
  "text-[11px] font-bold uppercase tracking-[.15em] text-[#5B3DF5]";

const sectionTitle =
  "mt-2 font-['Sora',sans-serif] text-3xl font-bold leading-tight tracking-[-.045em] sm:text-4xl";

const bodyText =
  "text-sm leading-7 text-[#55555e] sm:text-base";

export default function About() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfbfd] text-[#111113] font-['Geist',sans-serif] selection:bg-[#5B3DF5] selection:text-white">
      <SEO
        title="About Forsa — Lebanon's Career Community"
        description="Meet Forsa and its founder, Adam Yakoub Abdallah. We're building a Lebanese career community connecting emerging talent with companies and opportunities."
      />

      <HomeNavbar />

      <main>
        <section className="relative overflow-hidden border-b border-[#ececf1] bg-[#fbfbfd]">
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              backgroundImage:
                "linear-gradient(rgba(91,61,245,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(91,61,245,.045) 1px,transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "linear-gradient(to bottom,black,transparent 82%)",
            }}
          />
          <div className="absolute top-0 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#5B3DF5]/[0.07] blur-[110px] pointer-events-none" />

          <div className="relative mx-auto max-w-[1100px] px-5 py-16 sm:px-8 sm:py-24">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-[#dedbef] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#696773]">
                About Forsa
              </p>

              <h1 className="mt-5 max-w-3xl font-['Sora',sans-serif] text-[clamp(2.25rem,8vw,3.75rem)] font-bold leading-[1.05] tracking-[-.045em] sm:text-6xl">
                A Lebanese career community.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-[#696773] sm:text-lg">
                Forsa connects students, early-career talent, and ambitious
                professionals with companies, opportunities, and people across
                Lebanon. Today it&apos;s a platform for discovering and applying
                to career opportunities — and it&apos;s being built into
                something more.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 rounded-full bg-[#5B3DF5] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4930D4]"
                >
                  Explore opportunities <FaArrowRight className="text-[10px]" />
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="inline-flex items-center gap-2 rounded-full border border-[#dedde5] bg-white px-6 py-3 text-sm font-semibold text-[#33333c] transition hover:border-[#5B3DF5]/30"
                >
                  For companies
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1100px] gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className={typeTag}>Why Forsa exists</p>
              <h2 className={`${sectionTitle} mt-2`}>
                The problem we&apos;re working on
              </h2>
            </div>

            <div className="space-y-5 text-sm leading-7 text-[#55555e] sm:text-base">
              <p>
                Finding a first internship or a serious early-career
                opportunity is still one of the hardest parts of starting out
                in Lebanon. Students and young professionals often don&apos;t
                know where to look, who to trust, or how to put themselves in
                front of the right people.
              </p>
              <p>
                Companies, meanwhile, struggle to find talented early-career
                people without drowning in noise. Forsa exists to close that
                gap: one clear path from discovering an opportunity to meeting
                the team behind it.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-[#ececf1] bg-[#f7f7fa] py-16 sm:py-20">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-6 lg:px-8">
            <p className={typeTag}>What we&apos;re building</p>
            <h2 className={`${sectionTitle} mt-2 max-w-2xl`}>
              One place for opportunities, people, and companies.
            </h2>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <FoundingCard
                icon={<FaCompass className="text-xs" />}
                title="Opportunities"
                description="Discover internships, jobs, freelance work, and early-career roles — posted and managed directly on Forsa."
              />
              <FoundingCard
                icon={<FaUsers className="text-xs" />}
                title="Talent"
                description="Profiles built around skills and real work, so people can be seen for what they can actually do."
              />
              <FoundingCard
                icon={<FaBuilding className="text-xs" />}
                title="Companies"
                description="A direct way for Lebanese companies and startups to share opportunities and meet emerging talent."
              />
              <FoundingCard
                icon={<FaGlobe className="text-xs" />}
                title="Community"
                description="A growing community around careers — and, over time, connections through events and the wider Lebanese professional ecosystem."
              />
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1100px] items-start gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className={typeTag}>Meet the founder</p>
              <h2 className={`${sectionTitle} mt-2`}>
                Building Forsa from the ground up.
              </h2>
              <p className={`${bodyText} mt-4`}>
                Adam Yakoub Abdallah is the founder of Forsa. He started
                building it because he enjoys creating products and wanted to
                build something of his own.
              </p>
              <p className={`${bodyText} mt-4`}>
                The idea grew into a bigger goal: helping Lebanese students and
                early-career people find internships and career opportunities,
                while helping Lebanese companies discover talented people. He
                is working to turn Forsa into a real Lebanese career community
                around opportunities, people, companies, founders, and events.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e7e6ec] bg-[#fbfbfd] p-6 sm:p-7">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#5B3DF5] font-['Sora',sans-serif] text-sm font-semibold text-white">
                  AA
                </span>
                <div>
                  <p className="font-['Sora',sans-serif] text-base font-semibold">
                    Adam Yakoub Abdallah
                  </p>
                  <p className="mt-0.5 text-sm text-[#696773]">
                    Founder of Forsa
                  </p>
                </div>
              </div>

              <p className="mt-5 border-t border-[#ececf1] pt-5 text-sm leading-7 text-[#55555e]">
                A Lebanese founder building Forsa for Lebanese talent and
                companies — with a long-term goal of a genuine career community
                around opportunities, people, companies, founders, and events.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-[#ececf1] bg-[#f6f4ff] py-16 sm:py-20">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-6 lg:px-8">
            <p className={typeTag}>Vision</p>
            <h2 className={`${sectionTitle} mt-2 max-w-2xl`}>
              More than a place to find jobs.
            </h2>
            <p className={`${bodyText} mt-5 max-w-3xl`}>
              Forsa is being built as a Lebanese community around career
              growth — where talent can discover opportunities, companies can
              meet emerging talent, and people can connect through careers,
              events, and the wider Lebanese startup and professional
              ecosystem.
            </p>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-6 lg:px-8">
            <p className={typeTag}>Official links</p>
            <h2 className={`${sectionTitle} mt-2`}>Find Forsa online</h2>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <ExternalLink
                href="https://forsa.digital"
                label="Website"
                value="forsa.digital"
                icon={<FaGlobe className="text-sm" />}
              />
              <ExternalLink
                href="https://www.instagram.com/heyforsa/"
                label="Instagram"
                value="@heyforsa"
                icon={<FaInstagram className="text-sm" />}
              />
              <ExternalLink
                href="https://www.linkedin.com/company/forsa-digital/"
                label="LinkedIn"
                value="Forsa / forsa-digital"
                icon={<FaLinkedin className="text-sm" />}
              />
            </div>

            <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-primary)] text-white">
                  <FaEnvelope className="text-sm" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Contact</p>
                  <p className="mt-0.5 text-sm text-neutral-600">
                    support.forsa@gmail.com
                  </p>
                </div>
              </div>
              <p className="text-xs leading-5 text-neutral-500 sm:max-w-xs sm:text-right">
                For feedback, questions, or help getting started. We answer
                directly.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-[#ececf1] bg-[#fbfbfd] py-16 sm:py-20">
          <div className="mx-auto max-w-[1100px] px-5 text-center sm:px-6 lg:px-8">
            <h2 className="font-['Sora',sans-serif] text-3xl font-bold tracking-[-.04em] sm:text-4xl">
              Join what we&apos;re building.
            </h2>

            <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
              <Link
                to="/explore"
                className="group rounded-2xl border border-[#dedde5] bg-white p-6 text-left shadow-[0_8px_30px_rgba(20,16,50,.04)] transition hover:-translate-y-0.5 hover:border-[#5B3DF5]/30"
              >
                <p className="font-['Sora',sans-serif] text-base font-semibold">
                  For talent
                </p>
                <p className="mt-2 text-sm leading-6 text-[#696773]">
                  Discover opportunities and start your career in Lebanon.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5B3DF5]">
                  Explore opportunities
                  <FaArrowRight className="text-[10px] transition group-hover:translate-x-1" />
                </span>
              </Link>

              <Link
                to="/auth?mode=signup"
                className="group rounded-2xl border border-[#dedde5] bg-white p-6 text-left shadow-[0_8px_30px_rgba(20,16,50,.04)] transition hover:-translate-y-0.5 hover:border-[#5B3DF5]/30"
              >
                <p className="font-['Sora',sans-serif] text-base font-semibold">
                  For companies
                </p>
                <p className="mt-2 text-sm leading-6 text-[#696773]">
                  Post opportunities and meet talented early-career people.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5B3DF5]">
                  Create a company profile
                  <FaArrowRight className="text-[10px] transition group-hover:translate-x-1" />
                </span>
              </Link>
            </div>

            <p className="mt-12 text-xs font-medium uppercase tracking-[.14em] text-[#9998a2]">
              Built in Lebanon. For Lebanese talent and companies. Growing into
              a community.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FoundingCard({ icon, title, description }) {
  return (
    <div className="rounded-2xl border border-[#e4e3e9] bg-white p-5 shadow-[0_8px_30px_rgba(20,16,50,.035)]">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1efff] text-[#5B3DF5]">
        {icon}
      </span>
      <h3 className="mt-4 font-['Sora',sans-serif] text-base font-semibold">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#696773]">{description}</p>
    </div>
  );
}

function ExternalLink({ href, label, value, icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-2xl border border-[#e4e3e9] bg-white p-5 shadow-[0_8px_30px_rgba(20,16,50,.035)] transition hover:-translate-y-0.5 hover:border-[#5B3DF5]/30"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1efff] text-[#5B3DF5]">
        {icon}
      </span>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-[#777681]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold group-hover:text-[#5B3DF5]">
        {value}
      </p>
    </a>
  );
}