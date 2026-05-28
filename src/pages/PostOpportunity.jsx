import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../lib/Toast";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { createPost } from "../lib/postService";
import {
  FaBriefcase,
  FaCheck,
  FaChevronDown,
  FaMapMarkerAlt,
  FaSearch,
  FaTag,
  FaTimes,
  FaBolt,
  FaStar,
  FaClock,
  FaUndo,
  FaTrash,
  FaPlus,
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
  "React", "JavaScript", "Frontend", "Backend", "Node.js", "Laravel",
  "WordPress", "Shopify", "Web design", "UI/UX", "Graphic design", "Canva",
  "Branding", "Logo design", "Marketing", "Social media", "Content creation",
  "Copywriting", "Video editing", "Photography", "Reels", "TikTok", "Instagram",
  "Sales", "Customer service", "Waiter", "Cashier", "Barista", "Delivery",
  "Events", "Admin", "Data entry", "Accounting", "Teaching", "English",
  "Arabic", "Math",
];

const templates = [
  {
    label: "Barista",
    data: {
      title: "Part-time Barista",
      type: "Part-time",
      pay: "$250/month + tips",
      tags: ["Barista", "Customer service", "Sales"],
      description: "Looking for a friendly part-time barista for weekend shifts. Experience is helpful, but being punctual, clean, and comfortable with customers matters most.",
    },
  },
  {
    label: "React Internship",
    data: {
      title: "Junior React Developer Internship",
      type: "Internship",
      pay: "Paid internship",
      tags: ["React", "JavaScript", "Frontend", "UI/UX"],
      description: "Looking for a motivated junior React developer to help build landing pages and dashboards. Good fit for students who know React, Tailwind, and basic UI structure.",
    },
  },
  {
    label: "Social Media",
    data: {
      title: "Social Media Content Creator",
      type: "Freelance",
      pay: "$120/project",
      tags: ["Marketing", "Instagram", "Content creation", "Video editing"],
      description: "Need someone to create Instagram content, captions, and simple reels for a local brand. Portfolio or previous examples are preferred.",
    },
  },
  {
    label: "Graphic Designer",
    data: {
      title: "Graphic Designer",
      type: "Project",
      pay: "Per project",
      tags: ["Graphic design", "Branding", "Canva"],
      description: "Looking for a designer to create social posts, branding assets, and clean marketing visuals for a local business campaign.",
    },
  },
  {
    label: "Event Staff",
    data: {
      title: "Event assistants needed",
      type: "Project",
      pay: "$25/day",
      tags: ["Events", "Customer service", "Part-time"],
      description: "Need energetic event assistants for guest check-in, setup, and coordination. Must be available on event day and comfortable working with people.",
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
  const [account] = useState(() => safeJson("forsaAccount", null));
  const draftKey = useMemo(() => `forsaOpportunityDraft:${account?.email || "guest"}`, [account?.email]);

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
      (draft.title || draft.pay || draft.description || draft.tags?.length || draft.location || draft.company)
    ) {
      setShowRestoreDraft(true);
      setDraftSavedAt(draft.savedAt || null);
    }
  }, [draftKey]);

  useEffect(() => {
    const closeDropdowns = (event) => {
      if (typeRef.current && !typeRef.current.contains(event.target)) setTypeOpen(false);
      if (tagsRef.current && !tagsRef.current.contains(event.target)) setTagsOpen(false);
    };
    document.addEventListener("mousedown", closeDropdowns);
    return () => document.removeEventListener("mousedown", closeDropdowns);
  }, []);

  // Structural Auto-Save Core Loop
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (draftIgnored) return;

    const hasContent = form.title.trim() || form.pay.trim() || form.description.trim() || form.tags.length > 0;
    if (!hasContent) return;

    const timeout = setTimeout(() => {
      const savedAt = new Date().toISOString();
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          ...form,
          questions: form.questions.filter((q) => q.trim()),
          savedAt,
        })
      );
      setDraftSavedAt(savedAt);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [form, draftKey, draftIgnored]);

  const filteredTags = useMemo(() => {
    const cleanSearch = tagSearch.trim().toLowerCase();
    return tagOptions.filter((tag) => tag.toLowerCase().includes(cleanSearch));
  }, [tagSearch]);

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

  const canPost = useMemo(() => {
    return (
      form.title.trim() &&
      form.company.trim() &&
      form.location.trim() &&
      form.pay.trim() &&
      form.description.trim() &&
      form.contact.trim() &&
      form.tags.length > 0
    );
  }, [form]);

  const updateForm = (field, value) => {
    setDraftIgnored(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag) => {
    setDraftIgnored(false);
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag],
    }));
  };

  const updateQuestion = (index, value) => {
    setDraftIgnored(false);
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? value : q)),
    }));
  };

  const addQuestion = () => {
    if (form.questions.length >= 5) return;
    setDraftIgnored(false);
    setForm((prev) => ({ ...prev, ...form, questions: [...prev.questions, ""] }));
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
    showToast(`${template.label} template injected`, "info");
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
    showToast("State restored from draft cache");
  };

  const dismissDraft = () => {
    localStorage.removeItem(draftKey);
    setShowRestoreDraft(false);
    setDraftSavedAt(null);
    setDraftIgnored(true);
    showToast("Draft index evicted", "info");
  };

  const clearCurrentDraft = () => {
    if (!window.confirm("Purge currently staging workspace data?")) return;
    localStorage.removeItem(draftKey);
    setForm(emptyForm(account));
    setDraftSavedAt(null);
    setShowRestoreDraft(false);
    setDraftIgnored(true);
    showToast("Workspace flushed");
  };

  const handleSubmit = async () => {
    if (!canPost || posting) return;
    setPosting(true);

    try {
      const cleanQuestions = form.questions.filter((q) => q.trim());
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
        featured: Boolean(form.featured),
        trusted: Boolean(account?.trusted),
        verified: Boolean(account?.verified),
        questions: cleanQuestions,
        reports: 0, views: 0, applications: 0,
        qualityScore,
      };

      const createdPost = await createPost(newPost);
      const saved = safeJson("forsaPosts", []);
      localStorage.setItem("forsaPosts", JSON.stringify([createdPost, ...saved]));
      localStorage.removeItem(draftKey);
      setDraftSavedAt(null);

      showToast("Opportunity successfully compiled and dispatched");
      navigate("/explore");
    } catch (error) {
      console.error("Post exception thrown:", error);
      showToast("Failed to compile remote posting entity. Retry transaction.", "error");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)] antialiased">
      <AppHeader />
      <SEO title="Post an opportunity" />

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mt-6 grid grid-cols-1 gap-8 sm:mt-10 lg:grid-cols-[0.84fr_1.16fr] lg:gap-12">
          
          {/* Information & Metrics Staging Anchor */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-6 sm:space-y-8">
            <div className="relative overflow-hidden rounded-[34px] border border-neutral-200/60 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.015)] sm:p-8">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
                Campaign Manager
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.05]">
                Create a clear opportunity.
              </h1>
              <p className="mt-4 text-sm font-medium leading-relaxed text-neutral-500">
                Configure clear structural boundaries for role requirements, output expectations, financial compensation fields, and direct communication tunnels.
              </p>
            </div>

            <QualityCard qualityScore={qualityScore} />
            <DraftStatusCard draftSavedAt={draftSavedAt} onClearDraft={clearCurrentDraft} />
            <TemplatesCard onApply={applyTemplate} />

            <div className="hidden lg:block">
              <PreviewCard form={form} qualityScore={qualityScore} />
            </div>
          </aside>

          {/* Form Node Editor Core */}
          <div className="overflow-hidden rounded-[34px] border border-neutral-200/70 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.015)] sm:p-8 space-y-6">
            {showRestoreDraft && (
              <RestoreDraftBanner draftSavedAt={draftSavedAt} onRestore={restoreDraft} onDismiss={dismissDraft} />
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Opportunity title" placeholder="e.g., Junior Frontend Architect" value={form.title} onChange={(val) => updateForm("title", val)} />
              <Field label="Company / Entity name" placeholder="e.g., Cedars Tech" value={form.company} onChange={(val) => updateForm("company", val)} />
              <Field label="Target work site location" placeholder="e.g., Beirut, Tripoli, Remote" value={form.location} onChange={(val) => updateForm("location", val)} />
              <Field label="Compensation parameters" placeholder="e.g., $800/mo, Contractual" value={form.pay} onChange={(val) => updateForm("pay", val)} />
            </div>

            <Dropdown refEl={typeRef} label="Operational Framework Strategy" value={form.type} open={typeOpen} setOpen={setTypeOpen}>
              <div className="grid grid-cols-1 gap-1 p-1">
                {typeOptions.map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => {
                      updateForm("type", type);
                      setTypeOpen(false);
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    {type}
                    {form.type === type && <FaCheck className="text-xs text-[var(--forsa-primary)]" />}
                  </button>
                ))}
              </div>
            </Dropdown>

            {/* Tag Selection System */}
            <div ref={tagsRef} className="space-y-2">
              <label className="text-sm font-bold tracking-tight text-neutral-950">Capability Node Assignments</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTagsOpen(!tagsOpen)}
                  className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 text-left text-sm font-medium transition hover:border-neutral-400 hover:bg-white"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FaTag className="shrink-0 text-xs text-neutral-400" />
                    <span className="truncate text-neutral-700">
                      {form.tags.length > 0 ? `${form.tags.length} verification tags mounted` : "Mount framework dependencies"}
                    </span>
                  </span>
                  <FaChevronDown className="shrink-0 text-xs text-neutral-400" />
                </button>

                {tagsOpen && (
                  <div className="absolute z-30 mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl space-y-3">
                    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 bg-neutral-50 focus-within:bg-white focus-within:border-neutral-400 transition-all">
                      <FaSearch className="text-xs text-neutral-400" />
                      <input
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        placeholder="Filter database schema indices..."
                        className="w-full bg-transparent text-sm font-medium outline-none text-neutral-800"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto pr-1 divide-y divide-neutral-50">
                      {filteredTags.length === 0 ? (
                        <p className="px-3 py-4 text-xs font-semibold text-neutral-400 text-center">No structural matches found</p>
                      ) : (
                        filteredTags.map((tag) => (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
                          >
                            {tag}
                            {form.tags.includes(tag) && <FaCheck className="text-xs text-[var(--forsa-primary)]" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.tags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 hover:border-red-200 hover:text-red-600 transition-all"
                    >
                      {tag}
                      <FaTimes className="text-[9px] text-neutral-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description Text Node */}
            <div className="space-y-2">
              <label className="text-sm font-bold tracking-tight text-neutral-950">Detailed Role Execution Spec</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Detail core operations, sprint frequencies, hardware dependencies, and pipeline ownership tracks..."
                className="min-h-40 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium leading-relaxed outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white"
              />
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-1">
                <span>Staged Context Payload</span>
                <span>{form.description.trim().length} / 60 minimum recommendations</span>
              </div>
            </div>

            <Field label="Direct Ingress Contact Endpoint" placeholder="WhatsApp line, matrix endpoint URI, or mail routing handle" value={form.contact} onChange={(val) => updateForm("contact", val)} />

            {/* Interrogative Validation Node Loops */}
            <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50/40 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold tracking-tight text-neutral-950">Staged Evaluation Interrogatories</p>
                  <p className="text-xs font-medium text-neutral-400 mt-0.5">Enforce custom evaluation fields prior to application acceptance handlers.</p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={form.questions.length >= 5}
                  className="rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-neutral-900 transition-all disabled:opacity-40 tracking-tight"
                >
                  Append Query Node
                </button>
              </div>

              <div className="grid gap-3">
                {form.questions.map((question, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={question}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder={`Interrogative vector prompt metric #${index + 1}`}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 outline-none transition focus:border-neutral-950"
                    />
                    {form.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-400 hover:border-red-200 hover:text-red-600 transition"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Flags */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ToggleCard active={form.urgent} icon={<FaBolt />} title="Urgent Delivery Track" text="Inject explicit visual prioritization indicators inside active render pipelines." onClick={() => updateForm("urgent", !form.urgent)} />
              <ToggleCard active={form.featured} icon={<FaStar />} title="Featured Allocation Placement" text="Elevate operational entity node context inside main explore components." onClick={() => updateForm("featured", !form.featured)} />
            </div>

            <div className="block lg:hidden">
              <PreviewCard form={form} qualityScore={qualityScore} />
            </div>

            {/* Form Dispatch Bar */}
            <div className="sticky bottom-0 -mx-5 mt-8 border-t border-neutral-100 bg-white/95 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0">
              <button
                disabled={!canPost || posting}
                onClick={handleSubmit}
                className={`w-full rounded-full py-3.5 text-sm font-bold tracking-tight shadow-sm transition-all duration-300 ${
                  canPost && !posting
                    ? "forsa-button text-white hover:brightness-110 active:scale-[0.99]"
                    : "cursor-not-allowed bg-neutral-100 text-neutral-400 border border-neutral-200/60"
                }`}
              >
                {posting ? "Compiling environment configuration payload..." : "Publish Campaign Parameters"}
              </button>

              {!canPost && (
                <p className="mt-3 text-center text-xs font-semibold text-neutral-400">
                  Ensure all baseline configuration fields possess structured schema properties to deploy runtime nodes safely.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
}

function RestoreDraftBanner({ draftSavedAt, onRestore, onDismiss }) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 shadow-sm">
            <FaUndo className="text-xs" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-950">Workspace backup instance located</p>
            <p className="mt-0.5 text-xs font-medium text-neutral-500 leading-relaxed">
              We identified an un-dispatched structural dataset created on {formatTime(draftSavedAt)}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex shrink-0">
          <button type="button" onClick={onDismiss} className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-950 transition">
            Dismiss
          </button>
          <button type="button" onClick={onRestore} className="rounded-xl bg-neutral-950 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-900 transition shadow-sm">
            Restore State
          </button>
        </div>
      </div>
    </div>
  );
}

function DraftStatusCard({ draftSavedAt, onClearDraft }) {
  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-bold tracking-tight text-neutral-950">Storage Telemetry Layer</p>
          <p className="text-xs font-medium text-neutral-400 leading-relaxed">
            {draftSavedAt ? `Buffer checkpoint verified: ${formatTime(draftSavedAt)}` : "Automatic local backup active. Write to allocate cache segments."}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200/60 bg-neutral-50 text-neutral-400">
          <FaClock className="text-xs" />
        </div>
      </div>

      {draftSavedAt && (
        <button
          type="button"
          onClick={onClearDraft}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 hover:border-red-200 hover:bg-red-50/20 transition"
        >
          <FaTrash className="text-[10px]" />
          Purge local registry cache
        </button>
      )}
    </div>
  );
}

function TemplatesCard({ onApply }) {
  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <div>
        <p className="text-sm font-bold tracking-tight text-neutral-950">Runtime Template Hub</p>
        <p className="text-xs font-medium text-neutral-400 mt-0.5">Hydrate staging blocks using regional industry schemas.</p>
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {templates.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => onApply(template)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition"
          >
            {template.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QualityCard({ qualityScore }) {
  const label = qualityScore >= 80 ? "Strong production profile" : qualityScore >= 55 ? "Acceptable composition status" : "Incomplete metrics profile";

  return (
    <div className="rounded-[28px] border border-neutral-200/70 bg-white p-5 space-y-4 shadow-[0_12px_30px_rgba(0,0,0,0.015)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-tight text-neutral-950">Data Density Index</p>
          <p className="text-xs font-medium text-neutral-400 mt-0.5">{label}</p>
        </div>
        <span className="rounded-full forsa-button px-3 py-1 text-xs font-bold text-white shadow-sm">
          {qualityScore}%
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
        <div className="h-full rounded-full forsa-button transition-all duration-500 ease-out" style={{ width: `${qualityScore}%` }} />
      </div>

      <div className="grid gap-2 pt-1">
        <QualityItem active={qualityScore >= 20} text="Explicit role title format mapped" />
        <QualityItem active={qualityScore >= 40} text="Location coordinates, validation context fields compiled" />
        <QualityItem active={qualityScore >= 60} text="Core operational skillset properties assigned" />
        <QualityItem active={qualityScore >= 80} text="Context string meets baseline entropy constraints" />
      </div>
    </div>
  );
}

function QualityItem({ active, text }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border text-[8px] transition-all ${
        active ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white" : "border-neutral-200 bg-white text-transparent"
      }`}>
        <FaCheck />
      </div>
      <p className={`text-xs font-medium tracking-tight ${active ? "text-neutral-800" : "text-neutral-400"}`}>{text}</p>
    </div>
  );
}

function Dropdown({ refEl, label, value, open, setOpen, children }) {
  return (
    <div ref={refEl} className="space-y-2">
      <label className="text-sm font-bold tracking-tight text-neutral-950">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 text-left text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-white"
        >
          <span>{value}</span>
          <FaChevronDown className={`text-xs text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl animate-fade-in">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange }) {
  const isFilled = useMemo(() => Boolean(value?.trim?.()), [value]);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <label className="text-sm font-bold tracking-tight text-neutral-950">{label}</label>
        {isFilled && <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--forsa-primary)]">Validated</span>}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 text-sm font-medium text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white"
      />
    </div>
  );
}

function PreviewCard({ form, qualityScore }) {
  return (
    <div className="rounded-[24px] border border-neutral-200/70 bg-gradient-to-br from-white to-neutral-50/40 p-5 space-y-5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Dynamic UI Sync Mirror</p>
        <span className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-extrabold text-neutral-600">
          INDEX {qualityScore}%
        </span>
      </div>

      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl forsa-button text-white shadow-sm">
          <FaBriefcase className="text-sm" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-neutral-950">{form.title || "Untitled Staging Spec"}</h3>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400">
            <FaMapMarkerAlt className="shrink-0 text-[10px]" />
            <span className="truncate">{form.company || "Company Parameter"} · {form.location || "Coordinates Missing"}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <PreviewPill>{form.type}</PreviewPill>
        <PreviewPill>{form.pay || "Awaiting pricing specs"}</PreviewPill>
        {form.urgent && <span className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-700 uppercase tracking-wide">Urgent</span>}
        {form.featured && <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[10px] font-bold text-blue-700 uppercase tracking-wide">Featured</span>}
      </div>

      <p className="line-clamp-4 text-xs font-medium leading-relaxed text-neutral-500">
        {form.description || "The compiled system overview text block will append runtime data characters here inside this layout layer..."}
      </p>

      <div className="flex flex-wrap gap-1 border-t border-neutral-100 pt-3">
        {form.tags.length > 0 ? (
          form.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-600 shadow-2xs">
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs font-semibold text-neutral-400">No telemetry tags structural references loaded.</span>
        )}

        {form.tags.length > 5 && (
          <span className="rounded-lg bg-neutral-100 border border-neutral-200 px-2 py-1 text-[11px] font-extrabold text-neutral-500">
            +{form.tags.length - 5} overrides
          </span>
        )}
      </div>
    </div>
  );
}

function PreviewPill({ children }) {
  return <span className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wide shadow-2xs">{children}</span>;
}

function ToggleCard({ active, icon, title, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-all duration-200 group relative ${
        active
          ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
          : "border-neutral-200 bg-white hover:border-neutral-400"
      }`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
        active ? "bg-white/10 text-white" : "bg-neutral-50 text-neutral-600 border border-neutral-200/40"
      }`}>
        {icon}
      </div>
      <p className="mt-4 text-sm font-bold tracking-tight">{title}</p>
      <p className={`mt-1 text-xs font-medium leading-relaxed ${active ? "text-neutral-400" : "text-neutral-400"}`}>{text}</p>
    </button>
  );
}