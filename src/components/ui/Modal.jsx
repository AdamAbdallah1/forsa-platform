import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function Modal({ open, title, children, onClose, maxWidth = "max-w-md" }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999] flex items-end justify-center px-4 pb-4 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--forsa-primary)]/25 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`relative max-h-[90vh] w-full overflow-auto rounded-[30px] border border-white/70 bg-white p-5 shadow-[0_30px_90px_rgba(109,40,217,0.18)] sm:p-6 ${maxWidth}`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                {title}
              </h2>

              <button
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-bg)] text-sm text-neutral-600 transition hover:text-black"
              >
                <FaTimes />
              </button>
            </div>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}