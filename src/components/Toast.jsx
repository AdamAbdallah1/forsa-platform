import { useEffect, useState } from "react";
import { toastSubscribe } from "../lib/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaInfo, FaExclamation, FaTimes } from "react-icons/fa";

const toastMeta = {
  success: {
    icon: FaCheck,
    title: "Success",
    className: "bg-[var(--forsa-primary)] text-white",
    ring: "ring-[var(--forsa-glow)]/20",
  },
  info: {
    icon: FaInfo,
    title: "Info",
    className: "bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]",
    ring: "ring-[var(--forsa-glow)]/20",
  },
  error: {
    icon: FaExclamation,
    title: "Error",
    className: "bg-red-50 text-red-600",
    ring: "ring-red-100",
  },
};

export default function Toast() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    return toastSubscribe((toast) => {
      const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const type = toast.type || "success";

      setItems((prev) => [...prev, { ...toast, type, id }]);

      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, toast.duration || 3200);
    });
  }, []);

  const closeToast = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex justify-center px-4 sm:top-5">
      <div className="flex w-full max-w-[420px] flex-col gap-3">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const meta = toastMeta[item.type] || toastMeta.success;
            const Icon = meta.icon;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -18, scale: 0.96, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, scale: 0.96, filter: "blur(6px)" }}
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
                className={`pointer-events-auto overflow-hidden rounded-[22px] border border-white/70 bg-white/90 shadow-[0_22px_70px_rgba(17,17,17,0.14)] ring-1 backdrop-blur-2xl ${meta.ring}`}
              >
                <div className="relative">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--forsa-glow)]/60 to-transparent" />

                  <div className="flex items-start gap-3 p-3.5 sm:p-4">
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ${meta.className}`}
                    >
                      <Icon className="text-xs" />
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                        {item.title || meta.title}
                      </p>

                      <p className="mt-1 text-sm font-medium leading-5 text-neutral-900">
                        {item.message}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => closeToast(item.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-[var(--forsa-bg)] hover:text-neutral-700"
                      aria-label="Close notification"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>

                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: (item.duration || 3200) / 1000, ease: "linear" }}
                    className="h-0.5 bg-gradient-to-r from-[var(--forsa-primary)] to-[var(--forsa-glow)]"
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}