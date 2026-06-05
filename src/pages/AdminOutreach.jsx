import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../lib/firebase";

const ADMIN_EMAIL = "adamabdallahayln1@gmail.com";

const emptyForm = {
  company: "",
  contact: "",
  location: "",
  jobTitle: "",
  source: "WhatsApp Channel",
  applyMethod: "Phone",
  priority: "Medium",
  posted: false,
  contacted: false,
  status: "No reply",
  followUpDate: "",
  notes: "",
};

export default function AdminOutreach() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);

    const q = query(
      collection(db, "outreachLeads"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    setLeads(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));

    setLoading(false);
  };

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) fetchLeads();
  }, [user]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.company?.toLowerCase().includes(search.toLowerCase()) ||
        lead.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
        lead.location?.toLowerCase().includes(search.toLowerCase()) ||
        lead.contact?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const stats = {
    total: leads.length,
    posted: leads.filter((l) => l.posted).length,
    contacted: leads.filter((l) => l.contacted).length,
    interested: leads.filter((l) => l.status === "Interested").length,
    followUps: leads.filter((l) => l.status === "Needs follow-up").length,
  };

  const duplicateLead = leads.find(
    (lead) =>
      lead.id !== editingId &&
      lead.company?.toLowerCase().trim() === form.company.toLowerCase().trim() &&
      lead.contact?.trim() === form.contact.trim()
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  console.log("Form submitted:", form);

  if (!form.company || !form.jobTitle || !form.contact) {
    alert("Please fill Company, Job Title, and Contact.");
    return;
  }

  if (duplicateLead) {
    alert("This company/contact already exists.");
    return;
  }

  try {
    const payload = {
      ...form,
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "outreachLeads", editingId), payload);
      alert("Lead updated.");
    } else {
      await addDoc(collection(db, "outreachLeads"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      alert("Lead added.");
    }

    resetForm();
    await fetchLeads();
  } catch (error) {
    console.error("Add lead error:", error);
    alert(error.message);
  }
};

  const startEdit = (lead) => {
    setEditingId(lead.id);

    setForm({
      company: lead.company || "",
      contact: lead.contact || "",
      location: lead.location || "",
      jobTitle: lead.jobTitle || "",
      source: lead.source || "WhatsApp Channel",
      applyMethod: lead.applyMethod || "Phone",
      priority: lead.priority || "Medium",
      posted: Boolean(lead.posted),
      contacted: Boolean(lead.contacted),
      status: lead.status || "No reply",
      followUpDate: lead.followUpDate || "",
      notes: lead.notes || "",
    });
  };

  const toggleField = async (id, field, value) => {
    await updateDoc(doc(db, "outreachLeads", id), {
      [field]: !value,
      updatedAt: serverTimestamp(),
    });

    fetchLeads();
  };

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "outreachLeads", id), {
      status,
      updatedAt: serverTimestamp(),
    });

    fetchLeads();
  };

  const removeLead = async (id) => {
    const confirmed = confirm("Delete this lead?");
    if (!confirmed) return;

    await deleteDoc(doc(db, "outreachLeads", id));
    fetchLeads();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Forsa Outreach CRM
          </h1>
          <p className="mt-1 text-gray-500">
            Track companies, jobs, contacts, posting status, and follow-ups.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Leads" value={stats.total} />
          <StatCard label="Posted" value={stats.posted} />
          <StatCard label="Contacted" value={stats.contacted} />
          <StatCard label="Interested" value={stats.interested} />
          <StatCard label="Follow-ups" value={stats.followUps} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 rounded-2xl bg-white p-5 shadow-sm border"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-900">
              {editingId ? "Edit Lead" : "Add New Lead"}
            </h2>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Cancel edit
              </button>
            )}
          </div>

          {duplicateLead && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              Possible duplicate: this company/contact already exists.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="input"
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />

            <input
              className="input"
              placeholder="Contact / Phone / Email"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />

            <input
              className="input"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <input
              className="input"
              placeholder="Job title"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            />

            <select
              className="input"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              <option>WhatsApp Channel</option>
              <option>Instagram</option>
              <option>LinkedIn</option>
              <option>Website</option>
              <option>Referral</option>
              <option>Other</option>
            </select>

            <select
              className="input"
              value={form.applyMethod}
              onChange={(e) =>
                setForm({ ...form, applyMethod: e.target.value })
              }
            >
              <option>Phone</option>
              <option>WhatsApp</option>
              <option>Email</option>
              <option>Website</option>
              <option>DM</option>
            </select>

            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>No reply</option>
              <option>Interested</option>
              <option>Not interested</option>
              <option>Needs follow-up</option>
              <option>Posted only</option>
            </select>

            <input
              type="date"
              className="input"
              value={form.followUpDate}
              onChange={(e) =>
                setForm({ ...form, followUpDate: e.target.value })
              }
            />
          </div>

          <div className="flex gap-4 text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.posted}
                onChange={(e) =>
                  setForm({ ...form, posted: e.target.checked })
                }
              />
              Posted on Forsa
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.contacted}
                onChange={(e) =>
                  setForm({ ...form, contacted: e.target.checked })
                }
              />
              Company contacted
            </label>
          </div>

          <textarea
            className="input min-h-24"
            placeholder="Notes: job details, requirements, shifts, salary, branch, message status..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button className="rounded-xl bg-purple-600 px-5 py-3 font-medium text-white hover:bg-purple-700">
            {editingId ? "Save Changes" : "Add Lead"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            className="input"
            placeholder="Search company, job, location, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="input md:max-w-56"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>No reply</option>
            <option>Interested</option>
            <option>Not interested</option>
            <option>Needs follow-up</option>
            <option>Posted only</option>
          </select>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm border">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-600">
              <tr>
                <th className="p-3">Company</th>
                <th className="p-3">Job</th>
                <th className="p-3">Location</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Posted</th>
                <th className="p-3">Contacted</th>
                <th className="p-3">Status</th>
                <th className="p-3">Follow-up</th>
                <th className="p-3">Notes</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-t align-top">
                  <td className="p-3 font-medium">{lead.company}</td>
                  <td className="p-3">{lead.jobTitle}</td>
                  <td className="p-3">{lead.location || "-"}</td>
                  <td className="p-3">{lead.contact}</td>
                  <td className="p-3">{lead.priority || "Medium"}</td>

                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() =>
                        toggleField(lead.id, "posted", lead.posted)
                      }
                    >
                      {lead.posted ? "✅" : "❌"}
                    </button>
                  </td>

                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() =>
                        toggleField(lead.id, "contacted", lead.contacted)
                      }
                    >
                      {lead.contacted ? "✅" : "❌"}
                    </button>
                  </td>

                  <td className="p-3">
                    <select
                      className="rounded-lg border px-2 py-1"
                      value={lead.status || "No reply"}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                    >
                      <option>No reply</option>
                      <option>Interested</option>
                      <option>Not interested</option>
                      <option>Needs follow-up</option>
                      <option>Posted only</option>
                    </select>
                  </td>

                  <td className="p-3">{lead.followUpDate || "-"}</td>
                  <td className="p-3 max-w-xs text-gray-500">
                    {lead.notes || "-"}
                  </td>

                  <td className="p-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(lead)}
                        className="text-purple-600"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => removeLead(lead.id)}
                        className="text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && filteredLeads.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan="11">
                    No leads found.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan="11">
                    Loading leads...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}