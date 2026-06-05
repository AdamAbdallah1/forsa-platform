import { useEffect, useState } from "react";
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
import { db } from "../lib/firebase";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminOutreach() {
  const { user } = useAuth();

  const ADMIN_EMAIL = "adamabdallahayln1@gmail.com";

  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState({
    company: "",
    contact: "",
    location: "",
    jobTitle: "",
    source: "WhatsApp Channel",
    posted: false,
    contacted: false,
    status: "No reply",
    notes: "",
  });

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Access denied.</p>
      </div>
    );
  }

  const fetchLeads = async () => {
    const q = query(collection(db, "outreachLeads"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setLeads(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.company || !form.jobTitle || !form.contact) return;

    await addDoc(collection(db, "outreachLeads"), {
      ...form,
      createdAt: serverTimestamp(),
    });

    setForm({
      company: "",
      contact: "",
      location: "",
      jobTitle: "",
      source: "WhatsApp Channel",
      posted: false,
      contacted: false,
      status: "No reply",
      notes: "",
    });

    fetchLeads();
  };

  const toggleField = async (id, field, value) => {
    await updateDoc(doc(db, "outreachLeads", id), {
      [field]: !value,
    });
    fetchLeads();
  };

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "outreachLeads", id), { status });
    fetchLeads();
  };

  const removeLead = async (id) => {
    await deleteDoc(doc(db, "outreachLeads", id));
    fetchLeads();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-900">Forsa Outreach Tracker</h1>
        <p className="mt-1 text-gray-500">
          Track companies, jobs, and outreach progress.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-3 rounded-2xl bg-white p-5 shadow-sm border"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <input className="input" placeholder="Company" value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })} />

            <input className="input" placeholder="Contact" value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })} />

            <input className="input" placeholder="Location" value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })} />

            <input className="input" placeholder="Job title" value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />

            <input className="input" placeholder="Source" value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })} />

            <select className="input" value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>No reply</option>
              <option>Interested</option>
              <option>Not interested</option>
              <option>Needs follow-up</option>
            </select>
          </div>

          <textarea
            className="input min-h-24"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button className="rounded-xl bg-purple-600 px-5 py-3 font-medium text-white hover:bg-purple-700">
            Add Lead
          </button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm border">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-600">
              <tr>
                <th className="p-3">Company</th>
                <th className="p-3">Job</th>
                <th className="p-3">Location</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Posted</th>
                <th className="p-3">Contacted</th>
                <th className="p-3">Status</th>
                <th className="p-3">Notes</th>
                <th className="p-3">Delete</th>
              </tr>
            </thead>

            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t">
                  <td className="p-3 font-medium">{lead.company}</td>
                  <td className="p-3">{lead.jobTitle}</td>
                  <td className="p-3">{lead.location}</td>
                  <td className="p-3">{lead.contact}</td>

                  <td className="p-3">
                    <button onClick={() => toggleField(lead.id, "posted", lead.posted)}>
                      {lead.posted ? "✅" : "❌"}
                    </button>
                  </td>

                  <td className="p-3">
                    <button onClick={() => toggleField(lead.id, "contacted", lead.contacted)}>
                      {lead.contacted ? "✅" : "❌"}
                    </button>
                  </td>

                  <td className="p-3">
                    <select
                      className="rounded-lg border px-2 py-1"
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                    >
                      <option>No reply</option>
                      <option>Interested</option>
                      <option>Not interested</option>
                      <option>Needs follow-up</option>
                    </select>
                  </td>

                  <td className="p-3 text-gray-500">{lead.notes}</td>

                  <td className="p-3">
                    <button
                      onClick={() => removeLead(lead.id)}
                      className="text-red-500"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {leads.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan="9">
                    No leads yet.
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