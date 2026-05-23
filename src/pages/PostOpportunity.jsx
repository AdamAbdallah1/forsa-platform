import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../lib/toast";
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

function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export default function PostOpportunity() {
  const navigate = useNavigate();
  const account = safeJson("forsaAccount", null);

  const [typeOpen, setTypeOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  const [form, setForm] = useState({
    title: "",
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
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((item) => item !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = () => {
    if (!canPost) return;

    const saved = safeJson("forsaPosts", []);

    const newPost = {
      id: Date.now(),
      ownerEmail: account?.email || form.contact,
      ownerName: account?.name || form.company,
      createdAt: new Date().toISOString(),
      status: "active",
      qualityScore,
      ...form,
    };

    localStorage.setItem("forsaPosts", JSON.stringify([newPost, ...saved]));
    showToast("Opportunity posted");
    navigate("/explore");
  };

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-6 grid gap-6 sm:mt-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-8">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div>
              <p className="text-sm font-medium text-neutral-500">Post</p>

              <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
                Post a local opportunity.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
                Create a clear post that helps people understand the role,
                skills, location, pay, and how to contact you.
              </p>
            </div>

            <QualityCard qualityScore={qualityScore} />

            <div className="hidden lg:block">
              <PreviewCard form={form} qualityScore={qualityScore} />
            </div>
          </aside>

          <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6">
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

            <div className="mt-5">
              <label className="text-sm font-medium">Skills / tags</label>

              <div className="relative mt-2">
                <button
                  type="button"
                  onClick={() => setTagsOpen(!tagsOpen)}
                  className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-neutral-400"
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
                  <div className="absolute z-30 mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
                    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
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
                      className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1.5 text-xs text-white"
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
                placeholder="Explain what you need, who it fits, requirements, schedule, and how serious the opportunity is."
                className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-500">
                {form.description.trim().length}/60 minimum recommended.
              </p>
            </div>

            <Field
              label="Contact method"
              placeholder="WhatsApp, Instagram, email..."
              value={form.contact}
              onChange={(value) => updateForm("contact", value)}
            />

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <ToggleCard
                active={form.urgent}
                icon={<FaBolt />}
                title="Urgent hiring"
                text="Show this post as urgent."
                onClick={() => updateForm("urgent", !form.urgent)}
              />

              <ToggleCard
                active={form.featured}
                icon={<FaStar />}
                title="Featured opportunity"
                text="Make this post stand out."
                onClick={() => updateForm("featured", !form.featured)}
              />
            </div>

            <div className="mt-6 lg:hidden">
              <PreviewCard form={form} qualityScore={qualityScore} />
            </div>

            <div className="sticky bottom-0 -mx-4 mt-8 border-t border-neutral-100 bg-white/95 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0">
              <button
                disabled={!canPost}
                onClick={handleSubmit}
                className={`w-full rounded-full px-5 py-3 text-sm font-medium transition ${
                  canPost
                    ? "bg-black text-white hover:bg-neutral-800"
                    : "cursor-not-allowed bg-neutral-200 text-neutral-400"
                }`}
              >
                Post opportunity
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

function QualityCard({ qualityScore }) {
  return (
    <div className="mt-6 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm sm:mt-8 sm:rounded-[28px] sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Post quality</p>
        <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
          {qualityScore}%
        </span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-[#f7f7f5]">
        <div
          className="h-2 rounded-full bg-black transition-all"
          style={{ width: `${qualityScore}%` }}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Clear posts get better applicants. Add pay, tags, contact, and a useful
        description.
      </p>
    </div>
  );
}

function Dropdown({ label, value, open, setOpen, children }) {
  return (
    <div className="mt-5">
      <label className="text-sm font-medium">{label}</label>

      <div className="relative mt-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-neutral-400"
        >
          {value}
          <FaChevronDown className="text-xs text-neutral-400" />
        </button>

        {open && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
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
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
      />
    </div>
  );
}

function PreviewCard({ form, qualityScore }) {
  return (
    <div className="mt-6 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-500">Live preview</p>

        <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs text-neutral-600">
          Quality {qualityScore}%
        </span>
      </div>

      <div className="mt-5 flex gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white sm:h-12 sm:w-12">
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
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs"
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
          ? "border-black bg-black text-white"
          : "border-neutral-200 bg-white hover:border-neutral-400"
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

      <p
        className={`mt-1 text-sm leading-6 ${
          active ? "text-neutral-300" : "text-neutral-500"
        }`}
      >
        {text}
      </p>
    </button>
  );
}
