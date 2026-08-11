import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";

const ADMIN_EMAIL = "support.forsa@gmail.com";

const stages = [
  "New",
  "Contacted",
  "Replied",
  "Interested",
  "Job requested",
  "Job posted",
  "Active relationship",
  "No response",
  "Not interested",
  "Bad lead",
  "Lost",
];

const priorities = ["Low", "Medium", "High"];

const jobTypes = [
  "Full-time",
  "Part-time",
  "Internship",
  "Contract",
  "Temporary",
  "Remote",
  "Unknown",
];

const contactMethods = [
  "WhatsApp",
  "Phone",
  "Email",
  "LinkedIn",
  "Instagram",
  "Meeting",
];

const contactResults = [
  "No response",
  "Replied",
  "Interested",
  "Asked for details",
  "Job requested",
  "Not interested",
];

const emptyForm = {
  // Company
  companyName: "",
  industry: "",
  location: "",
  website: "",
  linkedin: "",

  // Hiring opportunity
  jobTitle: "",
  jobType: "Unknown",
  openings: 1,
  source: "",
  sourceUrl: "",

  // Contact
  contactName: "",
  contactRole: "",
  email: "",
  phone: "",
  preferredContact: "LinkedIn",

  // Pipeline
  stage: "New",
  priority: "Medium",
  nextFollowUpAt: "",
  nextAction: "",

  // Notes
  notes: "",
};

