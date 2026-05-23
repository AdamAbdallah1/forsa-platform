import { useEffect, useState } from "react";
import { toastSubscribe } from "../lib/Toast"
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaInfo, FaExclamation } from "react-icons/fa";

export default function Toast() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    return toastSubscribe((toast) => {
      const id = Date.now();

      setItems((prev) => [...prev, { ...toast, id }]);

      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 3000);
    });
  }, []);

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[9999] flex w-[340px] max-w-[calc(100vw-32px)] -translate-x-1/2 flex-col gap-3">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl backdrop-blur-xl"
          >
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                item.type === "error"
                  ? "bg-red-100 text-red-600"
                  : item.type === "info"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-black text-white"
              }`}
            >
              {item.type === "error" ? (
                <FaExclamation className="text-xs" />
              ) : item.type === "info" ? (
                <FaInfo className="text-xs" />
              ) : (
                <FaCheck className="text-xs" />
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-black">
                {item.message}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}