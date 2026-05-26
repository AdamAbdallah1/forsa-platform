import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../lib/Toast";
import { createPost } from "../lib/postService";
import {
  FaBriefcase,
  FaCheck,
  FaChevronDown,
  FaMapMarkerAlt,
  FaSearch,
  FaStar,
  FaTag,
  FaTimes,
  FaBolt,
  FaClock,
  FaUndo,
  FaTrash,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";

const typeOptions = [
  "Internship",
  "Freelance",
  "Part-time",
  "Full-time",
  "Project",
  "Remote",
  "Hybrid",
  "Volunteer",
  "Collaboration",
];

const tagOptions = [
  "React",
  "JavaScript",
  "Frontend",
  "Backend",
  "Node.js",
  "Laravel",
  "WordPress",
  "Shopify",
  "Web design",
  "UI/UX",
  "Graphic design",
  "Canva",
  "Branding",
  "Logo design",
  "Marketing",
  "Social media",
  "Content creation",
  "Copywriting",
  "Video editing",
  "Photography",
  "Reels",
  "TikTok",
  "Instagram",
  "Sales",
  "Customer service",
  "Waiter",
  "Cashier",
  "Barista",
  "Delivery",
  "Events",
  "Admin",
  "Data entry",
  "Accounting",
  "Teaching",
  "English",
  "Arabic",
  "Math",
];

const templates = [
  {
    label: "Barista",
    data: {
      title: "Part-time Barista",
      type: "Part-time",
      pay: "$250/month + tips",
      tags: ["Barista", "Customer service", "Sales"],
      description:
        "Looking for a friendly part-time barista for weekend shifts. Experience is helpful, but being punctual, clean, and comfortable with customers matters most.",
    },
  },
  {
    label: "React Internship",
    data: {
      title: "Junior React Developer Internship",
      type: "Internship",
      pay: "Paid internship",
      tags: ["React", "JavaScript", "Frontend", "UI/UX"],
      description:
        "Looking for a motivated junior React developer to help build landing pages and dashboards. Good fit for students who know React, Tailwind, and basic UI structure.",
    },
  },
  {
    label: "Social Media",
    data: {
      title: "Social Media Content Creator",
      type: "Freelance",
      pay: "$120/project",
      tags: ["Marketing", "Instagram", "Content creation", "Video editing"],
      description:
        "Need someone to create Instagram content, captions, and simple reels for a local brand. Portfolio or previous examples are preferred.",
    },
  },
  {
    label: "Graphic Designer",
    data: {
      title: "Graphic Designer",
      type: "Project",
      pay: "Per project",
      tags: ["Graphic design", "Branding", "Canva"],
      description:
        "Looking for a designer to create social posts, branding assets, and clean marketing visuals for a local business campaign.",
    },
  },
  {
    label: "Event Staff",
    data: {
      title: "Event assistants needed",
      type: "Project",
      pay: "$25/day",
      tags: ["Events", "Customer service", "Part-time"],
      description:
        "Need energetic event assistants for guest check-in, setup, and coordination. Must be available on event day and comfortable working with people.",
    },
  },
];

const emptyForm = (account) => ({
  title: "",
  questions: [""],
  company: account?.name || "",
  location: account?.city || "",
  type: "Freelance",
  pay: "",
  description: "",
  contact: account?.email || "",
  tags: [],
  urgent: false,
  featured: false,
});

function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function formatTime(iso) {
  if (!iso) return "Not saved yet";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not saved yet";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PostOpportunity() {
  const navigate = useNavigate();
  const account = safeJson("forsaAccount", null);
  const draftKey = `forsaOpportunityDraft:${account?.email || "guest"}`;

  const typeRef = useRef(null);
  const tagsRef = useRef(null);
  const hasMounted = useRef(false);

  const [typeOpen, setTypeOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [showRestoreDraft, setShowRestoreDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [draftIgnored, setDraftIgnored] = useState(false);
  const [posting, setPosting] = useState(false);

  const [form, setForm] = useState(() => emptyForm(account));

  useEffect(() => {
    const draft = safeJson(draftKey, null);

    if (
      draft &&
      (draft.title ||
        draft.pay ||
        draft.description ||
        draft.tags?.length ||
        draft.location ||
        draft.company)
    ) {
      setShowRestoreDraft(true);
      setDraftSavedAt(draft.savedAt || null);
    }
  }, [draftKey]);

  useEffect(() => {
    const closeDropdowns = (event) => {
      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setTypeOpen(false);
      }

      if (tagsRef.current && !tagsRef.current.contains(event.target)) {
        setTagsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeDropdowns);
    return () => document.removeEventListener("mousedown", closeDropdowns);
  }, []);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (draftIgnored) return;

    const hasContent =
      form.title.trim() ||
      form.pay.trim() ||
      form.description.trim() ||
      form.tags.length > 0;

    if (!hasContent) return;

    const timeout = setTimeout(() => {
      const savedAt = new Date().toISOString();

      localStorage.setItem(
        draftKey,
        JSON.stringify({
          ...form,
          questions: form.questions.filter((question) => question.trim()),
          savedAt,
        })
      );

      setDraftSavedAt(savedAt);
    }, 700);

    return () => clearTimeout(timeout);
  }, [form, draftKey, draftIgnored]);

  const filteredTags = tagOptions.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.trim().toLowerCase())
  );

  const qualityScore = useMemo(() => {
    let score = 0;
    if (form.title.trim().length >= 8) score += 20;
    if (form.company.trim()) score += 10;
    if (form.location.trim()) score += 10;
    if (form.pay.trim()) score += 15;
    if (form.contact.trim()) score += 15;
    if (form.tags.length >= 2) score += 15;
    if (form.description.trim().length >= 60) score += 15;
    return score;
  }, [form]);

  const canPost =
    form.title.trim() &&
    form.company.trim() &&
    form.location.trim() &&
    form.pay.trim() &&
    form.description.trim() &&
    form.contact.trim() &&
    form.tags.length > 0;

  const updateForm = (field, value) => {
    setDraftIgnored(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag) => {
    setDraftIgnored(false);

    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((item) => item !== tag)
        : [...prev.tags, tag],
    }));
  };

  const updateQuestion = (index, value) => {
    setDraftIgnored(false);

    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, i) =>
        i === index ? value : question
      ),
    }));
  };

  const addQuestion = () => {
    if (form.questions.length >= 5) return;

    setDraftIgnored(false);

    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, ""],
    }));
  };

  const removeQuestion = (index) => {
    setDraftIgnored(false);

    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const applyTemplate = (template) => {
    setDraftIgnored(false);

    setForm((prev) => ({
      ...prev,
      ...template.data,
      questions: prev.questions?.length ? prev.questions : [""],
      tags: Array.from(new Set([...(prev.tags || []), ...template.data.tags])),
    }));

    showToast(`${template.label} template applied`, "info");
  };

  const restoreDraft = () => {
    const draft = safeJson(draftKey, null);

    if (!draft) {
      setShowRestoreDraft(false);
      return;
    }

    const { savedAt, ...cleanDraft } = draft;
    setForm({
      ...emptyForm(account),
      ...cleanDraft,
      tags: cleanDraft.tags || [],
      questions: cleanDraft.questions?.length ? cleanDraft.questions : [""],
    });
    setDraftSavedAt(savedAt || new Date().toISOString());
    setShowRestoreDraft(false);
    setDraftIgnored(false);
    showToast("Draft restored");
  };

  const dismissDraft = () => {
    localStorage.removeItem(draftKey);
    setShowRestoreDraft(false);
    setDraftSavedAt(null);
    setDraftIgnored(true);
    showToast("Draft dismissed", "info");
  };

  const clearCurrentDraft = () => {
    const confirmed = window.confirm("Clear this draft?");
    if (!confirmed) return;

    localStorage.removeItem(draftKey);
    setForm(emptyForm(account));
    setDraftSavedAt(null);
    setShowRestoreDraft(false);
    setDraftIgnored(true);
    showToast("Draft cleared");
  };

  const handleSubmit = async () => {
    if (!canPost || posting) return;

    setPosting(true);

    try {
      const cleanQuestions = form.questions.filter((question) =>
        question.trim()
      );

      const newPost = {
        ownerUid: account?.uid || null,
        ownerEmail: account?.email || form.contact,
        ownerName: account?.name || form.company,
        company: form.company.trim(),
        location: form.location.trim(),
        title: form.title.trim(),
        type: form.type,
        pay: form.pay.trim(),
        description: form.description.trim(),
        contact: form.contact.trim(),
        tags: form.tags || [],
        urgent: Boolean(form.urgent),
        featured: false,
        trusted: Boolean(account?.trusted),
        verified: Boolean(account?.verified),
        questions: cleanQuestions,
        reports: 0,
        views: 0,
        applications: 0,
        qualityScore,
      };

      const createdPost = await createPost(newPost);

      const saved = safeJson("forsaPosts", []);
      localStorage.setItem("forsaPosts", JSON.stringify([createdPost, ...saved]));

      localStorage.removeItem(draftKey);
      setDraftSavedAt(null);

      showToast("Opportunity posted");
      navigate("/explore");
    } catch (error) {
      console.error("Create post error:", error);
      showToast("Could not post opportunity. Try again.", "error");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-[1180px] px-4 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-5 grid gap-5 sm:mt-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-6">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-[26px] border border-[var(--forsa-border)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <p className="text-sm font-medium text-neutral-500">Post</p>

              <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-[1] tracking-[-0.045em] sm:text-4xl">
                Create a clear opportunity.
              </h1>

              <p className="mt-4 text-sm leading-7 text-neutral-600">
                Help applicants understand the role, pay, location, required
                skills, and how to reach you.
              </p>
            </div>

            <QualityCard qualityScore={qualityScore} />

            <DraftStatusCard
              draftSavedAt={draftSavedAt}
              onClearDraft={clearCurrentDraft}
            />

            <TemplatesCard onApply={applyTemplate} />

            <div className="hidden lg:block">
              <PreviewCard form={form} qualityScore={qualityScore} />
            </div>
          </aside>

          <div className="rounded-[26px] border border-[var(--forsa-border)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-5">
            {showRestoreDraft && (
              <RestoreDraftBanner
                draftSavedAt={draftSavedAt}
                onRestore={restoreDraft}
                onDismiss={dismissDraft}
              />
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Opportunity title"
                placeholder="Junior React Developer"
                value={form.title}
                onChange={(value) => updateForm("title", value)}
              />

              <Field
                label="Company / poster"
                placeholder="Small startup"
                value={form.company}
                onChange={(value) => updateForm("company", value)}
              />

              <Field
                label="Location"
                placeholder="Beirut, Tripoli, Remote..."
                value={form.location}
                onChange={(value) => updateForm("location", value)}
              />

              <Field
                label="Pay"
                placeholder="Paid / $100 / per project"
                value={form.pay}
                onChange={(value) => updateForm("pay", value)}
              />
            </div>

            <Dropdown
              refEl={typeRef}
              label="Type"
              value={form.type}
              open={typeOpen}
              setOpen={setTypeOpen}
            >
              {typeOptions.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    updateForm("type", type);
                    setTypeOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[#f7f7f5]"
                >
                  {type}
                  {form.type === type && <FaCheck className="text-xs" />}
                </button>
              ))}
            </Dropdown>

            <div ref={tagsRef} className="mt-5">
              <label className="text-sm font-medium">Skills / tags</label>

              <div className="relative mt-2">
                <button
                  type="button"
                  onClick={() => setTagsOpen(!tagsOpen)}
                  className="flex w-full items-center justify-between rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-neutral-400"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FaTag className="shrink-0 text-xs text-neutral-400" />
                    <span className="truncate">
                      {form.tags.length > 0
                        ? `${form.tags.length} tag${form.tags.length === 1 ? "" : "s"} selected`
                        : "Choose skills / job tags"}
                    </span>
                  </span>

                  <FaChevronDown className="shrink-0 text-xs text-neutral-400" />
                </button>

                {tagsOpen && (
                  <div className="absolute z-30 mt-2 w-full rounded-2xl border border-[var(--forsa-border)] bg-white p-3 shadow-xl">
                    <div className="flex items-center gap-2 rounded-xl border border-[var(--forsa-border)] px-3 py-2">
                      <FaSearch className="text-xs text-neutral-400" />
                      <input
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        placeholder="Search tags..."
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>

                    <div className="mt-3 max-h-64 overflow-auto pr-1">
                      {filteredTags.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-neutral-500">
                          No tags found.
                        </p>
                      ) : (
                        filteredTags.map((tag) => (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[#f7f7f5]"
                          >
                            {tag}
                            {form.tags.includes(tag) && (
                              <FaCheck className="text-xs" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {form.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--forsa-green)] px-3 py-1.5 text-xs text-white"
                    >
                      {tag}
                      <FaTimes className="text-[10px]" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium">Description</label>

              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Explain the role, requirements, schedule, and who this opportunity fits."
                className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-500">
                {form.description.trim().length}/60 recommended characters.
              </p>
            </div>

            <Field
              label="Contact method"
              placeholder="WhatsApp, Instagram, email..."
              value={form.contact}
              onChange={(value) => updateForm("contact", value)}
            />
<div className="mt-5 rounded-[24px] border border-[var(--forsa-border)] bg-[#fafaf8] p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-sm font-medium">
        Application questions
      </p>

      <p className="mt-1 text-sm text-neutral-500">
        Ask applicants extra questions before applying.
      </p>
    </div>

    <button
      type="button"
      onClick={addQuestion}
      className="rounded-full bg-[var(--forsa-green)] px-4 py-2 text-xs font-medium text-white"
    >
      Add question
    </button>
  </div>

  <div className="mt-4 grid gap-3">
    {form.questions.map((question, index) => (
      <div
        key={index}
        className="flex items-center gap-2"
      >
        <input
          value={question}
          onChange={(e) =>
            updateQuestion(index, e.target.value)
          }
          placeholder={`Question ${index + 1}`}
          className="w-full rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
        />

        {form.questions.length > 1 && (
          <button
            type="button"
            onClick={() => removeQuestion(index)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-200 text-red-600"
          >
            <FaTrash className="text-xs" />
          </button>
        )}
      </div>
    ))}
  </div>
</div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <ToggleCard
                active={form.urgent}
                icon={<FaBolt />}
                title="Urgent"
                text="Show this post as time-sensitive."
                onClick={() => updateForm("urgent", !form.urgent)}
              />

              <ToggleCard
                active={form.featured}
                icon={<FaStar />}
                title="Featured"
                text="Make this post stand out in Explore."
                onClick={() => updateForm("featured", !form.featured)}
              />
            </div>

            <div className="mt-5 lg:hidden">
              <PreviewCard form={form} qualityScore={qualityScore} />
            </div>

            <div className="sticky bottom-0 -mx-4 mt-7 border-t border-neutral-100 bg-white/95 px-4 py-4 backdrop-blur-xl sm:-mx-5 sm:px-5 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0">
              <button
                disabled={!canPost || posting}
                onClick={handleSubmit}
                className={`w-full rounded-full px-5 py-3 text-sm font-medium transition ${
                  canPost && !posting
                    ? "bg-[var(--forsa-green)] text-white hover:bg-[var(--forsa-green-light)]"
                    : "cursor-not-allowed bg-neutral-200 text-neutral-400"
                }`}
              >
                {posting ? "Posting..." : "Post opportunity"}
              </button>

              {!canPost && (
                <p className="mt-2 text-center text-xs text-neutral-500">
                  Complete all fields and select at least one tag.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RestoreDraftBanner({ draftSavedAt, onRestore, onDismiss }) {
  return (
    <div className="mb-5 rounded-[22px] border border-[var(--forsa-border)] bg-[#f7f7f5] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
            <FaUndo className="text-sm" />
          </div>

          <div>
            <p className="text-sm font-medium">Restore previous draft?</p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              We found an unsaved opportunity draft from {formatTime(draftSavedAt)}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={onRestore}
            className="rounded-full bg-[var(--forsa-green)] px-4 py-2 text-sm font-medium text-white"
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  );
}

function DraftStatusCard({ draftSavedAt, onClearDraft }) {
  return (
    <div className="mt-4 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Draft autosave</p>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            {draftSavedAt
              ? `Last saved ${formatTime(draftSavedAt)}`
              : "Start writing and your draft saves automatically."}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7f7f5] text-neutral-600">
          <FaClock className="text-sm" />
        </div>
      </div>

      {draftSavedAt && (
        <button
          type="button"
          onClick={onClearDraft}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600"
        >
          <FaTrash className="text-xs" />
          Clear draft
        </button>
      )}
    </div>
  );
}

function TemplatesCard({ onApply }) {
  return (
    <div className="mt-4 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <p className="text-sm font-medium">Quick templates</p>
      <p className="mt-1 text-sm leading-6 text-neutral-600">
        Start faster with common local opportunity formats.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {templates.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => onApply(template)}
            className="rounded-full border border-[var(--forsa-border)] bg-white px-3.5 py-2 text-sm transition hover:border-black"
          >
            {template.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QualityCard({ qualityScore }) {
  return (
    <div className="mt-4 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Post quality</p>
        <span className="rounded-full bg-[var(--forsa-green)] px-3 py-1 text-xs font-medium text-white">
          {qualityScore}%
        </span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-[#f7f7f5]">
        <div
          className="h-2 rounded-full bg-[var(--forsa-green)] transition-all"
          style={{ width: `${qualityScore}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2">
        <QualityItem active={qualityScore >= 20} text="Clear title" />
        <QualityItem active={qualityScore >= 40} text="Location and pay added" />
        <QualityItem active={qualityScore >= 60} text="Skills selected" />
        <QualityItem active={qualityScore >= 80} text="Detailed description" />
      </div>
    </div>
  );
}

function QualityItem({ active, text }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${active ? "bg-[var(--forsa-green)]" : "bg-neutral-300"}`} />
      <p className={`text-sm ${active ? "text-black" : "text-neutral-500"}`}>
        {text}
      </p>
    </div>
  );
}

function Dropdown({ refEl, label, value, open, setOpen, children }) {
  return (
    <div ref={refEl} className="mt-5">
      <label className="text-sm font-medium">{label}</label>

      <div className="relative mt-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-neutral-400"
        >
          {value}
          <FaChevronDown className="text-xs text-neutral-400" />
        </button>

        {open && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-[var(--forsa-border)] bg-white p-2 shadow-xl">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange }) {
  return (
    <div className="mt-5 first:mt-0 md:mt-0">
      <label className="text-sm font-medium">{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
      />
    </div>
  );
}

function PreviewCard({ form, qualityScore }) {
  return (
    <div className="mt-4 rounded-[24px] border border-[var(--forsa-border)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-500">Live preview</p>

        <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs text-neutral-600">
          Quality {qualityScore}%
        </span>
      </div>

      <div className="mt-5 flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-green)] text-white">
          <FaBriefcase />
        </div>

        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold">
            {form.title || "Opportunity title"}
          </h3>

          <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
            <FaMapMarkerAlt className="shrink-0 text-[10px]" />
            <span className="truncate">
              {form.company || "Company"} · {form.location || "Location"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <PreviewPill>{form.type}</PreviewPill>
        <PreviewPill>{form.pay || "Pay"}</PreviewPill>
        {form.urgent && <PreviewPill>Urgent</PreviewPill>}
        {form.featured && <PreviewPill>Featured</PreviewPill>}
      </div>

      <p className="mt-5 line-clamp-4 text-sm leading-6 text-neutral-600">
        {form.description ||
          "Your description will appear here. Keep it clear, honest, and specific."}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {form.tags.length > 0 ? (
          form.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--forsa-border)] bg-white px-3 py-1 text-xs"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-sm text-neutral-400">
            Selected tags will appear here.
          </span>
        )}

        {form.tags.length > 6 && (
          <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs text-neutral-500">
            +{form.tags.length - 6}
          </span>
        )}
      </div>
    </div>
  );
}

function PreviewPill({ children }) {
  return (
    <span className="rounded-full bg-[#f7f7f5] px-3 py-1.5 text-xs text-neutral-600">
      {children}
    </span>
  );
}

function ToggleCard({ active, icon, title, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-black bg-[var(--forsa-green)] text-white"
          : "border-[var(--forsa-border)] bg-white hover:border-neutral-400"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          active ? "bg-white text-black" : "bg-[#f7f7f5] text-black"
        }`}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm font-medium">{title}</p>

      <p className={`mt-1 text-sm leading-6 ${active ? "text-neutral-300" : "text-neutral-500"}`}>
        {text}
      </p>
    </button>
  );
}
