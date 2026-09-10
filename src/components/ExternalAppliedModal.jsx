import { useNavigate } from "react-router-dom";
import Modal from "./ui/Modal";
import { FaCheckCircle } from "react-icons/fa";

export default function ExternalAppliedModal({ open, onClose }) {
  const navigate = useNavigate();

  const goToApplications = () => {
    onClose();
    navigate("/applications");
  };

  return (
    <Modal
      open={open}
      title="Application tracked"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
        <FaCheckCircle className="text-[15px]" />
      </div>

      <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
        We&apos;ve saved this application to your Forsa applications. You can
        come back anytime to track its status.
      </p>

      <p className="mt-4 rounded-2xl bg-[var(--forsa-bg)] p-4 text-sm leading-6 text-neutral-600">
        Forsa doesn&apos;t receive updates from the company, so you can
        manually update your application status here.
      </p>

      <div className="mt-6 grid gap-2">
        <button
          type="button"
          onClick={goToApplications}
          className="rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(109,40,217,0.18)] transition hover:bg-[var(--forsa-primary-dark)]"
        >
          View my applications
        </button>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}