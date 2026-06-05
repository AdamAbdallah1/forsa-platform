import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../lib/Toast";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { createPost } from "../lib/postService.js";
import { createNotification } from "../lib/notificationService";
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
  FaShieldAlt,
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

const categoryOptions = [
  "Restaurant / F&B",
  "Retail / Clothing",
  "Sales",
  "Customer Service",
  "Delivery / Driver",
  "Admin / Office",
  "Tech / Digital",
  "Design / Creative",
  "Marketing / Social Media",
  "Education",
  "Events",
  "Beauty / Salon",
  "Hospitality",
  "Healthcare",
  "Recruitment Agency",
  "Abroad Opportunity",
  "Visa / Placement",
  "Other",
];

const shiftOptions = [
  "Flexible",
  "Morning shift",
  "Day shift",
  "Night shift",
  "Rotating shifts",
  "Weekend shift",
  "Remote schedule",
];

const genderOptions = [
  "Any",
  "Male",
  "Female",
  "Not specified",
];

const postSourceOptions = [
  "Direct company hiring",
  "Recruitment agency / placement office",
];

const workCountryOptions = [
  "Lebanon",
  "UAE / Dubai",
  "Germany",
  "Qatar",
  "Saudi Arabia",
  "Remote / Online",
  "Other",
];

const experienceOptions = [
  "No experience required",
  "0-1 years",
  "1+ years",
  "2+ years",
  "3+ years",
  "5+ years",
];

const tagOptions = [
  "React", "JavaScript", "Frontend", "Backend", "Node.js", "Laravel",
  "WordPress", "Shopify", "Web design", "UI/UX", "Graphic design", "Canva",
  "Branding", "Logo design", "Marketing", "Social media", "Content creation",
  "Copywriting", "Video editing", "Photography", "Reels", "TikTok", "Instagram",
  "Sales", "Retail sales", "Clothing sales", "Customer service", "Cashier",
  "Waiter", "Waitress", "Barista", "Chef", "Kitchen staff", "Assistant manager",
  "Restaurant manager", "Delivery", "Driver", "Warehouse", "Stock management",
  "Inventory", "Events", "Event staff", "Hostess", "Admin", "Office assistant",
  "Data entry", "Accounting", "Teaching", "Tutor", "English", "Arabic", "Math",
  "Receptionist", "Salon assistant", "Beauty", "Nurse", "Healthcare",
  "Abroad job", "Dubai", "Germany", "Visa", "Recruitment agency", "Placement office",
];

