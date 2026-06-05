import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import AppHeader from "../components/AppHeader";
import SEO from "../components/SEO";
import {
  FaArrowLeft,
  FaBriefcase,
  FaEnvelope,
  FaFileAlt,
  FaGraduationCap,
  FaLink,
  FaMapMarkerAlt,
  FaUser,
} from "react-icons/fa";

function cleanList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function PublicSeekerProfile() {
  const { uid } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) setUser({ uid: snap.id, ...snap.data() });
      } catch (error) {
        console.error("Public seeker load error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [uid]);

  if (loading) {
    return (
      <section className="min-h-screen bg-[var(--forsa-bg)]">
        <AppHeader />
        <div className="mx-auto max-w-5xl px-5 py-20 text-sm text-neutral-500">Loading public profile...</div>
      </section>
    );
  }

  if (!user || user.accountType === "hiring") {
    return (
      <section className="min-h-screen bg-[var(--forsa-bg)]">
        <AppHeader />
        <div className="mx-auto max-w-3xl px-5 py-20">
          <div className="rounded-[28px] border border-[var(--forsa-border)] bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold tracking-[-0.04em]">Profile not found</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600">This seeker profile is unavailable or private.</p>
            <Link to="/applicants" className="mt-6 inline-flex rounded-full forsa-button px-5 py-3 text-sm font-semibold text-white">Back to applicants</Link>
          </div>
        </div>
      </section>
    );
  }

  const skills = cleanList(user.skills || user.publicSkills);
  const lookingFor = cleanList(user.lookingFor || user.publicLookingFor);
  const experience = cleanList(user.experience);
  const education = cleanList(user.education);
  const portfolioLinks = cleanList(user.portfolioLinks || user.portfolio);
  const cv = user.cv || user.publicCv || null;

  const completionItems = [
    Boolean(user.name),
    Boolean(user.city),
    skills.length > 0,
    lookingFor.length > 0,
    Boolean(user.bio || user.about),
    experience.length > 0,
    education.length > 0,
    Boolean(cv?.url || cv?.name),
  ];

  const completion = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <SEO title={`${user.name || "Seeker"} Profile`} />
      <AppHeader />

      <div className="mx-auto max-w-5xl px-5 pb-28 pt-8 sm:px-6">
        <Link to="/applicants" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-[var(--forsa-primary)]">
          <FaArrowLeft className="text-xs" /> Back to applicants
        </Link>

        <div className="relative mt-6 overflow-hidden rounded-[34px] border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(109,40,217,0.10)] sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--forsa-glow)]/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,var(--forsa-primary),var(--forsa-glow))] text-2xl font-bold text-white shadow-[0_18px_40px_rgba(109,40,217,0.22)]">
                {(user.name || "S").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{user.name || "Seeker"}</h1>
                  <span className="rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--forsa-primary)]">Public seeker profile</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-neutral-600">
                  <p className="flex items-center gap-2"><FaMapMarkerAlt className="text-xs text-[var(--forsa-primary)]" />{user.city || "Lebanon"}</p>
                  <p className="flex items-center gap-2 break-all"><FaEnvelope className="text-xs text-[var(--forsa-primary)]" />{user.email || "No email"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4 sm:w-[270px]">
              <p className="text-sm font-semibold">Recruiter snapshot</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--forsa-primary)]">{completion}%</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">profile strength</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--forsa-primary),var(--forsa-glow))]" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>

          <div className="relative mt-7 grid gap-3 sm:grid-cols-4">
            <Stat label="Skills" value={skills.length} />
            <Stat label="Goals" value={lookingFor.length} />
            <Stat label="Experience" value={experience.length || "—"} />
            <Stat label="CV" value={cv?.url || cv?.name ? "Ready" : "Missing"} />
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <Card><SectionTitle icon={<FaUser />} title="Candidate summary" /><p className="mt-4 text-sm leading-7 text-neutral-600">{user.bio || user.about || "This seeker has not added a public summary yet."}</p></Card>
          <Card><SectionTitle icon={<FaFileAlt />} title="CV / Resume" />{cv?.url ? <a href={cv.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full forsa-button px-5 py-3 text-sm font-semibold text-white">Open CV</a> : cv?.name ? <p className="mt-4 rounded-2xl bg-[var(--forsa-bg)] p-4 text-sm text-neutral-600">{cv.name}</p> : <p className="mt-4 text-sm text-neutral-500">No CV link added.</p>}</Card>
          <InfoCard title="Skills" items={skills} empty="No skills added yet." />
          <InfoCard title="Looking for" items={lookingFor} empty="No work preferences added yet." />
          <TimelineCard icon={<FaBriefcase />} title="Experience" items={experience} empty="No experience added yet." />
          <TimelineCard icon={<FaGraduationCap />} title="Education" items={education} empty="No education added yet." />
          <Card className="lg:col-span-2"><SectionTitle icon={<FaLink />} title="Portfolio links" />{portfolioLinks.length ? <div className="mt-4 grid gap-2">{portfolioLinks.map((link) => <a key={link} href={link.startsWith("http") ? link : `https://${link}`} target="_blank" rel="noreferrer" className="rounded-2xl border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-4 py-3 text-sm font-medium text-[var(--forsa-primary)]">{link}</a>)}</div> : <p className="mt-4 text-sm text-neutral-500">No portfolio links added yet.</p>}</Card>
        </div>
      </div>
    </section>
  );
}

function Card({ children, className = "" }) { return <div className={`rounded-[28px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm ${className}`}>{children}</div>; }
function Stat({ label, value }) { return <div className="rounded-[22px] border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4"><p className="text-xl font-semibold tracking-[-0.03em]">{value}</p><p className="mt-1 text-xs font-medium text-neutral-500">{label}</p></div>; }
function SectionTitle({ icon, title }) { return <div className="flex items-center gap-2"><span className="text-[var(--forsa-primary)]">{icon}</span><p className="font-semibold">{title}</p></div>; }
function InfoCard({ title, items, empty }) { return <Card><p className="font-semibold">{title}</p><div className="mt-4 flex flex-wrap gap-2">{items.length ? items.map((item) => <span key={item} className="rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--forsa-primary)]">{item}</span>) : <p className="text-sm text-neutral-500">{empty}</p>}</div></Card>; }
function TimelineCard({ icon, title, items, empty }) { return <Card><SectionTitle icon={icon} title={title} /><div className="mt-4 grid gap-3">{items.length ? items.map((item) => <div key={item} className="rounded-2xl border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4 text-sm leading-6 text-neutral-700">{item}</div>) : <p className="text-sm text-neutral-500">{empty}</p>}</div></Card>; }
