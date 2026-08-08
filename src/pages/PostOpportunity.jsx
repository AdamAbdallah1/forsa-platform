
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../lib/Toast";
import Footer from "../components/Footer";
import { createPost } from "../lib/postService.js";
import { createNotification } from "../lib/notificationService";
import {
  FaArrowRight,
  FaBriefcase,
  FaBuilding,
  FaCheck,
  FaChevronDown,
  FaClock,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaTag,
  FaTimes,
  FaTrash,
  FaUndo,
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
  "Software & Development",
  "Data & AI",
  "UI/UX & Product Design",
  "Graphic & Brand Design",
  "Marketing & Content",
  "Cybersecurity",
  "IT & Technical Support",
  "Sales & Business",
  "Restaurant / F&B",
  "Retail",
  "Delivery & Logistics",
  "Hospitality",
  "Education",
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

const genderOptions = ["Any", "Male", "Female", "Not specified"];

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
  "React",
  "JavaScript",
  "TypeScript",
  "Frontend",
  "Backend",
  "Node.js",
  "Python",
  "PHP",
  "Laravel",
  "Next.js",
  "React Native",
  "Flutter",
  "Java",
  "C++",
  "SQL",
  "Firebase",
  "Supabase",
  "API Development",
  "Cybersecurity",
  "UI/UX",
  "Figma",
  "Graphic Design",
  "Branding",
  "Logo Design",
  "Web Design",
  "Motion Design",
  "Digital Marketing",
  "SEO",
  "Social Media",
  "Content Creation",
  "Copywriting",
  "Video Editing",
  "Photography",
  "Sales",
  "Business Development",
  "Customer Success",
  "IT Support",
  "Technical Support",
  "Data Entry",
  "Data Analysis",
  "Internship",
  "Junior",
  "Remote",
  "Freelance",
  "Part-time",
];

const templates = [
  {
    label: "Developer Internship",
    data: {
      title: "Junior Developer Internship",
      category: "Software & Development",
      type: "Internship",
      tags: ["JavaScript", "React", "Frontend", "Internship"],
      experience: "No experience required",
      shift: "Flexible",
    },
  },
  {
    label: "UI/UX Designer",
    data: {
      title: "UI/UX Designer",
      category: "UI/UX & Product Design",
      type: "Freelance",
      tags: ["UI/UX", "Figma", "Web Design"],
      experience: "1+ years",
      shift: "Flexible",
    },
  },
  {
    label: "Frontend Developer",
    data: {
      title: "Frontend Developer",
      category: "Software & Development",
      type: "Part-time",
      tags: ["React", "JavaScript", "Frontend"],
      experience: "0-1 years",
      shift: "Flexible",
    },
  },
  {
    label: "Marketing Freelancer",
    data: {
      title: "Digital Marketing Freelancer",
      category: "Marketing & Content",
      type: "Freelance",
      tags: ["Digital Marketing", "Social Media", "Content Creation"],
      experience: "1+ years",
      shift: "Flexible",
    },
  },
];