const templates = [
  {
    label: "Barista",
    data: {
      title: "Part-time Barista",
      category: "Restaurant / F&B",
      type: "Part-time",
      pay: "$250/month + tips",
      tags: ["Barista", "Customer service", "Sales"],
      packageDetails: "Salary + tips",
      experience: "0-1 years",
      shift: "Weekend shift",
      gender: "Any",
      requirements: "Good communication, punctuality, cleanliness, and basic customer service skills.",
      description: "Looking for a friendly part-time barista for weekend shifts. Experience is helpful, but being punctual, clean, and comfortable with customers matters most.",
    },
  },
  {
    label: "React Internship",
    data: {
      title: "Junior React Developer Internship",
      category: "Tech / Digital",
      type: "Internship",
      pay: "Paid internship",
      tags: ["React", "JavaScript", "Frontend", "UI/UX"],
      packageDetails: "Monthly stipend / paid internship",
      experience: "0-1 years",
      shift: "Day shift",
      gender: "Any",
      requirements: "Basic React, JavaScript, Tailwind, Git, and willingness to learn.",
      description: "Looking for a motivated junior React developer to help build landing pages and dashboards. Good fit for students who know React, Tailwind, and basic UI structure.",
    },
  },
  {
    label: "Social Media",
    data: {
      title: "Social Media Content Creator",
      category: "Marketing / Social Media",
      type: "Freelance",
      pay: "$120/project",
      tags: ["Marketing", "Instagram", "Content creation", "Video editing"],
      packageDetails: "Per project payment",
      experience: "1+ years",
      shift: "Flexible",
      gender: "Any",
      requirements: "Portfolio or examples of previous Instagram content, reels, captions, or campaigns.",
      description: "Need someone to create Instagram content, captions, and simple reels for a local brand. Portfolio or previous examples are preferred.",
    },
  },
  {
    label: "Graphic Designer",
    data: {
      title: "Graphic Designer",
      category: "Design / Creative",
      type: "Project",
      pay: "Per project",
      tags: ["Graphic design", "Branding", "Canva"],
      packageDetails: "Per project payment",
      experience: "1+ years",
      shift: "Flexible",
      gender: "Any",
      requirements: "Previous design examples, strong visual taste, and ability to deliver clean social media assets.",
      description: "Looking for a designer to create social posts, branding assets, and clean marketing visuals for a local business campaign.",
    },
  },
  {
    label: "Event Staff",
    data: {
      title: "Event assistants needed",
      category: "Events",
      type: "Project",
      pay: "$25/day",
      tags: ["Events", "Customer service", "Part-time"],
      packageDetails: "Daily payment",
      experience: "No experience required",
      shift: "Weekend shift",
      gender: "Any",
      requirements: "Energetic, punctual, presentable, and comfortable helping guests during events.",
      description: "Need energetic event assistants for guest check-in, setup, and coordination. Must be available on event day and comfortable working with people.",
    },
  },
  {
    label: "Waiter",
    data: {
      title: "Waiter / Waitress",
      category: "Restaurant / F&B",
      type: "Full-time",
      pay: "Salary + tips",
      tags: ["Waiter", "Customer service", "Restaurant manager"],
      packageDetails: "Salary + tips + meals",
      experience: "0-1 years",
      shift: "Rotating shifts",
      gender: "Any",
      requirements: "Presentable, polite, fast learner, and able to work under pressure.",
      description: "Restaurant is hiring waiter/waitress staff to serve customers, take orders, keep tables organized, and support daily restaurant operations.",
    },
  },
  {
    label: "Clothing Sales",
    data: {
      title: "Clothing Store Sales Assistant",
      category: "Retail / Clothing",
      type: "Full-time",
      pay: "Salary + commission",
      tags: ["Clothing sales", "Retail sales", "Customer service"],
      packageDetails: "Salary + commission",
      experience: "0-1 years",
      shift: "Day shift",
      gender: "Any",
      requirements: "Good communication, clean appearance, sales mindset, and basic stock organization.",
      description: "Clothing store is looking for a sales assistant to help customers, organize items, handle basic sales, and support daily shop operations.",
    },
  },
  {
    label: "Abroad Agency",
    data: {
      postSource: "Recruitment agency / placement office",
      title: "Assistant Manager - Abroad Opportunity",
      agencyName: "Recruitment Agency",
      hiringFor: "Restaurant / Employer",
      workCountry: "UAE / Dubai",
      company: "Restaurant / Employer",
      category: "Abroad Opportunity",
      type: "Full-time",
      location: "Dubai",
      pay: "Salary + benefits",
      tags: ["Abroad job", "Dubai", "Assistant manager", "Customer service"],
      packageDetails: "Salary + benefits depending on employer contract",
      experience: "2+ years",
      shift: "Flexible",
      gender: "Any",
      requirements: "Previous experience, valid documents, professional communication, and ability to confirm contract/visa details with the agency.",
      description: "Recruitment/placement office is sharing an abroad opportunity. Applicants should confirm employer identity, fees, visa process, contract details, accommodation, and salary before applying.",
    },
  },
  {
    label: "Delivery Driver",
    data: {
      title: "Delivery Driver",
      category: "Delivery / Driver",
      type: "Full-time",
      pay: "Salary + delivery allowance",
      tags: ["Delivery", "Driver", "Customer service"],
      packageDetails: "Salary + delivery allowance",
      experience: "1+ years",
      shift: "Day shift",
      gender: "Any",
      requirements: "Valid driving license, punctuality, phone availability, and good knowledge of local areas.",
      description: "Looking for a reliable delivery driver to handle orders, communicate with customers, and deliver items safely and on time.",
    },
  },
];

