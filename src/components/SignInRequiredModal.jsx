import Modal from "./ui/Modal";
import { FaLock } from "react-icons/fa";

export default function SignInRequiredModal({
  open,
  onSignIn,
  onCreateAccount,
  onClose,
}) {
  return (
    <Modal open={open} title="Sign in to apply" onClose={onClose} maxWidth="max-w-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
        <FaLock />
      </div>

      <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
        You need a Forsa account to apply for opportunities. Sign in or create
        your free account to continue.
      </p>

      <div className="mt-6 grid gap-2">
        <button
          type="button"
          onClick={onSignIn}
          className="rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(109,40,217,0.18)] transition hover:bg-[var(--forsa-primary-dark)]"
        >
          Sign in
        </button>

        <button
          type="button"
          onClick={onCreateAccount}
          className="rounded-full border border-[var(--forsa-primary)] bg-white px-5 py-3 text-sm font-semibold text-[var(--forsa-primary)] transition hover:bg-[var(--forsa-bg-soft)]"
        >
          Create a free account
        </button>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}