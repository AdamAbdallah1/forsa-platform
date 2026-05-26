import { motion } from "framer-motion";
import {
  FaBriefcase,
  FaComments,
  FaPaperPlane,
  FaShieldAlt,
} from "react-icons/fa";

const items = [
  { icon: FaBriefcase, label: "Post" },
  { icon: FaPaperPlane, label: "Apply" },
  { icon: FaComments, label: "Message" },
  { icon: FaShieldAlt, label: "Verify" },
];

export default function HeroFlowDivider() {
  return (
    <section className="relative -mt-8 px-4 sm:px-6 lg:-mt-12">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[30px] border border-[var(--forsa-border)] bg-white/85 p-3 shadow-[0_18px_60px_rgba(109,40,217,0.10)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.16),transparent_55%)]" />

          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="relative flex w-max gap-3"
          >
            {[...items, ...items, ...items, ...items].map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={`${item.label}-${index}`}
                  className="flex min-w-[150px] items-center gap-3 rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
                    <Icon className="text-xs" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-[11px] text-neutral-500">
                      Forsa workflow
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}