const emptyForm = (account) => ({
  title: "",
  company: account?.companyName || account?.name || "",
  location: account?.city || "",
  type: "Full-time",
  category: "Other",

  pay: "",
  packageDetails: "",

  experience: "No experience required",
  shift: "Flexible",
  gender: "Any",

  description: "",
  requirements: "",
  contact: account?.email || "",

  tags: [],
  questions: [""],

  postSource: "Direct company hiring",
  agencyName: "",
  hiringFor: "",
  workCountry: "Lebanon",

  postingMode: "company",
  managedCompanyEmail: "",
  managedCompanyPhone: "",

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

function normalizeText(value) {
  return String(value || "").trim();
}

export default function PostOpportunity() {
  const navigate = useNavigate();

  const [account] = useState(() =>
    safeJson("forsaAccount", null)
  );

  const isForsaAdmin =
    account?.email === "support.forsa@gmail.com" ||
    account?.email === "adamabdallahayln1@gmail.com" ||
    account?.role === "admin";

  const [form, setForm] = useState(() => emptyForm(account));
  const [step, setStep] = useState(1);
  const [posting, setPosting] = useState(false);

  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const tagsRef = useRef(null);

  const [customTags, setCustomTags] = useState(() =>
    safeJson("forsaCustomTags", [])
  );

  useEffect(() => {
    const handleClick = (event) => {
      if (
        tagsRef.current &&
        !tagsRef.current.contains(event.target)
      ) {
        setTagsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () =>
      document.removeEventListener("mousedown", handleClick);
  }, []);

  const allTagOptions = useMemo(() => {
    return Array.from(
      new Set([...tagOptions, ...customTags])
    ).sort((a, b) => a.localeCompare(b));
  }, [customTags]);

  const filteredTags = useMemo(() => {
    const search = tagSearch.trim().toLowerCase();

    return allTagOptions.filter((tag) =>
      tag.toLowerCase().includes(search)
    );
  }, [allTagOptions, tagSearch]);

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((item) => item !== tag)
        : [...prev.tags, tag],
    }));
  };

  const addCustomTag = () => {
    const value = normalizeText(tagSearch);

    if (value.length < 2) return;

    const exists = allTagOptions.some(
      (tag) => tag.toLowerCase() === value.toLowerCase()
    );

    if (!exists) {
      const next = [...customTags, value];

      setCustomTags(next);
      localStorage.setItem(
        "forsaCustomTags",
        JSON.stringify(next)
      );
    }

    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(value)
        ? prev.tags
        : [...prev.tags, value],
    }));

    setTagSearch("");
    showToast(`Added tag: ${value}`, "info");
  };

  const updateQuestion = (index, value) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? value : q
      ),
    }));
  };

  const addQuestion = () => {
    if (form.questions.length >= 5) return;

    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, ""],
    }));
  };

  const removeQuestion = (index) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const applyTemplate = (template) => {
    setForm((prev) => ({
      ...prev,
      ...template.data,
      tags: Array.from(
        new Set([
          ...(prev.tags || []),
          ...(template.data.tags || []),
        ])
      ),
    }));

    showToast(`${template.label} template applied`, "info");
  };

  const qualityScore = useMemo(() => {
    let score = 0;

    if (form.title.trim().length >= 5) score += 20;
    if (form.company.trim()) score += 15;
    if (form.location.trim()) score += 10;
    if (form.pay.trim()) score += 10;
    if (form.description.trim().length >= 50) score += 20;
    if (form.requirements.trim()) score += 10;
    if (form.tags.length >= 2) score += 10;
    if (form.contact.trim()) score += 5;

    return Math.min(score, 100);
  }, [form]);

  const stepOneValid =
    form.title.trim() &&
    form.company.trim() &&
    form.location.trim();

  const stepTwoValid =
    form.category.trim() &&
    form.type.trim() &&
    form.pay.trim();

  const stepThreeValid =
    form.description.trim().length >= 20 &&
    form.contact.trim() &&
    form.tags.length > 0;

  const canPost =
    stepOneValid &&
    stepTwoValid &&
    stepThreeValid &&
    (!form.postSource.includes("Recruitment") ||
      (form.agencyName.trim() &&
        form.hiringFor.trim() &&
        form.workCountry.trim())) &&
    (form.postingMode !== "managed" ||
      !isForsaAdmin ||
      form.managedCompanyEmail.trim() ||
      form.managedCompanyPhone.trim());

  const goNext = () => {
    if (step === 1 && !stepOneValid) {
      showToast(
        "Add the opportunity title, company, and location.",
        "error"
      );
      return;
    }

    if (step === 2 && !stepTwoValid) {
      showToast(
        "Choose a category, type, and add the pay.",
        "error"
      );
      return;
    }

    setStep((prev) => Math.min(prev + 1, 3));
  };

  const goBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const notifyFollowers = async (post) => {
    const followers = safeJson(
      "forsaCompanyFollowers",
      []
    );

    const ownerEmail =
      post.ownerEmail ||
      post.contact ||
      account?.email ||
      "";

    const companyName =
      post.company ||
      account?.companyName ||
      account?.name ||
      "";

    const followerEmails = Array.from(
      new Set(
        followers
          .filter(
            (item) =>
              item.companyEmail === ownerEmail ||
              item.email === ownerEmail ||
              item.companyName === companyName ||
              item.name === companyName
          )
          .map(
            (item) =>
              item.seekerEmail ||
              item.userEmail ||
              item.followerEmail
          )
          .filter(Boolean)
      )
    );

    if (!followerEmails.length) return;

    try {
      await Promise.all(
        followerEmails.map((targetEmail) =>
          createNotification({
            type: "followed_company_post",
            title: `${companyName} posted a new opportunity`,
            text: `${post.title} · ${post.location}`,
            targetEmail,
            actionUrl: `/explore?post=${encodeURIComponent(
              post.id
            )}`,
            postId: post.id,
            company: companyName,
          })
        )
      );
    } catch (error) {
      console.error(
        "Follower notification error:",
        error
      );
    }
  };

  const handleSubmit = async () => {
    if (!canPost || posting) return;

    setPosting(true);

    try {
      const isManaged =
        isForsaAdmin &&
        form.postingMode === "managed";

      const cleanQuestions = form.questions
        .map((q) => q.trim())
        .filter(Boolean);

      const isAgency =
        form.postSource.includes("Recruitment");

      const newPost = {
        ownerUid: account?.uid || null,

        ownerEmail:
          account?.email ||
          form.contact.trim(),

        ownerName: isManaged
          ? "Forsa Jobs"
          : account?.name ||
            form.company.trim(),

        postingMode: isManaged
          ? "managed"
          : "company",

        managedByForsa: isManaged,

        managedBy: isManaged
          ? account?.email
          : null,

        managementStatus: isManaged
          ? "managed_unclaimed"
          : "owner_posted",

        companyClaimed: false,

        claimEmail: isManaged
          ? form.managedCompanyEmail
              .trim()
              .toLowerCase()
          : "",

        claimPhone: isManaged
          ? form.managedCompanyPhone.trim()
          : "",

        claimInstructions: isManaged
          ? "This post was added by Forsa Jobs. The real company can request ownership and edit it after admin approval."
          : "",

        postSource: form.postSource,

        isAgencyPost: isAgency,

        agencyName: form.agencyName.trim(),

        hiringFor: form.hiringFor.trim(),

        workCountry:
          form.workCountry.trim(),

        postedBy: isAgency
          ? form.agencyName.trim()
          : form.company.trim(),

        company: isAgency
          ? form.hiringFor.trim()
          : form.company.trim(),

        location:
          form.location.trim(),

        title:
          form.title.trim(),

        type: form.type,

        category:
          form.category.trim(),

        pay:
          form.pay.trim(),

        packageDetails:
          form.packageDetails.trim(),

        experience:
          form.experience.trim(),

        shift:
          form.shift.trim(),

        gender:
          form.gender.trim(),

        description:
          form.description.trim(),

        requirements:
          form.requirements.trim(),

        contact:
          form.contact.trim(),

        tags:
          form.tags || [],

        urgent:
          Boolean(form.urgent),

        featured:
          Boolean(form.featured),

        trusted: isManaged
          ? true
          : Boolean(account?.trusted),

        verified: isManaged
          ? true
          : Boolean(account?.verified),

        questions:
          cleanQuestions,

        reports: 0,
        views: 0,
        applications: 0,
        qualityScore,
      };

      const createdPost =
        await createPost(newPost);

      const saved = safeJson(
        "forsaPosts",
        []
      );

      localStorage.setItem(
        "forsaPosts",
        JSON.stringify([
          createdPost,
          ...saved,
        ])
      );

      await notifyFollowers(createdPost);

      showToast(
        "Opportunity published successfully"
      );

      navigate("/explore");
    } catch (error) {
      console.error("Post error:", error);

      showToast(
        "Could not publish opportunity. Try again.",
        "error"
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="min-h-screen bg-neutral-50">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                Create opportunity
              </span>

              <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-neutral-950 sm:text-4xl">
                Post a job in minutes.
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                Add the important information first. You can keep
                optional details simple.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Post quality
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-neutral-900">
                    {qualityScore >= 80
                      ? "Strong"
                      : qualityScore >= 55
                      ? "Good"
                      : "Needs details"}
                  </p>
                </div>

                <span className="text-xl font-bold text-[var(--forsa-primary)]">
                  {qualityScore}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-3 gap-1">
            <StepButton
              number="1"
              title="Basic info"
              active={step === 1}
              complete={step > 1}
              onClick={() => setStep(1)}
            />

            <StepButton
              number="2"
              title="Job details"
              active={step === 2}
              complete={step > 2}
              onClick={() =>
                stepOneValid && setStep(2)
              }
            />

            <StepButton
              number="3"
              title="Description"
              active={step === 3}
              complete={false}
              onClick={() =>
                stepOneValid &&
                stepTwoValid &&
                setStep(3)
              }
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
          <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
            {/* ADMIN */}
            {isForsaAdmin && (
              <AdminPostingSection
                form={form}
                updateForm={updateForm}
              />
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-7">
                <SectionIntro
                  eyebrow="Step 1"
                  title="What are you hiring for?"
                  text="Start with the information applicants need immediately."
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Opportunity title"
                    required
                    placeholder="e.g. Junior Frontend Developer"
                    value={form.title}
                    onChange={(value) =>
                      updateForm("title", value)
                    }
                  />

                  <Field
                    label="Company / organization"
                    required
                    placeholder="e.g. Cedars Tech"
                    value={form.company}
                    onChange={(value) =>
                      updateForm("company", value)
                    }
                  />
                </div>

                <Field
                  label="Work location"
                  required
                  placeholder="e.g. Beirut, Hamra / Remote"
                  value={form.location}
                  onChange={(value) =>
                    updateForm("location", value)
                  }
                  icon={<FaMapMarkerAlt />}
                />

                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-900">
                    Opportunity type
                  </label>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {typeOptions.map((type) => (
                      <ChoiceButton
                        key={type}
                        selected={form.type === type}
                        onClick={() =>
                          updateForm("type", type)
                        }
                      >
                        {type}
                      </ChoiceButton>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Quick templates
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.label}
                        type="button"
                        onClick={() =>
                          applyTemplate(template)
                        }
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-950"
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-7">
                <SectionIntro
                  eyebrow="Step 2"
                  title="Set the job details."
                  text="Give applicants a quick understanding of the role and offer."
                />

                <SelectField
                  label="Category"
                  required
                  value={form.category}
                  options={categoryOptions}
                  onChange={(value) =>
                    updateForm("category", value)
                  }
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Salary / pay"
                    required
                    placeholder="e.g. $500/month + tips"
                    value={form.pay}
                    onChange={(value) =>
                      updateForm("pay", value)
                    }
                  />

                  <Field
                    label="Package details"
                    optional
                    placeholder="e.g. Meals + transport"
                    value={form.packageDetails}
                    onChange={(value) =>
                      updateForm(
                        "packageDetails",
                        value
                      )
                    }
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <SelectField
                    label="Experience"
                    value={form.experience}
                    options={experienceOptions}
                    onChange={(value) =>
                      updateForm(
                        "experience",
                        value
                      )
                    }
                  />

                  <SelectField
                    label="Schedule"
                    value={form.shift}
                    options={shiftOptions}
                    onChange={(value) =>
                      updateForm("shift", value)
                    }
                  />

                  <SelectField
                    label="Gender"
                    value={form.gender}
                    options={genderOptions}
                    onChange={(value) =>
                      updateForm("gender", value)
                    }
                  />
                </div>

                <TagPicker
                  form={form}
                  tagsOpen={tagsOpen}
                  setTagsOpen={setTagsOpen}
                  tagSearch={tagSearch}
                  setTagSearch={setTagSearch}
                  tagsRef={tagsRef}
                  filteredTags={filteredTags}
                  allTagOptions={allTagOptions}
                  toggleTag={toggleTag}
                  addCustomTag={addCustomTag}
                />
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-7">
                <SectionIntro
                  eyebrow="Step 3"
                  title="Describe the opportunity."
                  text="Write enough for someone to understand the role without overthinking it."
                />

                <div>
                  <FieldLabel
                    label="Job description"
                    required
                  />

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      updateForm(
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="What will the person do? What does a normal day look like?"
                    className="min-h-44 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3.5 text-sm font-medium leading-6 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white"
                  />

                  <div className="mt-2 flex justify-between px-1 text-[11px] font-semibold text-neutral-400">
                    <span>
                      Keep it clear and specific.
                    </span>

                    <span>
                      {form.description.trim().length} characters
                    </span>
                  </div>
                </div>

                <div>
                  <FieldLabel
                    label="Requirements"
                    optional
                  />

                  <textarea
                    value={form.requirements}
                    onChange={(e) =>
                      updateForm(
                        "requirements",
                        e.target.value
                      )
                    }
                    placeholder="Skills, education, experience, languages, or anything important."
                    className="min-h-32 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3.5 text-sm font-medium leading-6 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white"
                  />
                </div>

                <Field
                  label="Contact / CV destination"
                  required
                  placeholder="WhatsApp number or email"
                  value={form.contact}
                  onChange={(value) =>
                    updateForm("contact", value)
                  }
                />

                <ApplicationQuestions
                  form={form}
                  updateQuestion={updateQuestion}
                  addQuestion={addQuestion}
                  removeQuestion={removeQuestion}
                />

                {form.postSource.includes(
                  "Recruitment"
                ) && (
                  <AgencySection
                    form={form}
                    updateForm={updateForm}
                  />
                )}

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-start gap-3">
                    <FaShieldAlt className="mt-0.5 text-[var(--forsa-primary)]" />

                    <div>
                      <p className="text-sm font-bold text-neutral-900">
                        Before publishing
                      </p>

                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Make sure the company, salary,
                        location, and contact information
                        are accurate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom navigation */}
            <div className="mt-8 flex items-center justify-between border-t border-neutral-100 pt-5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-950"
                >
                  <FaUndo className="text-xs" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="forsa-button inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
                >
                  Continue
                  <FaArrowRight className="text-xs" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canPost || posting}
                  onClick={handleSubmit}
                  className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition ${
                    canPost && !posting
                      ? "forsa-button text-white shadow-sm hover:brightness-110"
                      : "cursor-not-allowed border border-neutral-200 bg-neutral-100 text-neutral-400"
                  }`}
                >
                  {posting
                    ? "Publishing..."
                    : "Publish Opportunity"}
                </button>
              )}
            </div>

            {!canPost && step === 3 && (
              <p className="mt-3 text-right text-xs font-semibold text-neutral-400">
                Complete the required fields before publishing.
              </p>
            )}
          </div>

          {/* Preview */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <PreviewCard
                form={form}
                qualityScore={qualityScore}
              />

              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Posting checklist
                </p>

                <div className="mt-3 space-y-2">
                  <CheckLine
                    active={Boolean(form.title.trim())}
                    text="Clear title"
                  />

                  <CheckLine
                    active={Boolean(form.location.trim())}
                    text="Location added"
                  />

                  <CheckLine
                    active={Boolean(form.pay.trim())}
                    text="Pay added"
                  />

                  <CheckLine
                    active={form.tags.length > 0}
                    text="Relevant tags"
                  />

                  <CheckLine
                    active={
                      form.description.trim()
                        .length >= 20
                    }
                    text="Description"
                  />

                  <CheckLine
                    active={Boolean(form.contact.trim())}
                    text="Contact information"
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function SectionIntro({ eyebrow, title, text }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--forsa-primary)]">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-neutral-950">
        {title}
      </h2>

      <p className="mt-1.5 text-sm leading-6 text-neutral-500">
        {text}
      </p>
    </div>
  );
}

function StepButton({
  number,
  title,
  active,
  complete,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition ${
        active
          ? "bg-[#6A29D1] text-white"
          : "text-neutral-500 hover:bg-neutral-50"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
          active
            ? "bg-white text-neutral-950"
            : complete
            ? "bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
            : "bg-neutral-100 text-neutral-400"
        }`}
      >
        {complete ? <FaCheck /> : number}
      </span>

      <span className="text-xs font-bold sm:text-sm">
        {title}
      </span>
    </button>
  );
}

function FieldLabel({ label, required, optional }) {
  return (
    <label className="mb-2 block text-sm font-bold text-neutral-900">
      {label}

      {required && (
        <span className="ml-1 text-[var(--forsa-primary)]">
          *
        </span>
      )}

      {optional && (
        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Optional
        </span>
      )}
    </label>
  );
}

function Field({
  label,
  required,
  optional,
  placeholder,
  value,
  onChange,
  icon,
}) {
  return (
    <div>
      <FieldLabel
        label={label}
        required={required}
        optional={optional}
      />

      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
            {icon}
          </span>
        )}

        <input
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3.5 text-sm font-medium text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white ${
            icon ? "pl-10" : ""
          }`}
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  required,
  value,
  options,
  onChange,
}) {
  return (
    <div>
      <FieldLabel
        label={label}
        required={required}
      />

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full appearance-none rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3.5 text-sm font-semibold text-neutral-800 outline-none transition focus:border-neutral-950 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${
        selected
          ? "border-[var(--forsa-primary)] bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950"
      }`}
    >
      {children}
    </button>
  );
}

