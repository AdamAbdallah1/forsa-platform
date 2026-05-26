import { motion } from "framer-motion";
import {
  FaBriefcase,
  FaCheckCircle,
  FaComments,
  FaPaperPlane,
  FaSearch,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";

const steps = [
  {
    icon: FaSearch,
    label: "Discover",
    text: "Browse local jobs, gigs, internships, and projects.",
  },
  {
    icon: FaUser,
    label: "Profile",
    text: "Show skills, city, goals, and your CV link.",
  },
  {
    icon: FaPaperPlane,
    label: "Apply",
    text: "Send a clear application with one focused message.",
  },
  {
    icon: FaComments,
    label: "Messages",
    text: "Keep replies, status updates, and follow-ups organized.",
  },
  {
    icon: FaShieldAlt,
    label: "Trust",
    text: "Verified companies, reports, and admin review.",
  },
];

export default function WorkFlowOrbit() {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-[var(--forsa-border)] bg-white shadow-[0_24px_80px_rgba(109,40,217,0.08)]">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative overflow-hidden border-b border-[var(--forsa-border)] p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[var(--forsa-glow)]/15 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg-soft)] px-3 py-2 text-xs font-medium text-[var(--forsa-primary)]">
                <FaBriefcase className="text-xs" />
                Product flow
              </div>

              <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-4xl md:text-5xl">
                A cleaner path from opportunity to hire.
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
                Forsa replaces scattered WhatsApp groups and disappearing posts
                with one organized workflow for seekers and companies.
              </p>

              <div className="mt-7 grid gap-3">
                <MiniCard title="For seekers" text="Save jobs, apply faster, and track every reply." />
                <MiniCard title="For companies" text="Post opportunities, review applicants, and manage status." />
              </div>
            </div>
          </div>

          <div className="relative min-h-[620px] overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f5f3ff_100%)] p-4 sm:min-h-[560px] sm:p-6 lg:min-h-[520px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.18),transparent_58%)]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--forsa-soft)]/70" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--forsa-soft)]/70" />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
              className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--forsa-glow)]/25"
            />

            <div className="absolute left-1/2 top-1/2 z-20 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[34px] bg-[linear-gradient(135deg,var(--forsa-primary),var(--forsa-glow))] text-white shadow-[0_30px_75px_rgba(109,40,217,0.32)]">
              <FaBriefcase className="text-lg" />
              <p className="mt-2 text-sm font-semibold">Forsa</p>
              <p className="mt-1 text-[10px] text-white/70">work organized</p>
            </div>

            <div className="relative z-10 h-full">
              {steps.map((step, index) => (
                <FlowNode key={step.label} step={step} index={index} />
              ))}
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-20 rounded-[24px] border border-[var(--forsa-border)] bg-white/85 p-4 shadow-sm backdrop-blur-xl sm:left-6 sm:right-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
                  <FaCheckCircle />
                </div>

                <div>
                  <p className="text-sm font-semibold">One profile. One inbox. One workflow.</p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Every application becomes a structured conversation instead of a lost chat message.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowNode({ step, index }) {
  const Icon = step.icon;

  const positions = [
    "left-[8%] top-[7%] sm:left-[10%] sm:top-[10%]",
    "right-[6%] top-[13%] sm:right-[10%] sm:top-[12%]",
    "left-[5%] top-[41%] sm:left-[8%] sm:top-[43%]",
    "right-[4%] top-[45%] sm:right-[8%] sm:top-[44%]",
    "left-1/2 top-[76%] -translate-x-1/2 sm:top-[75%]",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: "easeOut" }}
      viewport={{ once: true, margin: "-80px" }}
      className={`absolute w-[152px] rounded-[22px] border border-white/80 bg-white/90 p-3.5 shadow-[0_18px_45px_rgba(109,40,217,0.10)] backdrop-blur-xl sm:w-[170px] sm:p-4 ${positions[index]}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
          <Icon className="text-xs" />
        </div>

        <p className="text-sm font-semibold tracking-[-0.02em]">{step.label}</p>
      </div>

      <p className="mt-2 text-xs leading-5 text-neutral-500">{step.text}</p>
    </motion.div>
  );
}

function MiniCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-[var(--forsa-border)] bg-white/80 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-neutral-600">{text}</p>
    </div>
  );
}