const emptyContactForm = {
  method: "WhatsApp",
  result: "No response",
  notes: "",
};

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function timestampToDate(value) {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = timestampToDate(value);

  if (!date) return "-";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  const date = timestampToDate(value);

  if (!date) return "-";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isFollowUpDue(value) {
  if (!value) return false;

  const date = new Date(`${value}T23:59:59`);

  if (Number.isNaN(date.getTime())) return false;

  return date <= new Date();
}

function getStageClass(stage) {
  if (
    stage === "Interested" ||
    stage === "Job requested"
  ) {
    return "bg-green-50 text-green-700";
  }

  if (
    stage === "Job posted" ||
    stage === "Active relationship"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    stage === "Contacted" ||
    stage === "Replied"
  ) {
    return "bg-violet-50 text-violet-700";
  }

  if (
    stage === "No response" ||
    stage === "Not interested" ||
    stage === "Bad lead" ||
    stage === "Lost"
  ) {
    return "bg-red-50 text-red-600";
  }

  return "bg-gray-100 text-gray-600";
}

function getPriorityClass(priority) {
  if (priority === "High") {
    return "bg-red-50 text-red-600";
  }

  if (priority === "Low") {
    return "bg-gray-100 text-gray-500";
  }

  return "bg-amber-50 text-amber-700";
}

function isClosedStage(stage) {
  return [
    "Job posted",
    "Active relationship",
    "Not interested",
    "Bad lead",
    "Lost",
  ].includes(stage);
}

export default function AdminOutreach() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [contactLead, setContactLead] = useState(null);
  const [contactForm, setContactForm] =
    useState(emptyContactForm);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);

    try {
      const q = query(
        collection(db, "outreachLeads"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setLeads(data);
    } catch (error) {
      console.error("Fetch outreach leads error:", error);

      // If old records don't have createdAt, Firestore can fail.
      // Fall back to an unordered query.
      try {
        const fallbackSnapshot = await getDocs(
          collection(db, "outreachLeads")
        );

        const fallbackData = fallbackSnapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data(),
          })
        );

        setLeads(fallbackData);
      } catch (fallbackError) {
        console.error(
          "Fallback fetch error:",
          fallbackError
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      user?.email?.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()
    ) {
      fetchLeads();
    }
  }, [user]);

  const filteredLeads = useMemo(() => {
    const q = normalize(search);

    return leads.filter((lead) => {
      const searchableFields = [
        lead.companyName,
        lead.industry,
        lead.location,
        lead.website,
        lead.linkedin,
        lead.jobTitle,
        lead.jobType,
        lead.source,
        lead.contactName,
        lead.contactRole,
        lead.email,
        lead.phone,
        lead.notes,
        lead.nextAction,
      ];

      const matchesSearch =
        !q ||
        searchableFields.some((value) =>
          normalize(value).includes(q)
        );

      const matchesStage =
        stageFilter === "All" ||
        lead.stage === stageFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        lead.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStage &&
        matchesPriority
      );
    });
  }, [
    leads,
    search,
    stageFilter,
    priorityFilter,
  ]);

  const stats = useMemo(() => {
    return {
      prospects: leads.filter(
        (lead) =>
          ![
            "Bad lead",
            "Lost",
            "Not interested",
          ].includes(lead.stage)
      ).length,

      contacted: leads.filter(
        (lead) =>
          (lead.contactAttempts || 0) > 0 ||
          [
            "Contacted",
            "Replied",
            "Interested",
            "Job requested",
            "Job posted",
            "Active relationship",
          ].includes(lead.stage)
      ).length,

      replied: leads.filter((lead) =>
        [
          "Replied",
          "Interested",
          "Job requested",
          "Job posted",
          "Active relationship",
        ].includes(lead.stage)
      ).length,

      interested: leads.filter((lead) =>
        [
          "Interested",
          "Job requested",
        ].includes(lead.stage)
      ).length,

      jobs: leads.filter((lead) =>
        [
          "Job requested",
          "Job posted",
        ].includes(lead.stage)
      ).length,

      posted: leads.filter(
        (lead) => lead.stage === "Job posted"
      ).length,

      followUps: leads.filter(
        (lead) =>
          lead.nextFollowUpAt &&
          isFollowUpDue(lead.nextFollowUpAt) &&
          !isClosedStage(lead.stage)
      ).length,
    };
  }, [leads]);

  const todayActions = useMemo(() => {
    return leads
      .filter((lead) => {
        if (!lead.nextFollowUpAt) return false;

        return (
          isFollowUpDue(lead.nextFollowUpAt) &&
          !isClosedStage(lead.stage)
        );
      })
      .sort((a, b) =>
        String(a.nextFollowUpAt).localeCompare(
          String(b.nextFollowUpAt)
        )
      )
      .slice(0, 10);
  }, [leads]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.companyName.trim()) {
      alert("Company name is required.");
      return;
    }

    if (!form.jobTitle.trim()) {
      alert("Job title is required.");
      return;
    }

    try {
      const payload = {
        companyName: form.companyName.trim(),
        industry: form.industry.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
        linkedin: form.linkedin.trim(),

        jobTitle: form.jobTitle.trim(),
        jobType: form.jobType,
        openings:
          Number(form.openings) > 0
            ? Number(form.openings)
            : 1,
        source: form.source.trim(),
        sourceUrl: form.sourceUrl.trim(),

        contactName: form.contactName.trim(),
        contactRole: form.contactRole.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        preferredContact: form.preferredContact,

        stage: form.stage,
        priority: form.priority,
        nextFollowUpAt: form.nextFollowUpAt,
        nextAction: form.nextAction.trim(),

        notes: form.notes.trim(),

        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
          doc(db, "outreachLeads", editingId),
          payload
        );
      } else {
        await addDoc(
          collection(db, "outreachLeads"),
          {
            ...payload,
            contactAttempts: 0,
            lastResponse: "",
            lastContactedAt: null,
            contactHistory: [],
            createdAt: serverTimestamp(),
          }
        );
      }

      resetForm();
      await fetchLeads();
    } catch (error) {
      console.error(
        "Save outreach lead error:",
        error
      );

      alert(
        error.message ||
          "Could not save outreach lead."
      );
    }
  };

  const startEdit = (lead) => {
    setEditingId(lead.id);

    setForm({
      companyName: lead.companyName || "",
      industry: lead.industry || "",
      location: lead.location || "",
      website: lead.website || "",
      linkedin: lead.linkedin || "",

      jobTitle: lead.jobTitle || "",
      jobType: lead.jobType || "Unknown",
      openings: lead.openings || 1,
      source: lead.source || "",
      sourceUrl: lead.sourceUrl || "",

      contactName: lead.contactName || "",
      contactRole: lead.contactRole || "",
      email: lead.email || "",
      phone: lead.phone || "",
      preferredContact:
        lead.preferredContact || "LinkedIn",

      stage: lead.stage || "New",
      priority: lead.priority || "Medium",
      nextFollowUpAt:
        lead.nextFollowUpAt || "",
      nextAction: lead.nextAction || "",

      notes: lead.notes || "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const updateLead = async (id, updates) => {
    try {
      await updateDoc(
        doc(db, "outreachLeads", id),
        {
          ...updates,
          updatedAt: serverTimestamp(),
        }
      );

      await fetchLeads();
    } catch (error) {
      console.error(
        "Update lead error:",
        error
      );

      alert(
        error.message ||
          "Could not update lead."
      );
    }
  };

  const changeStage = async (lead, stage) => {
    await updateLead(lead.id, {
      stage,
    });
  };

  const openContact = (lead) => {
    setContactLead(lead);

    setContactForm({
      method:
        lead.preferredContact &&
        contactMethods.includes(
          lead.preferredContact
        )
          ? lead.preferredContact
          : "WhatsApp",
      result: "No response",
      notes: "",
    });
  };

  const logContact = async (event) => {
    event.preventDefault();

    if (!contactLead) return;

    const now = new Date().toISOString();

    const historyItem = {
      id: Date.now(),
      method: contactForm.method,
      result: contactForm.result,
      notes: contactForm.notes.trim(),
      createdAt: now,
    };

    let nextStage = contactLead.stage || "New";

    if (contactForm.result === "Interested") {
      nextStage = "Interested";
    }

    if (contactForm.result === "Job requested") {
      nextStage = "Job requested";
    }

    if (contactForm.result === "Replied") {
      nextStage = "Replied";
    }

    if (
      contactForm.result === "Asked for details"
    ) {
      nextStage = "Replied";
    }

    if (
      contactForm.result === "Not interested"
    ) {
      nextStage = "Not interested";
    }

    if (
      contactForm.result === "No response"
    ) {
      const attempts =
        (contactLead.contactAttempts || 0) + 1;

      if (attempts >= 3) {
        nextStage = "No response";
      } else if (
        contactLead.stage === "New"
      ) {
        nextStage = "Contacted";
      }
    }

    if (
      contactForm.result === "Replied" &&
      [
        "Interested",
        "Job requested",
        "Job posted",
        "Active relationship",
      ].includes(contactLead.stage)
    ) {
      nextStage = contactLead.stage;
    }

    try {
      await updateDoc(
        doc(
          db,
          "outreachLeads",
          contactLead.id
        ),
        {
          contactAttempts:
            (contactLead.contactAttempts || 0) +
            1,

          lastContactedAt: now,

          lastResponse:
            contactForm.result,

          stage: nextStage,

          contactHistory:
            arrayUnion(historyItem),

          updatedAt: serverTimestamp(),
        }
      );

      setContactLead(null);
      setContactForm({
        ...emptyContactForm,
      });

      await fetchLeads();
    } catch (error) {
      console.error(
        "Log contact error:",
        error
      );

      alert(
        error.message ||
          "Could not log contact."
      );
    }
  };

  const markJobPosted = async (lead) => {
    await updateLead(lead.id, {
      stage: "Job posted",
    });
  };

  const removeLead = async (lead) => {
    const confirmed = window.confirm(
      `Delete ${
        lead.companyName || "this company"
      }?`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(
          db,
          "outreachLeads",
          lead.id
        )
      );

      await fetchLeads();
    } catch (error) {
      console.error(
        "Delete lead error:",
        error
      );

      alert(
        error.message ||
          "Could not delete lead."
      );
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Loading...
        </p>
      </div>
    );
  }

  if (
    !user ||
    user.email?.toLowerCase() !==
      ADMIN_EMAIL.toLowerCase()
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl border bg-white px-6 py-5 text-center shadow-sm">
          <p className="font-semibold text-gray-900">
            Access denied
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {user?.email ||
              "No authenticated account"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-7 text-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Forsa
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Outreach
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Find employers, contact them, and turn
              vacancies into Forsa jobs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
          >
            {showForm
              ? "Close"
              : "Add company"}
          </button>
        </header>

        {/* METRICS */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Metric
            label="Prospects"
            value={stats.prospects}
          />

          <Metric
            label="Contacted"
            value={stats.contacted}
          />

          <Metric
            label="Replied"
            value={stats.replied}
          />

          <Metric
            label="Interested"
            value={stats.interested}
          />

          <Metric
            label="Jobs"
            value={stats.jobs}
          />

          <Metric
            label="Posted"
            value={stats.posted}
          />

          <Metric
            label="Follow-ups"
            value={stats.followUps}
          />
        </section>

        {/* TODAY'S ACTIONS */}
        {todayActions.length > 0 && (
          <section className="mt-5 rounded-xl border bg-white">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">
                Today's actions
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Companies that need attention.
              </p>
            </div>

            <div className="divide-y">
              {todayActions.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {lead.companyName}
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      {lead.jobTitle} ·{" "}
                      {lead.stage}
                    </p>

                    {lead.nextAction && (
                      <p className="mt-1 text-xs text-purple-600">
                        Next:{" "}
                        {lead.nextAction}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openContact(lead)
                      }
                      className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white"
                    >
                      Contact
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        startEdit(lead)
                      }
                      className="rounded-lg border px-3 py-2 text-xs font-medium text-gray-700"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ADD / EDIT FORM */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-5 rounded-xl border bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  {editingId
                    ? "Edit company"
                    : "Add company"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Only enter information you actually
                  know. Everything else can stay blank.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-3">
              {/* COMPANY */}
              <FormSection title="Company">
                <Input
                  label="Company name"
                  value={form.companyName}
                  onChange={(value) =>
                    updateForm(
                      "companyName",
                      value
                    )
                  }
                  placeholder="e.g. Valsoft Corporation"
                  required
                />

                <Input
                  label="Industry"
                  value={form.industry}
                  onChange={(value) =>
                    updateForm(
                      "industry",
                      value
                    )
                  }
                  placeholder="e.g. Software"
                />

                <Input
                  label="Location"
                  value={form.location}
                  onChange={(value) =>
                    updateForm(
                      "location",
                      value
                    )
                  }
                  placeholder="e.g. Lebanon"
                />

                <Input
                  label="Website"
                  value={form.website}
                  onChange={(value) =>
                    updateForm(
                      "website",
                      value
                    )
                  }
                  placeholder="https://..."
                />

                <Input
                  label="LinkedIn"
                  value={form.linkedin}
                  onChange={(value) =>
                    updateForm(
                      "linkedin",
                      value
                    )
                  }
                  placeholder="Company LinkedIn URL"
                />
              </FormSection>

              {/* HIRING */}
              <FormSection title="Hiring opportunity">
                <Input
                  label="Job title"
                  value={form.jobTitle}
                  onChange={(value) =>
                    updateForm(
                      "jobTitle",
                      value
                    )
                  }
                  placeholder="e.g. Customer Support Specialist"
                  required
                />

                <Select
                  label="Job type"
                  value={form.jobType}
                  onChange={(value) =>
                    updateForm(
                      "jobType",
                      value
                    )
                  }
                  options={jobTypes}
                />

                <Input
                  label="Openings"
                  type="number"
                  min="1"
                  value={form.openings}
                  onChange={(value) =>
                    updateForm(
                      "openings",
                      value
                    )
                  }
                />

                <Input
                  label="Source"
                  value={form.source}
                  onChange={(value) =>
                    updateForm(
                      "source",
                      value
                    )
                  }
                  placeholder="Bayt, LinkedIn, Instagram..."
                />

                <Input
                  label="Source URL"
                  value={form.sourceUrl}
                  onChange={(value) =>
                    updateForm(
                      "sourceUrl",
                      value
                    )
                  }
                  placeholder="Job posting URL"
                />
              </FormSection>

              {/* CONTACT */}
              <FormSection title="Contact">
                <Input
                  label="Contact name"
                  value={form.contactName}
                  onChange={(value) =>
                    updateForm(
                      "contactName",
                      value
                    )
                  }
                  placeholder="Leave blank if unknown"
                />

                <Input
                  label="Contact role"
                  value={form.contactRole}
                  onChange={(value) =>
                    updateForm(
                      "contactRole",
                      value
                    )
                  }
                  placeholder="HR Manager, Recruiter..."
                />

                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    updateForm(
                      "email",
                      value
                    )
                  }
                  placeholder="Leave blank if unknown"
                />

                <Input
                  label="Phone / WhatsApp"
                  value={form.phone}
                  onChange={(value) =>
                    updateForm(
                      "phone",
                      value
                    )
                  }
                  placeholder="Leave blank if unknown"
                />

                <Select
                  label="Preferred contact"
                  value={form.preferredContact}
                  onChange={(value) =>
                    updateForm(
                      "preferredContact",
                      value
                    )
                  }
                  options={contactMethods}
                />
              </FormSection>
            </div>

            {/* PIPELINE */}
            <div className="mt-6 grid gap-6 border-t pt-6 lg:grid-cols-3">
              <FormSection title="Pipeline">
                <Select
                  label="Stage"
                  value={form.stage}
                  onChange={(value) =>
                    updateForm(
                      "stage",
                      value
                    )
                  }
                  options={stages}
                />

                <Select
                  label="Priority"
                  value={form.priority}
                  onChange={(value) =>
                    updateForm(
                      "priority",
                      value
                    )
                  }
                  options={priorities}
                />

                <Input
                  label="Next follow-up"
                  type="date"
                  value={
                    form.nextFollowUpAt
                  }
                  onChange={(value) =>
                    updateForm(
                      "nextFollowUpAt",
                      value
                    )
                  }
                />

                <Input
                  label="Next action"
                  value={form.nextAction}
                  onChange={(value) =>
                    updateForm(
                      "nextAction",
                      value
                    )
                  }
                  placeholder="Find HR contact, send message..."
                />
              </FormSection>

              {/* NOTES */}
              <FormSection title="Notes">
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    updateForm(
                      "notes",
                      event.target.value
                    )
                  }
                  placeholder="Useful information about the company, vacancy, or outreach..."
                  className="min-h-40 w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple-400"
                />
              </FormSection>

              {/* SIMPLE GUIDE */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  What to enter
                </h3>

                <div className="mt-3 rounded-lg bg-gray-50 p-4 text-xs leading-5 text-gray-600">
                  <p>
                    <strong>New:</strong> You found a
                    company/job.
                  </p>

                  <p className="mt-2">
                    <strong>Contacted:</strong> You
                    contacted them.
                  </p>

                  <p className="mt-2">
                    <strong>Replied:</strong> They
                    responded.
                  </p>

                  <p className="mt-2">
                    <strong>Interested:</strong> They
                    are interested in Forsa.
                  </p>

                  <p className="mt-2">
                    <strong>Job requested:</strong>{" "}
                    They gave/requested a vacancy.
                  </p>

                  <p className="mt-2">
                    <strong>Job posted:</strong> The
                    vacancy is live on Forsa.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t pt-5">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
              >
                {editingId
                  ? "Save changes"
                  : "Add company"}
              </button>
            </div>
          </form>
        )}

        {/* SEARCH / FILTERS */}
        <section className="mt-5 rounded-xl border bg-white">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search companies, jobs, contacts..."
              className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-purple-400"
            />

            <select
              value={stageFilter}
              onChange={(event) =>
                setStageFilter(
                  event.target.value
                )
              }
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none"
            >
              <option value="All">
                All stages
              </option>

              {stages.map((stage) => (
                <option
                  key={stage}
                  value={stage}
                >
                  {stage}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value
                )
              }
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none"
            >
              <option value="All">
                All priorities
              </option>

              {priorities.map((priority) => (
                <option
                  key={priority}
                  value={priority}
                >
                  {priority}
                </option>
              ))}
            </select>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    Company
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Job
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Contact
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Stage
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Priority
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Follow-up
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Attempts
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Source
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => {
                  const followUpDue =
                    lead.nextFollowUpAt &&
                    isFollowUpDue(
                      lead.nextFollowUpAt
                    );

                  return (
                    <tr
                      key={lead.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      {/* COMPANY */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {lead.companyName ||
                            "-"}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {lead.location ||
                            lead.industry ||
                            "-"}
                        </p>
                      </td>

                      {/* JOB */}
                      <td className="px-4 py-3">
                        <p className="text-gray-800">
                          {lead.jobTitle ||
                            "-"}
                        </p>

                        <div className="mt-1 flex gap-2">
                          {lead.jobType && (
                            <span className="text-xs text-gray-500">
                              {lead.jobType}
                            </span>
                          )}

                          {lead.openings && (
                            <span className="text-xs text-gray-400">
                              ·{" "}
                              {lead.openings}{" "}
                              opening
                              {lead.openings !==
                              1
                                ? "s"
                                : ""}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CONTACT */}
                      <td className="px-4 py-3">
                        <p className="text-gray-800">
                          {lead.contactName ||
                            "No contact"}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {lead.contactRole ||
                            lead.email ||
                            lead.phone ||
                            "-"}
                        </p>
                      </td>

                      {/* STAGE */}
                      <td className="px-4 py-3">
                        <select
                          value={
                            lead.stage ||
                            "New"
                          }
                          onChange={(event) =>
                            changeStage(
                              lead,
                              event.target
                                .value
                            )
                          }
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${getStageClass(
                            lead.stage
                          )}`}
                        >
                          {stages.map(
                            (stage) => (
                              <option
                                key={stage}
                                value={stage}
                              >
                                {stage}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      {/* PRIORITY */}
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityClass(
                            lead.priority
                          )}`}
                        >
                          {lead.priority ||
                            "Medium"}
                        </span>
                      </td>

                      {/* FOLLOW UP */}
                      <td className="px-4 py-3">
                        <span
                          className={
                            followUpDue
                              ? "font-medium text-red-600"
                              : "text-gray-600"
                          }
                        >
                          {lead.nextFollowUpAt
                            ? formatDate(
                                lead.nextFollowUpAt
                              )
                            : "-"}
                        </span>
                      </td>

                      {/* ATTEMPTS */}
                      <td className="px-4 py-3 text-gray-600">
                        {lead.contactAttempts ||
                          0}
                      </td>

                      {/* SOURCE */}
                      <td className="px-4 py-3">
                        {lead.sourceUrl ? (
                          <a
                            href={
                              lead.sourceUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-purple-600 hover:underline"
                          >
                            {lead.source ||
                              "View source"}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {lead.source ||
                              "-"}
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openContact(
                                lead
                              )
                            }
                            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
                          >
                            Contact
                          </button>

                          {lead.stage ===
                            "Job requested" && (
                            <button
                              type="button"
                              onClick={() =>
                                markJobPosted(
                                  lead
                                )
                              }
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white"
                            >
                              Posted
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              startEdit(
                                lead
                              )
                            }
                            className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeLead(
                                lead
                              )
                            }
                            className="px-1 text-xs text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading &&
                  filteredLeads.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-4 py-12 text-center text-sm text-gray-500"
                      >
                        No companies found.
                      </td>
                    </tr>
                  )}

                {loading && (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* CONTACT MODAL */}
        {contactLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <form
              onSubmit={logContact}
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                    Log contact
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    {contactLead.companyName}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {contactLead.jobTitle}
                  </p>

                  {contactLead.contactName && (
                    <p className="mt-1 text-xs text-gray-500">
                      Contact:{" "}
                      {
                        contactLead.contactName
                      }
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setContactLead(null)
                  }
                  className="text-xl text-gray-400 hover:text-gray-900"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                <Select
                  label="Method"
                  value={
                    contactForm.method
                  }
                  onChange={(value) =>
                    setContactForm(
                      (current) => ({
                        ...current,
                        method: value,
                      })
                    )
                  }
                  options={contactMethods}
                />

                <Select
                  label="Result"
                  value={
                    contactForm.result
                  }
                  onChange={(value) =>
                    setContactForm(
                      (current) => ({
                        ...current,
                        result: value,
                      })
                    )
                  }
                  options={contactResults}
                />

                <textarea
                  value={
                    contactForm.notes
                  }
                  onChange={(event) =>
                    setContactForm(
                      (current) => ({
                        ...current,
                        notes:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="What happened? Example: Sent WhatsApp message to HR asking if they want to post the vacancy on Forsa."
                  className="min-h-28 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple-400"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setContactLead(null)
                  }
                  className="rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white"
                >
                  Log contact
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   REUSABLE UI COMPONENTS
------------------------------------------------------- */

function FormSection({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900">
        {title}
      </h3>

      <div className="mt-3 grid gap-3">
        {children}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  min,
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-gray-600">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        min={min}
        required={required}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-purple-400"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-gray-600">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-purple-400"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border bg-white px-4 py-3">
      <p className="text-xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {label}
      </p>
    </div>
  );
}