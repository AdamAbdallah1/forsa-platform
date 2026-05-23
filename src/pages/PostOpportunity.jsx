import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChevronDown,
  FaCheck,
  FaBriefcase,
  FaMapMarkerAlt,
  FaTag,
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

export default function PostOpportunity() {
  const navigate = useNavigate();
  const account = JSON.parse(localStorage.getItem("forsaAccount")) || null;

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
    tag.toLowerCase().includes(tagSearch.toLowerCase())
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

    const saved = JSON.parse(localStorage.getItem("forsaPosts")) || [];

    const newPost = {
      id: Date.now(),
      ownerEmail: account?.email || "guest",
      ownerName: account?.name || form.company,
      createdAt: new Date().toISOString(),
      qualityScore,
      ...form,
    };

    localStorage.setItem("forsaPosts", JSON.stringify([newPost, ...saved]));
    navigate("/explore");
  };

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-6 grid gap-6 sm:mt-10 lg:gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-medium text-neutral-500">Post</p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
              Post a local opportunity.
            </h1>

            <p className="mt-4 max-w-xl leading-7 text-neutral-600">
              Create a clear post that helps people understand the role, skills,
              location, pay, and how to contact you.
            </p>

            <div className="mt-8 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
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
                Clear posts get better applicants. Add pay, tags, contact, and a
                useful description.
              </p>
            </div>

            <PreviewCard form={form} qualityScore={qualityScore} />
          </div>

          <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm">
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
                placeholder="Beirut"
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

            <div className="mt-5">
              <label className="text-sm font-medium">Type</label>

              <div className="relative mt-2">
                <button
                  onClick={() => setTypeOpen(!typeOpen)}
                  className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-neutral-400"
                >
                  {form.type}
                  <FaChevronDown className="text-xs text-neutral-400" />
                </button>

                {typeOpen && (
                  <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg">
                    {typeOptions.map((type) => (
                      <button
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
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium">Skills / tags</label>

              <div className="relative mt-2">
                <button
                  onClick={() => setTagsOpen(!tagsOpen)}
                  className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-neutral-400"
                >
                  {form.tags.length > 0
                    ? `${form.tags.length} tag selected`
                    : "Choose skills / job tags"}
                  <FaChevronDown className="text-xs text-neutral-400" />
                </button>

                {tagsOpen && (
                  <div className="absolute z-30 mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg">
                    <input
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      placeholder="Search tags..."
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-black"
                    />

                    <div className="mt-3 max-h-64 overflow-auto">
                      {filteredTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[#f7f7f5]"
                        >
                          {tag}
                          {form.tags.includes(tag) && (
                            <FaCheck className="text-xs" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {form.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="rounded-full bg-black px-3 py-1.5 text-xs text-white"
                    >
                      {tag} ×
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
                className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
              />
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
    title="Urgent hiring"
    text="Show this post as urgent."
    onClick={() => setForm({ ...form, urgent: !form.urgent })}
  />

  <ToggleCard
    active={form.featured}
    title="Featured opportunity"
    text="Make this post stand out."
    onClick={() => setForm({ ...form, featured: !form.featured })}
  />
</div>
            <button
              disabled={!canPost}
              onClick={handleSubmit}
              className={`mt-8 w-full rounded-full px-5 py-3 text-sm font-medium transition ${
                canPost
                  ? "bg-black text-white hover:bg-neutral-800"
                  : "cursor-not-allowed bg-neutral-200 text-neutral-400"
              }`}
            >
              Post opportunity
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, placeholder, value, onChange }) {
  return (
    <div>
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
    <div className="mt-6 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">Live preview</p>

      <div className="mt-5 flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white">
          <FaBriefcase />
        </div>

        <div>
          <h3 className="font-semibold">
            {form.title || "Opportunity title"}
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            {form.company || "Company"} · {form.location || "Location"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#f7f7f5] px-3 py-1.5 text-xs text-neutral-600">
          {form.type}
        </span>

        <span className="rounded-full bg-[#f7f7f5] px-3 py-1.5 text-xs text-neutral-600">
          {form.pay || "Pay"}
        </span>

        <span className="rounded-full bg-[#f7f7f5] px-3 py-1.5 text-xs text-neutral-600">
          Quality {qualityScore}%
        </span>
      </div>

      <p className="mt-5 text-sm leading-6 text-neutral-600">
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
      </div>
    </div>
  );

  
}

function ToggleCard({ active, title, text, onClick }) {
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
      <p className="text-sm font-medium">{title}</p>

      <p
        className={`mt-1 text-sm ${
          active ? "text-neutral-300" : "text-neutral-500"
        }`}
      >
        {text}
      </p>
    </button>
  );
}