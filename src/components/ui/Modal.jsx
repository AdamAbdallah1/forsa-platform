import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function Modal({ open, title, children, onClose, maxWidth = "max-w-md" }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

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
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forsa-modal-title"
            tabIndex={-1}
            className={`relative max-h-[min(90vh,760px)] w-full overflow-auto rounded-[24px] border border-[var(--forsa-border)] bg-white p-5 shadow-[0_30px_90px_rgba(109,40,217,0.18)] outline-none sm:rounded-[28px] sm:p-6 ${maxWidth}`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 id="forsa-modal-title" className="text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                {title}
              </h2>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-bg)] text-sm text-neutral-600 transition hover:bg-[var(--forsa-bg-soft)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
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