function TagPicker({
  form,
  tagsOpen,
  setTagsOpen,
  tagSearch,
  setTagSearch,
  tagsRef,
  filteredTags,
  allTagOptions,
  toggleTag,
  addCustomTag,
}) {
  const canAdd =
    tagSearch.trim().length >= 2 &&
    !allTagOptions.some(
      (tag) =>
        tag.toLowerCase() ===
        tagSearch.trim().toLowerCase()
    );

  return (
    <div ref={tagsRef}>
      <FieldLabel
        label="Skills / tags"
        required
      />

      <button
        type="button"
        onClick={() =>
          setTagsOpen((prev) => !prev)
        }
        className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3.5 text-left text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-white"
      >
        <span className="flex items-center gap-2">
          <FaTag className="text-xs text-neutral-400" />

          {form.tags.length
            ? `${form.tags.length} tag${
                form.tags.length === 1
                  ? ""
                  : "s"
              } selected`
            : "Select relevant skills"}
        </span>

        <FaChevronDown
          className={`text-xs text-neutral-400 transition ${
            tagsOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {tagsOpen && (
        <div className="relative z-30 mt-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <FaSearch className="text-xs text-neutral-400" />

            <input
              autoFocus
              value={tagSearch}
              onChange={(e) =>
                setTagSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  canAdd
                ) {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
              placeholder="Search or add a skill..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {canAdd && (
            <button
              type="button"
              onClick={addCustomTag}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--forsa-primary)] bg-[var(--forsa-bg-soft)] px-3 py-2.5 text-xs font-bold text-[var(--forsa-primary)]"
            >
              <FaPlus />
              Add "{tagSearch.trim()}"
            </button>
          )}

          <div className="mt-2 max-h-56 overflow-y-auto">
            {filteredTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  toggleTag(tag)
                }
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
              >
                {tag}

                {form.tags.includes(tag) && (
                  <FaCheck className="text-xs text-[var(--forsa-primary)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {form.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {form.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() =>
                toggleTag(tag)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 transition hover:border-red-200 hover:text-red-600"
            >
              {tag}
              <FaTimes className="text-[9px]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationQuestions({
  form,
  updateQuestion,
  addQuestion,
  removeQuestion,
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-neutral-900">
            Application questions
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Optional
            </span>
          </p>

          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Ask something specific before applicants apply.
          </p>
        </div>

        <button
          type="button"
          onClick={addQuestion}
          disabled={form.questions.length >= 5}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 transition hover:border-neutral-400 disabled:opacity-40"
        >
          + Add
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {form.questions.map(
          (question, index) => (
            <div
              key={index}
              className="flex gap-2"
            >
              <input
                value={question}
                onChange={(e) =>
                  updateQuestion(
                    index,
                    e.target.value
                  )
                }
                placeholder={`Question ${
                  index + 1
                }`}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-neutral-950"
              />

              {form.questions.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeQuestion(index)
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-400 hover:border-red-200 hover:text-red-600"
                >
                  <FaTrash className="text-xs" />
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function AdminPostingSection({
  form,
  updateForm,
}) {
  const managed =
    form.postingMode === "managed";

  return (
    <div className="mb-8 rounded-[24px] border border-violet-100 bg-violet-50/40 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--forsa-primary)] shadow-sm">
          <FaShieldAlt />
        </div>

        <div>
          <p className="text-sm font-bold text-neutral-950">
            Admin posting
          </p>

          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Publish normally under the company account,
            or add an opportunity collected by Forsa.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ChoiceButton
          selected={!managed}
          onClick={() =>
            updateForm(
              "postingMode",
              "company"
            )
          }
        >
          Company-owned post
        </ChoiceButton>

        <ChoiceButton
          selected={managed}
          onClick={() =>
            updateForm(
              "postingMode",
              "managed"
            )
          }
        >
          Managed by Forsa
        </ChoiceButton>
      </div>

      {managed && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Company claim email"
            placeholder="manager@company.com"
            value={
              form.managedCompanyEmail
            }
            onChange={(value) =>
              updateForm(
                "managedCompanyEmail",
                value
              )
            }
          />

          <Field
            label="Company claim phone"
            placeholder="70582107"
            value={
              form.managedCompanyPhone
            }
            onChange={(value) =>
              updateForm(
                "managedCompanyPhone",
                value
              )
            }
          />
        </div>
      )}
    </div>
  );
}

function AgencySection({
  form,
  updateForm,
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-bold text-amber-900">
        Recruitment / agency information
      </p>

      <p className="mt-1 text-xs leading-5 text-amber-800">
        Add the agency and actual employer so applicants
        can understand who is recruiting and where the job
        is located.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field
          label="Agency / office"
          required
          placeholder="Recruitment office"
          value={form.agencyName}
          onChange={(value) =>
            updateForm(
              "agencyName",
              value
            )
          }
        />

        <Field
          label="Employer"
          required
          placeholder="Actual company"
          value={form.hiringFor}
          onChange={(value) => {
            updateForm(
              "hiringFor",
              value
            );

            updateForm(
              "company",
              value
            );
          }}
        />

        <SelectField
          label="Work country"
          value={form.workCountry}
          options={workCountryOptions}
          onChange={(value) =>
            updateForm(
              "workCountry",
              value
            )
          }
        />
      </div>
    </div>
  );
}

function PreviewCard({
  form,
  qualityScore,
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Live preview
        </p>

        <span className="text-xs font-bold text-[var(--forsa-primary)]">
          {qualityScore}%
        </span>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl forsa-button text-white">
            <FaBriefcase className="text-sm" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-neutral-950">
              {form.title ||
                "Your opportunity title"}
            </h3>

            <p className="mt-1 truncate text-xs font-semibold text-neutral-400">
              {form.company ||
                "Company"}{" "}
              ·{" "}
              {form.location ||
                "Location"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <PreviewPill>
            {form.type}
          </PreviewPill>

          <PreviewPill>
            {form.category}
          </PreviewPill>

          {form.pay && (
            <PreviewPill>
              {form.pay}
            </PreviewPill>
          )}

          {form.experience && (
            <PreviewPill>
              {form.experience}
            </PreviewPill>
          )}
        </div>

        <p className="mt-4 line-clamp-5 text-xs leading-5 text-neutral-500">
          {form.description ||
            "Your job description will appear here as you write it."}
        </p>

        {form.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-neutral-200 pt-3">
            {form.tags
              .slice(0, 5)
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[10px] font-bold text-neutral-600"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewPill({ children }) {
  return (
    <span className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[10px] font-bold text-neutral-600">
      {children}
    </span>
  );
}

function CheckLine({ active, text }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-md text-[8px] ${
          active
            ? "bg-[var(--forsa-primary)] text-white"
            : "border border-neutral-200 bg-white text-transparent"
        }`}
      >
        <FaCheck />
      </span>

      <span
        className={`text-xs font-semibold ${
          active
            ? "text-neutral-700"
            : "text-neutral-400"
        }`}
      >
        {text}
      </span>
    </div>
  );
}