const emptyForm = (account) => ({
  title: "",
  questions: [""],
  postSource: "Direct company hiring",
  agencyName: account?.name || "",
  hiringFor: "",
  workCountry: "Lebanon",
  company: account?.name || "",
  location: account?.city || "",
  type: "Freelance",
  category: "Restaurant / F&B",
  pay: "",
  packageDetails: "",
  experience: "No experience required",
  shift: "Flexible",
  gender: "Any",
  description: "",
  requirements: "",
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

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const normalizeText = (value) => String(value || "").trim();

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
  const [customTags, setCustomTags] = useState(() => safeJson("forsaCustomTags", []));
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

  const allTagOptions = useMemo(() => {
    return Array.from(new Set([...tagOptions, ...customTags])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [customTags]);

  const filteredTags = useMemo(() => {
    const cleanSearch = tagSearch.trim().toLowerCase();
    return allTagOptions.filter((tag) => tag.toLowerCase().includes(cleanSearch));
  }, [tagSearch, allTagOptions]);

  const canAddCustomTag = useMemo(() => {
    const value = normalizeText(tagSearch);
    if (value.length < 2) return false;
    return !allTagOptions.some((tag) => tag.toLowerCase() === value.toLowerCase());
  }, [tagSearch, allTagOptions]);

  const qualityScore = useMemo(() => {
    let score = 0;
    if (form.title.trim().length >= 8) score += 20;
    if (form.company.trim()) score += 10;
    if (form.location.trim()) score += 10;
    if (form.category.trim()) score += 10;
    if (form.pay.trim()) score += 10;
    if (form.packageDetails.trim()) score += 8;
    if (form.experience.trim()) score += 7;
    if (form.shift.trim()) score += 7;
    if (form.contact.trim()) score += 13;
    if (form.tags.length >= 2) score += 15;
    if (form.requirements.trim().length >= 25) score += 10;
    if (form.description.trim().length >= 60) score += 10;
    return Math.min(score, 100);
  }, [form]);

  const canPost = useMemo(() => {
    return (
      form.title.trim() &&
      form.company.trim() &&
      (!form.postSource.includes("Recruitment") || (form.agencyName.trim() && form.hiringFor.trim() && form.workCountry.trim())) &&
      form.location.trim() &&
      form.category.trim() &&
      form.pay.trim() &&
      form.description.trim() &&
      form.contact.trim() &&
      form.experience.trim() &&
      form.shift.trim() &&
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

  const addCustomTag = () => {
    const cleanTag = normalizeText(tagSearch);
    if (!cleanTag || cleanTag.length < 2) return;

    const exists = allTagOptions.some(
      (tag) => tag.toLowerCase() === cleanTag.toLowerCase()
    );

    if (!exists) {
      const nextCustomTags = Array.from(new Set([...customTags, cleanTag]));
      setCustomTags(nextCustomTags);
      writeJson("forsaCustomTags", nextCustomTags);
    }

    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(cleanTag) ? prev.tags : [...prev.tags, cleanTag],
    }));

    setTagSearch("");
    setDraftIgnored(false);
    showToast(`Added tag: ${cleanTag}`, "info");
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
    setForm((prev) => ({ ...prev, questions: [...prev.questions, ""] }));
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
    showToast("Draft dismissed", "info");
  };

  const clearCurrentDraft = () => {
    if (!window.confirm("Clear the saved draft?")) return;
    localStorage.removeItem(draftKey);
    setForm(emptyForm(account));
    setDraftSavedAt(null);
    setShowRestoreDraft(false);
    setDraftIgnored(true);
    showToast("Draft cleared");
  };

  const notifyFollowersOfNewPost = async (post) => {
    const followers = safeJson("forsaCompanyFollowers", []);
    const ownerEmail = post.ownerEmail || post.contact || account?.email || "";
    const companyName = post.company || account?.companyName || account?.name || "";

    const followerEmails = Array.from(
      new Set(
        followers
          .filter((item) => (
            item.companyEmail === ownerEmail ||
            item.email === ownerEmail ||
            item.companyName === companyName ||
            item.name === companyName
          ))
          .map((item) => item.seekerEmail || item.userEmail || item.followerEmail)
          .filter(Boolean)
      )
    );

    if (followerEmails.length === 0) return;

    try {
      await Promise.all(
        followerEmails.map((targetEmail) =>
          createNotification({
            type: "followed_company_post",
            title: `${companyName} posted a new opportunity`,
            text: `${post.title} · ${post.location}`,
            targetEmail,
            actionUrl: `/explore?post=${encodeURIComponent(post.id)}`,
            postId: post.id,
            company: companyName,
          })
        )
      );
    } catch (error) {
      console.error("Follower notification error:", error);
    }
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
        postSource: form.postSource,
        isAgencyPost: form.postSource.includes("Recruitment"),
        agencyName: form.agencyName.trim(),
        hiringFor: form.hiringFor.trim(),
        workCountry: form.workCountry.trim(),
        postedBy: form.postSource.includes("Recruitment") ? form.agencyName.trim() : form.company.trim(),
        company: form.postSource.includes("Recruitment") ? form.hiringFor.trim() : form.company.trim(),
        location: form.location.trim(),
        title: form.title.trim(),
        type: form.type,
        category: form.category.trim(),
        pay: form.pay.trim(),
        packageDetails: form.packageDetails.trim(),
        experience: form.experience.trim(),
        shift: form.shift.trim(),
        gender: form.gender.trim(),
        description: form.description.trim(),
        requirements: form.requirements.trim(),
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
      await notifyFollowersOfNewPost(createdPost);
      localStorage.removeItem(draftKey);
      setDraftSavedAt(null);

      showToast("Opportunity published successfully");
      navigate("/explore");
    } catch (error) {
      console.error("Post error:", error);
      showToast("Could not publish opportunity. Try again.", "error");
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
                Job post builder
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-neutral-950 sm:text-4xl md:text-5xl md:leading-[1.05]">
                Create a clear opportunity.
              </h1>
              <p className="mt-4 text-sm font-medium leading-relaxed text-neutral-500">
                Create a clear post for restaurants, retail, delivery, office work, tech, events, and more without making the form complicated.
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

            <div className="rounded-[26px] border border-neutral-200 bg-neutral-50/60 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold tracking-tight text-neutral-950">Posting mode</p>
                  <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-neutral-500">
                    Choose if this is a direct company job or an agency / abroad placement opportunity.
                  </p>
                </div>
                {form.postSource.includes("Recruitment") && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100">
                    <FaShieldAlt className="text-[10px]" />
                    Agency post
                  </span>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {postSourceOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      updateForm("postSource", option);
                      if (option.includes("Recruitment")) {
                        updateForm("category", "Abroad Opportunity");
                        updateForm("agencyName", form.agencyName || account?.name || "");
                        updateForm("hiringFor", form.hiringFor || form.company || "");
                      }
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      form.postSource === option
                        ? "border-[var(--forsa-primary)] bg-white text-[var(--forsa-primary)] shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    <p className="text-sm font-bold">{option}</p>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      {option.includes("Recruitment")
                        ? "For recruitment offices, abroad jobs, visa or placement opportunities."
                        : "For companies hiring directly for their own team."}
                    </p>
                  </button>
                ))}
              </div>

              {form.postSource.includes("Recruitment") && (
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-800">Applicant safety notice</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    This will be shown as an agency/placement post. Applicants should confirm fees, contract details, visa process, employer identity, and work country before applying.
                  </p>
                </div>
              )}
            </div>

            {form.postSource.includes("Recruitment") && (
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Agency / Office name" placeholder="e.g., Recruitment Agency Freelance" value={form.agencyName} onChange={(val) => updateForm("agencyName", val)} />
                <Field label="Hiring for / Employer" placeholder="e.g., Farouj Restaurant" value={form.hiringFor} onChange={(val) => {
                  updateForm("hiringFor", val);
                  updateForm("company", val);
                }} />
                <SelectField label="Work country" value={form.workCountry} options={workCountryOptions} onChange={(val) => updateForm("workCountry", val)} />
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Opportunity title" placeholder="e.g., Assistant Manager" value={form.title} onChange={(val) => updateForm("title", val)} />
              <Field label={form.postSource.includes("Recruitment") ? "Employer / Company abroad" : "Company / Restaurant / Entity"} placeholder="e.g., Farouj Restaurant" value={form.company} onChange={(val) => {
                updateForm("company", val);
                if (form.postSource.includes("Recruitment")) updateForm("hiringFor", val);
              }} />
              <Field label={form.postSource.includes("Recruitment") ? "Work city / destination" : "Work location"} placeholder="e.g., Jal El Dib, Dubai, Germany, Remote" value={form.location} onChange={(val) => updateForm("location", val)} />
              <Field label="Salary / Pay" placeholder="e.g., Salary + tips, $800/month" value={form.pay} onChange={(val) => updateForm("pay", val)} />
              <Field label="Package details" placeholder="e.g., Salary + tips + meals + transport" value={form.packageDetails} onChange={(val) => updateForm("packageDetails", val)} />
              <Field label="Contact / CV destination" placeholder={form.postSource.includes("Recruitment") ? "Agency WhatsApp / email for CVs" : "e.g., WhatsApp 70582107 or jobs@email.com"} value={form.contact} onChange={(val) => updateForm("contact", val)} />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <SelectField label="Experience required" value={form.experience} options={experienceOptions} onChange={(val) => updateForm("experience", val)} />
              <SelectField label="Shift / Schedule" value={form.shift} options={shiftOptions} onChange={(val) => updateForm("shift", val)} />
              <SelectField label="Gender preference" value={form.gender} options={genderOptions} onChange={(val) => updateForm("gender", val)} />
            </div>

            <SelectField
              label="Job Category"
              value={form.category}
              options={categoryOptions}
              onChange={(val) => updateForm("category", val)}
            />

            <Dropdown refEl={typeRef} label="Opportunity Type" value={form.type} open={typeOpen} setOpen={setTypeOpen}>
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
              <label className="text-sm font-bold tracking-tight text-neutral-950">Skills / Job Tags</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTagsOpen(!tagsOpen)}
                  className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 text-left text-sm font-medium transition hover:border-neutral-400 hover:bg-white"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FaTag className="shrink-0 text-xs text-neutral-400" />
                    <span className="truncate text-neutral-700">
                      {form.tags.length > 0 ? `${form.tags.length} tags selected` : "Select relevant skills or job tags"}
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && canAddCustomTag) {
                            e.preventDefault();
                            addCustomTag();
                          }
                        }}
                        placeholder="Search or add skills, role tags..."
                        className="w-full bg-transparent text-sm font-medium outline-none text-neutral-800"
                      />
                    </div>

                    {canAddCustomTag && (
                      <button
                        type="button"
                        onClick={addCustomTag}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--forsa-primary)] bg-[var(--forsa-bg-soft)] px-3 py-2.5 text-sm font-bold text-[var(--forsa-primary)]"
                      >
                        <FaPlus className="text-xs" />
                        Add “{normalizeText(tagSearch)}”
                      </button>
                    )}

                    <div className="max-h-60 overflow-y-auto pr-1 divide-y divide-neutral-50">
                      {filteredTags.length === 0 ? (
                        <p className="px-3 py-4 text-xs font-semibold text-neutral-400 text-center">
                          No tags found. Type a custom tag above and click add.
                        </p>
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

            <div className="space-y-2">
              <label className="text-sm font-bold tracking-tight text-neutral-950">Requirements</label>
              <textarea
                value={form.requirements}
                onChange={(e) => updateForm("requirements", e.target.value)}
                placeholder="Example: 2+ years F&B supervisory experience, leadership, food safety knowledge, inventory management, customer service..."
                className="min-h-32 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium leading-relaxed outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white"
              />
            </div>

            {/* Description Text Node */}
            <div className="space-y-2">
              <label className="text-sm font-bold tracking-tight text-neutral-950">Job Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Describe the role, responsibilities, daily tasks, work environment, and what the candidate will do."
                className="min-h-40 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium leading-relaxed outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white"
              />
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-1">
                <span>Description length</span>
                <span>{form.description.trim().length} / 60 minimum recommendations</span>
              </div>
            </div>

            {/* Interrogative Validation Node Loops */}
            <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50/40 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold tracking-tight text-neutral-950">Application Questions</p>
                  <p className="text-xs font-medium text-neutral-400 mt-0.5">Ask applicants questions before they apply.</p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={form.questions.length >= 5}
                  className="rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-neutral-900 transition-all disabled:opacity-40 tracking-tight"
                >
                  Add Question
                </button>
              </div>

              <div className="grid gap-3">
                {form.questions.map((question, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={question}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder={`Question #${index + 1}`}
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
              <ToggleCard active={form.urgent} icon={<FaBolt />} title="Urgent post" text="Show an urgent label so seekers know this role needs faster applications." onClick={() => updateForm("urgent", !form.urgent)} />
              <ToggleCard active={form.featured} icon={<FaStar />} title="Featured post" text="Highlight this opportunity inside Explore. Verified companies are featured automatically." onClick={() => updateForm("featured", !form.featured)} />
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
                {posting ? "Publishing opportunity..." : "Publish Opportunity"}
              </button>

              {!canPost && (
                <p className="mt-3 text-center text-xs font-semibold text-neutral-400">
                  Complete the required fields before publishing.
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
            <p className="text-sm font-bold text-neutral-950">Saved draft found</p>
            <p className="mt-0.5 text-xs font-medium text-neutral-500 leading-relaxed">
              You have an unfinished job post saved from {formatTime(draftSavedAt)}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex shrink-0">
          <button type="button" onClick={onDismiss} className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-950 transition">
            Dismiss
          </button>
          <button type="button" onClick={onRestore} className="rounded-xl bg-neutral-950 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-900 transition shadow-sm">
            Restore draft
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
          <p className="text-sm font-bold tracking-tight text-neutral-950">Auto-save draft</p>
          <p className="text-xs font-medium text-neutral-400 leading-relaxed">
            {draftSavedAt ? `Last saved: ${formatTime(draftSavedAt)}` : "Automatic draft saving is active while you write."}
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
          Clear saved draft
        </button>
      )}
    </div>
  );
}

function TemplatesCard({ onApply }) {
  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <div>
        <p className="text-sm font-bold tracking-tight text-neutral-950">Quick templates</p>
        <p className="text-xs font-medium text-neutral-400 mt-0.5">Start faster with common Lebanon job posts.</p>
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
  const label = qualityScore >= 80 ? "Strong post" : qualityScore >= 55 ? "Good post" : "Needs details";

  return (
    <div className="rounded-[28px] border border-neutral-200/70 bg-white p-5 space-y-4 shadow-[0_12px_30px_rgba(0,0,0,0.015)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-tight text-neutral-950">Post quality</p>
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
        <QualityItem active={qualityScore >= 20} text="Clear role title added" />
        <QualityItem active={qualityScore >= 40} text="Location, pay, package, and contact details added" />
        <QualityItem active={qualityScore >= 60} text="Skills, experience, and shift details selected" />
        <QualityItem active={qualityScore >= 80} text="Description and requirements are clear" />
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

function SelectField({ label, value, options, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold tracking-tight text-neutral-950">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 text-sm font-semibold text-neutral-800 outline-none transition focus:border-neutral-950 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
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
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Live preview</p>
        <span className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-extrabold text-neutral-600">
          INDEX {qualityScore}%
        </span>
      </div>

      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl forsa-button text-white shadow-sm">
          <FaBriefcase className="text-sm" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {form.postSource?.includes("Recruitment") && (
              <span className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-extrabold text-amber-700 uppercase tracking-wide">
                Agency post
              </span>
            )}
            <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-neutral-950">{form.title || "Untitled job post"}</h3>
          </div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400">
            <FaMapMarkerAlt className="shrink-0 text-[10px]" />
            <span className="truncate">{form.postSource?.includes("Recruitment") ? `${form.agencyName || "Agency"} → ${form.hiringFor || "Employer"}` : form.company || "Company"} · {form.location || "Location missing"}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <PreviewPill>{form.postSource?.includes("Recruitment") ? form.workCountry : "Lebanon"}</PreviewPill>
        <PreviewPill>{form.category}</PreviewPill>
        <PreviewPill>{form.type}</PreviewPill>
        <PreviewPill>{form.pay || "Pay not set"}</PreviewPill>
        <PreviewPill>{form.experience || "Experience not set"}</PreviewPill>
        <PreviewPill>{form.shift || "Shift not set"}</PreviewPill>
        {form.gender && form.gender !== "Any" && <PreviewPill>{form.gender}</PreviewPill>}
        {form.urgent && <span className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-700 uppercase tracking-wide">Urgent</span>}
        {form.featured && <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[10px] font-bold text-blue-700 uppercase tracking-wide">Featured</span>}
      </div>

      <p className="line-clamp-4 text-xs font-medium leading-relaxed text-neutral-500">
        {form.description || "Job description preview will appear here..."}
      </p>

      {form.postSource?.includes("Recruitment") && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Agency / abroad notice</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-amber-800">
            Applicants should confirm fees, contract, visa process, employer identity, and work country before applying.
          </p>
        </div>
      )}

      {form.requirements && (
        <div className="rounded-2xl border border-neutral-100 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Requirements</p>
          <p className="mt-1 line-clamp-3 text-xs font-medium leading-relaxed text-neutral-500">{form.requirements}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-t border-neutral-100 pt-3">
        {form.tags.length > 0 ? (
          form.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-600 shadow-2xs">
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs font-semibold text-neutral-400">No tags selected yet.</span>
        )}

        {form.tags.length > 5 && (
          <span className="rounded-lg bg-neutral-100 border border-neutral-200 px-2 py-1 text-[11px] font-extrabold text-neutral-500">
            +{form.tags.length - 5} more
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