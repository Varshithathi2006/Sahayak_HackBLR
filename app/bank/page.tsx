"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  FileText, ClipboardCheck, Settings, LogOut, Plus, FileUp,
  CheckCircle2, XCircle, Clock, ChevronRight, Loader2, Mic,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CARD = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "1rem",
};
const INPUT_STYLE = {
  background: "#121121",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.5rem",
  color: "#fff",
  outline: "none",
  padding: "0.6rem 0.9rem",
  fontSize: "0.875rem",
  width: "100%",
  colorScheme: "dark",
};

export default function BankDashboard() {
  const { user, logout, token } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"schemas" | "submissions" | "settings">("schemas");
  const [schemas, setSchemas] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewSchema, setShowNewSchema] = useState(false);
  const [editingSchema, setEditingSchema] = useState<any | null>(null);
  const [showUploadDoc, setShowUploadDoc] = useState<string | null>(null);
  const [newSchema, setNewSchema] = useState({ name: "", description: "", fields: [{ key: "", label: "", type: "text", hint: "" }] });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, subRes] = await Promise.all([
        apiFetch("/api/bank/schemas"),
        apiFetch("/api/bank/submissions"),
      ]);
      setSchemas(await sRes.json());
      setSubmissions(await subRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateSchema = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/bank/schemas", {
        method: "POST",
        body: JSON.stringify(newSchema),
      });
      setShowNewSchema(false);
      setNewSchema({ name: "", description: "", fields: [{ key: "", label: "", type: "text", hint: "" }] });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleUpdateSchema = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchema) return;
    try {
      const res = await apiFetch(`/api/bank/schemas/${editingSchema._id}`, {
        method: "PATCH",
        body: JSON.stringify(editingSchema),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingSchema(null);
      fetchData();
    } catch (err) { 
      console.error(err);
      alert("Failed to update schema. Please ensure the backend is running.");
    }
  };

  const handleDeleteSchema = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this registry? This action cannot be undone.")) return;
    try {
      const res = await apiFetch(`/api/bank/schemas/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }
      setEditingSchema(null);
      fetchData();
    } catch (err: any) { 
      console.error(err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleUploadDocument = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !showUploadDoc) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("document", file);
    try {
      await apiFetch(`/api/bank/schemas/${showUploadDoc}/documents`, {
        method: "POST",
        body: fd,
      } as any);
      setShowUploadDoc(null); fetchData();
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const updateSubmissionStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/bank/submissions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (!user) return null;

  const NAV_ITEMS = [
    { id: "schemas", label: "Form Schemas", icon: FileText },
    { id: "submissions", label: "Submissions", icon: ClipboardCheck },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#070612", color: "#fff", fontFamily: "'DM Sans',sans-serif", colorScheme: "dark" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        select option { background: #121121 !important; color: white !important; }
        ::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}} />

      {/* ── Sidebar ── */}
      <aside className="w-60 flex flex-col h-screen sticky top-0 shrink-0" style={{ background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="p-5 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}>
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sahayak</p>
            <p className="text-[10px] text-white/30">Bank Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id as any); setEditingSchema(null); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeTab === id ? "rgba(167,139,250,0.12)" : "transparent",
                border: activeTab === id ? "1px solid rgba(167,139,250,0.25)" : "1px solid transparent",
                color: activeTab === id ? "#a78bfa" : "rgba(255,255,255,0.45)",
              }}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
          <div className="pt-4 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "1rem" }}>
            <button 
              onClick={() => { setActiveTab("settings"); setEditingSchema(null); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: activeTab === "settings" ? "rgba(167,139,250,0.12)" : "transparent",
                border: activeTab === "settings" ? "1px solid rgba(167,139,250,0.25)" : "1px solid transparent",
                color: activeTab === "settings" ? "#a78bfa" : "rgba(255,255,255,0.45)",
              }}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button onClick={() => { logout(); router.push("/auth/login"); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </nav>

        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}>
              {user.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-white/30 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium text-white">
              {activeTab === "schemas" ? "Registry Configurations" : activeTab === "submissions" ? "Submission Oversight" : "System Settings"}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {activeTab === "schemas" ? "Manage and deploy dynamic voice form structures" : activeTab === "submissions" ? "Review and authorize incoming registry entries" : "Configure platform integrations and security"}
            </p>
          </div>
          {activeTab === "schemas" && (
            <button onClick={() => setShowNewSchema(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all" style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}>
              <Plus className="w-4 h-4" /> New Schema
            </button>
          )}
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

              {/* ── Schemas Tab ── */}
              {activeTab === "schemas" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {schemas.map((schema, i) => (
                    <motion.div key={schema._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex flex-col group" style={CARD}>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}>
                            <FileText className="w-5 h-5 text-violet-400" />
                          </div>
                          <span className="text-[10px] px-2.5 py-1 rounded-full text-white/40" style={{ background: "rgba(255,255,255,0.06)" }}>{schema.fields.length} Fields</span>
                        </div>
                        <h3 className="font-semibold text-white text-base mb-1 group-hover:text-violet-300 transition-colors">{schema.name}</h3>
                        <p className="text-xs text-white/40 mb-5 line-clamp-2 flex-1">{schema.description}</p>
                        <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <div>
                            {schema.documents.length > 0 ? (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" }} title="RAG Enabled">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              </div>
                            ) : (
                              <button onClick={() => setShowUploadDoc(schema._id)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} title="Upload RAG Doc">
                                <FileUp className="w-4 h-4 text-white/40" />
                              </button>
                            )}
                          </div>
                          <button 
                            onClick={() => setEditingSchema(schema)}
                            className="flex items-center gap-1 text-xs text-violet-400 font-medium hover:text-violet-300 transition-colors"
                          >
                            Manage <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : activeTab === "submissions" ? (
                /* ── Submissions Tab ── */
                <div className="rounded-2xl overflow-hidden" style={CARD}>
                  <table className="w-full text-left">
                    <thead style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      <tr>
                        {["Applicant", "Registry", "Status", "Date", "Actions"].map((h) => (
                          <th key={h} className="px-5 py-4 text-[10px] font-semibold text-white/35 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr key={sub._id} onClick={() => setSelectedSubmission(sub)} className="cursor-pointer transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-white">{sub.userId?.name || "Unknown"}</p>
                            <p className="text-[10px] text-white/35">{sub.userId?.email || "N/A"}</p>
                          </td>
                          <td className="px-5 py-4 text-xs text-white/50">{sub.schemaId?.name || "N/A"}</td>
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-1.5 text-[11px] font-medium w-fit px-2.5 py-1 rounded-full" style={{
                              background: sub.status === "approved" ? "rgba(52,211,153,0.1)" : sub.status === "rejected" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
                              color: sub.status === "approved" ? "#34d399" : sub.status === "rejected" ? "#f87171" : "#fbbf24",
                              border: `1px solid ${sub.status === "approved" ? "rgba(52,211,153,0.25)" : sub.status === "rejected" ? "rgba(248,113,113,0.25)" : "rgba(251,191,36,0.25)"}`,
                            }}>
                              {sub.status === "pending" && <Clock className="w-3 h-3" />}
                              {sub.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                              {sub.status === "rejected" && <XCircle className="w-3 h-3" />}
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-white/35">{new Date(sub.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                            {sub.status === "pending" ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateSubmissionStatus(sub._id, "approved")} className="p-1.5 rounded-lg transition-colors text-emerald-400 hover:bg-emerald-400/10"><CheckCircle2 className="w-4 h-4" /></button>
                                <button onClick={() => updateSubmissionStatus(sub._id, "rejected")} className="p-1.5 rounded-lg transition-colors text-red-400 hover:bg-red-400/10"><XCircle className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-white/25">{sub.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* ── Settings Tab ── */
                <div className="max-w-3xl space-y-6">
                  <div className="p-8 rounded-2xl" style={CARD}>
                    <h3 className="text-lg font-semibold text-white mb-6">Platform Configuration</h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/40 font-medium">Vapi Assistant Provider</label>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <Mic className="w-4 h-4 text-violet-400" />
                            <p className="text-sm text-white">Vapi.ai (Enterprise)</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/40 font-medium">Vector Database</label>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <p className="text-sm text-white">Qdrant Cloud (Active)</p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-xs text-white/30 leading-relaxed mb-4">
                          Security Note: Your organization is using Sahayak's secure VPC for all voice and knowledge-base operations. 
                          All documents uploaded are encrypted at rest and only accessible by your regional node.
                        </p>
                        <button className="px-4 py-2 rounded-lg text-xs font-medium text-white/40 cursor-not-allowed" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          Update API Credentials
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-2xl" style={CARD}>
                    <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
                    <div className="space-y-4">
                      {[
                        { label: "Backend Version", value: "v2.4.0-stable" },
                        { label: "Vapi SDK", value: "v1.12.3" },
                        { label: "Org ID", value: user.orgId || "ORG_SAHAYAK_MAIN" },
                        { label: "Last Sync", value: new Date().toLocaleString() }
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                          <span className="text-xs text-white/40">{item.label}</span>
                          <span className="text-xs font-mono text-white/60">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── New Schema Modal ── */}
        {showNewSchema && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(7,6,18,0.85)", backdropFilter: "blur(16px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 rounded-2xl" style={CARD}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Create New Registry</h2>
                <button onClick={() => setShowNewSchema(false)}><XCircle className="w-5 h-5 text-white/40 hover:text-white" /></button>
              </div>
              <form onSubmit={handleCreateSchema} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40 font-medium">Registry Name</label>
                  <input required value={newSchema.name} onChange={(e) => setNewSchema({ ...newSchema, name: e.target.value })} style={INPUT_STYLE} placeholder="e.g. Agricultural Subsidy 2026" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40 font-medium">Description</label>
                  <textarea value={newSchema.description} onChange={(e) => setNewSchema({ ...newSchema, description: e.target.value })} style={{ ...INPUT_STYLE, height: "80px", resize: "none" }} placeholder="Purpose of this form..." />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-white/40 font-medium">Fields</label>
                    <button type="button" onClick={() => setNewSchema({ ...newSchema, fields: [...newSchema.fields, { key: "", label: "", type: "text" }] })} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Field
                    </button>
                  </div>
                  {newSchema.fields.map((field, idx) => (
                    <div key={idx} className="space-y-2 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-6">
                          <input required value={field.label} onChange={(e) => { const f = [...newSchema.fields]; f[idx].label = e.target.value; f[idx].key = e.target.value.toLowerCase().replace(/ /g, "_"); setNewSchema({ ...newSchema, fields: f }); }} style={{ ...INPUT_STYLE, padding: "0.5rem 0.75rem", colorScheme: "dark" }} placeholder="Field Label" />
                        </div>
                        <div className="col-span-5">
                          <select value={field.type} onChange={(e) => { const f = [...newSchema.fields]; f[idx].type = e.target.value; setNewSchema({ ...newSchema, fields: f }); }} style={{ ...INPUT_STYLE, padding: "0.5rem 0.75rem", colorScheme: "dark" }}>
                            <option value="text">Single-Line Text</option>
                            <option value="number">Number</option>
                            <option value="email">Email Address</option>
                            <option value="password">Password</option>
                            <option value="tel">Phone Number</option>
                            <option value="url">Website URL</option>
                            <option value="boolean">Yes/No (Boolean)</option>
                          </select>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <button type="button" onClick={() => setNewSchema({ ...newSchema, fields: newSchema.fields.filter((_, i) => i !== idx) })} className="text-white/25 hover:text-red-400 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <input 
                        value={field.hint || ""} 
                        onChange={(e) => { const f = [...newSchema.fields]; f[idx].hint = e.target.value; setNewSchema({ ...newSchema, fields: f }); }} 
                        style={{ ...INPUT_STYLE, padding: "0.4rem 0.75rem", fontSize: "0.75rem", background: "rgba(255,255,255,0.02)" }} 
                        placeholder="Sahayak Knowledge Hint (e.g. Only accept marks between 0-100)" 
                      />
                    </div>
                  ))}
                </div>
                <button type="submit" className="w-full py-3 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}>
                  Deploy Registry
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* ── Edit Schema Modal (MANAGE) ── */}
        {editingSchema && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(7,6,18,0.85)", backdropFilter: "blur(16px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 rounded-2xl" style={CARD}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Manage Registry</h2>
                  <p className="text-xs text-white/40 mt-1">Editing {editingSchema.name}</p>
                </div>
                <button onClick={() => setEditingSchema(null)}><XCircle className="w-5 h-5 text-white/40 hover:text-white" /></button>
              </div>
              <form onSubmit={handleUpdateSchema} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40 font-medium">Description (Knowledge Context)</label>
                  <textarea value={editingSchema.description} onChange={(e) => setEditingSchema({ ...editingSchema, description: e.target.value })} style={{ ...INPUT_STYLE, height: "120px", resize: "none", colorScheme: "dark" }} placeholder="Update the policy description here..." />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-white/40 font-medium">Modify Registry Fields</label>
                    <button type="button" onClick={() => setEditingSchema({ ...editingSchema, fields: [...editingSchema.fields, { key: "", label: "", type: "text", hint: "" }] })} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Field
                    </button>
                  </div>
                  {editingSchema.fields.map((field: any, idx: number) => (
                    <div key={idx} className="space-y-2 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-6">
                          <input required value={field.label} onChange={(e) => { const f = [...editingSchema.fields]; f[idx].label = e.target.value; f[idx].key = e.target.value.toLowerCase().replace(/ /g, "_"); setEditingSchema({ ...editingSchema, fields: f }); }} style={{ ...INPUT_STYLE, padding: "0.5rem 0.75rem", colorScheme: "dark" }} placeholder="Field Label" />
                        </div>
                        <div className="col-span-5">
                          <select value={field.type} onChange={(e) => { const f = [...editingSchema.fields]; f[idx].type = e.target.value; setEditingSchema({ ...editingSchema, fields: f }); }} style={{ ...INPUT_STYLE, padding: "0.5rem 0.75rem", colorScheme: "dark" }}>
                            <option value="text">Single-Line Text</option>
                            <option value="number">Number</option>
                            <option value="email">Email Address</option>
                            <option value="password">Password</option>
                            <option value="tel">Phone Number</option>
                            <option value="url">Website URL</option>
                            <option value="boolean">Yes/No (Boolean)</option>
                          </select>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <button type="button" onClick={() => setEditingSchema({ ...editingSchema, fields: editingSchema.fields.filter((_: any, i: number) => i !== idx) })} className="text-white/25 hover:text-red-400 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <input 
                        value={field.hint || ""} 
                        onChange={(e) => { const f = [...editingSchema.fields]; f[idx].hint = e.target.value; setEditingSchema({ ...editingSchema, fields: f }); }} 
                        style={{ ...INPUT_STYLE, padding: "0.4rem 0.75rem", fontSize: "0.75rem", background: "rgba(255,255,255,0.02)" }} 
                        placeholder="Sahayak Knowledge Hint (e.g. Validation rules or logic)" 
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditingSchema(null)} className="flex-1 py-3 rounded-xl text-sm font-medium text-white/40 bg-white/5 border border-white/10">Cancel</button>
                    <button type="submit" className="flex-[2] py-3 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}>
                      Save Changes
                    </button>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteSchema(editingSchema._id)} 
                    className="w-full py-2.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-2"
                    style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)" }}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Delete Registry Permanently
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ── Upload Doc Modal ── */}
        {showUploadDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(7,6,18,0.85)", backdropFilter: "blur(16px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md p-8 rounded-2xl" style={CARD}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Support Documentation</h2>
                <button onClick={() => setShowUploadDoc(null)}><XCircle className="w-5 h-5 text-white/40 hover:text-white" /></button>
              </div>
              <p className="text-xs text-white/40 mb-6 leading-relaxed">Upload related documents (Terms, Guidelines, FAQ) to train the LLM for this registry.</p>
              <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl cursor-pointer transition-all" style={{ border: "2px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.4)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)")}
              >
                {uploading ? <Loader2 className="w-8 h-8 text-violet-400 animate-spin" /> : <FileUp className="w-8 h-8 text-white/30 mb-2" />}
                <p className="text-xs text-white/30 mt-2">{uploading ? "Processing..." : "Select PDF or TXT"}</p>
                <input type="file" className="hidden" onChange={handleUploadDocument} disabled={uploading} />
              </label>
            </motion.div>
          </div>
        )}

        {/* ── Submission Detail Modal ── */}
        {selectedSubmission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(7,6,18,0.85)", backdropFilter: "blur(16px)" }} onClick={() => setSelectedSubmission(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 rounded-2xl" style={CARD} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedSubmission.schemaId?.name || "Submission"}</h2>
                  <p className="text-xs text-white/35 mt-1">By {selectedSubmission.userId?.name || "Unknown"} · {new Date(selectedSubmission.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedSubmission(null)}><XCircle className="w-5 h-5 text-white/40 hover:text-white" /></button>
              </div>

              <div className="mb-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{
                  background: selectedSubmission.status === "approved" ? "rgba(52,211,153,0.1)" : selectedSubmission.status === "rejected" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
                  color: selectedSubmission.status === "approved" ? "#34d399" : selectedSubmission.status === "rejected" ? "#f87171" : "#fbbf24",
                  border: `1px solid ${selectedSubmission.status === "approved" ? "rgba(52,211,153,0.25)" : selectedSubmission.status === "rejected" ? "rgba(248,113,113,0.25)" : "rgba(251,191,36,0.25)"}`,
                }}>
                  {selectedSubmission.status === "pending" && <Clock className="w-3 h-3" />}
                  {selectedSubmission.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                  {selectedSubmission.status === "rejected" && <XCircle className="w-3 h-3" />}
                  {selectedSubmission.status}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-3">Collected Form Data</p>
                {Object.entries(selectedSubmission.data || {}).map(([key, value]) => {
                  const label = selectedSubmission.schemaId?.fields?.find((f: any) => f.key === key)?.label || key.replace(/_/g, " ");
                  return (
                    <div key={key} className="flex justify-between gap-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <span className="text-xs text-white/40 capitalize">{label}</span>
                      <span className="text-xs font-mono text-white">{String(value)}</span>
                    </div>
                  );
                })}
              </div>

              {selectedSubmission.status === "pending" && (
                <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <button onClick={() => { updateSubmissionStatus(selectedSubmission._id, "approved"); setSelectedSubmission(null); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white" style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => { updateSubmissionStatus(selectedSubmission._id, "rejected"); setSelectedSubmission(null); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
