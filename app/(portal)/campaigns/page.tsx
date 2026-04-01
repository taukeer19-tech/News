"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send, PlusCircle, Trash2, Calendar, FileText, Users,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Code, Link as LinkIcon, Image, Undo, Redo,
  Eye, X, Paperclip, ChevronDown, Clock
} from "lucide-react";
import NextLink from "next/link";

type Campaign = {
  id: string; subject: string; status: string;
  scheduledAt: string | null; createdAt: string;
  smtpConfig: { name: string } | null; _count: { recipients: number };
};
type SmtpConfig  = { id: string; name: string };
type Template    = { id: string; name: string; subject: string; contentHtml: string };
type ContactList = { id: string; name: string; _count: { contacts: number } };

// ── Rich Text Toolbar ──────────────────────────────────────────────────────
function ToolbarBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-white/50 hover:text-white transition-all text-sm font-bold">
      {children}
    </button>
  );
}

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"editor" | "preview" | "source">("editor");

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) exec("createLink", url);
  };
  const insertImage = () => {
    const url = prompt("Enter image URL:", "https://");
    if (url) exec("insertImage", url);
  };

  useEffect(() => {
    if (tab === "editor" && editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
    }
  }, [tab, value]);

  return (
    <div className="flex flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-3">
        {(["editor", "preview", "source"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
            {t === "preview" && <Eye className="w-4 h-4" />}
            {t === "source" && "HTML Source"}
            {t === "editor" && "Editor"}
            {t === "preview" && "Preview"}
          </button>
        ))}
      </div>

      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#1e1e2d]">
        {tab === "editor" && (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 flex-wrap">
              <ToolbarBtn onClick={() => exec("bold")} title="Bold"><Bold className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("italic")} title="Italic"><Italic className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("underline")} title="Underline"><Underline className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("strikeThrough")} title="Strikethrough"><Strikethrough className="w-4 h-4" /></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={() => exec("formatBlock", "h1")} title="Heading 1"><span className="text-xs font-black">H1</span></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "h2")} title="Heading 2"><span className="text-xs font-black">H2</span></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={() => exec("justifyLeft")} title="Align Left"><AlignLeft className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("justifyCenter")} title="Align Center"><AlignCenter className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("justifyRight")} title="Align Right"><AlignRight className="w-4 h-4" /></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="Bullet List"><List className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("insertOrderedList")} title="Numbered List"><ListOrdered className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "pre")} title="Code Block"><Code className="w-4 h-4" /></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={insertLink} title="Insert Link"><LinkIcon className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={insertImage} title="Insert Image"><Image className="w-4 h-4" /></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={() => exec("undo")} title="Undo"><Undo className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("redo")} title="Redo"><Redo className="w-4 h-4" /></ToolbarBtn>
            </div>
            {/* Content editable */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
              dangerouslySetInnerHTML={{ __html: value }}
              className="min-h-[300px] p-5 text-black text-sm focus:outline-none leading-relaxed bg-white rounded-b-xl"
              style={{ caretColor: "black" }}
            />
          </>
        )}

        {tab === "preview" && (
          <div className="min-h-[352px] p-5 bg-white text-black">
            <div className="text-sm" dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        )}

        {tab === "source" && (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full min-h-[352px] p-5 bg-[#1a1a24] text-[#9cdcfe] text-sm font-mono focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
  const [configs, setConfigs]       = useState<SmtpConfig[]>([]);
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [lists, setLists]           = useState<ContactList[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject]           = useState("");
  const [contentHtml, setContentHtml]   = useState("");
  const [smtpConfigId, setSmtpConfigId] = useState("");
  const [templateId, setTemplateId]     = useState("");
  const [sendingRate, setSendingRate]   = useState(0); // 0 = unlimited
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [selectedLists, setSelectedLists] = useState<string[]>(["all"]);
  const [attachments, setAttachments]   = useState<{ name: string; url: string; path: string; type: string }[]>([]);
  const [uploading, setUploading]       = useState(false);
  const [sendingId, setSendingId]       = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [campRes, confRes, tempRes, listRes] = await Promise.all([
      fetch(`/api/campaigns?_t=${Date.now()}`), fetch(`/api/smtp-configs`),
      fetch(`/api/templates`), fetch(`/api/contact-lists`),
    ]);
    if (campRes.ok) setCampaigns(await campRes.json());
    if (confRes.ok) {
      const confs = await confRes.json();
      setConfigs(confs);
      if (confs.length > 0) setSmtpConfigId(confs[0].id);
    }
    if (tempRes.ok) setTemplates(await tempRes.json());
    if (listRes.ok) setLists(await listRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    setTemplateId(tId);
    if (tId) {
      const t = templates.find(t => t.id === tId);
      if (t) { setSubject(t.subject); setContentHtml(t.contentHtml); }
    }
  };

  const handleListToggle = (listId: string) => {
    setSelectedLists(prev => {
      if (listId === "all") return ["all"];
      const without = prev.filter(id => id !== "all");
      return without.includes(listId) ? without.filter(id => id !== listId) : [...without, listId];
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    for (const file of Array.from(e.target.files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const d = await res.json();
        setAttachments(p => [...p, { name: d.name, url: d.url, path: d.path, type: d.type }]);
      }
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLists.length === 0) { alert("Select at least one recipient list."); return; }
    const scheduledAt = scheduleDate ? `${scheduleDate}T${scheduleTime}` : undefined;
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: subject || campaignName, contentHtml, smtpConfigId, templateId: templateId || undefined, scheduledAt, listIds: selectedLists, attachments, sendingRate }),
    });
    if (res.ok) {
      setShowModal(false);
      setCampaignName(""); setSubject(""); setContentHtml(""); setTemplateId(""); setSendingRate(0);
      setScheduleDate(""); setScheduleTime("09:00"); setSelectedLists(["all"]); setAttachments([]);
      fetchData();
    } else { alert("Failed to create campaign"); }
  };

  const deleteCampaign = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (id: string) => {
    setDeleteConfirmId(null);
    setCampaigns(prev => prev.filter(c => c.id !== id));
    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete campaign");
      fetchData(); // revert
    }
  };

  const sendCampaign = async (id: string) => {
    setSendingId(id);
    const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
    setSendingId(null);
    const d = await res.json();
    alert(res.ok ? d.message || "Sent!" : d.error || "Failed to send");
    if (res.ok) fetchData();
  };

  const statusColor = (s: string) => ({
    draft:     "bg-slate-500/20 text-slate-300 border-slate-500/30",
    scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    sending:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    sent:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  }[s] || "bg-white/10 text-white/70 border-white/20");

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <Send className="w-10 h-10 text-indigo-400" /> Campaigns
          </h1>
          <p className="text-white/60 mt-2 text-lg">Create, schedule and send your email campaigns.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 font-semibold">
          <PlusCircle className="w-5 h-5" /> New Campaign
        </button>
      </div>

      {/* Campaign List */}
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {loading ? (
          <div className="text-center text-white/50 py-16 animate-pulse">Loading campaigns…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-widest">
                  <th className="pb-4 pt-2 pl-4 font-semibold">Campaign</th>
                  <th className="pb-4 pt-2 font-semibold">Status</th>
                  <th className="pb-4 pt-2 font-semibold">Provider</th>
                  <th className="pb-4 pt-2 font-semibold">Date / Time</th>
                  <th className="pb-4 pt-2 pr-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 pl-4">
                      <NextLink href={`/campaigns/${c.id}`} className="text-white font-medium flex items-center gap-2 hover:text-indigo-400 transition-colors">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" /> {c.subject}
                      </NextLink>
                      <div className="text-white/40 text-xs mt-1">{c._count.recipients} recipients</div>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${statusColor(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="py-4 text-white/60 text-sm">{c.smtpConfig?.name || "—"}</td>
                    <td className="py-4 text-white/60 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-right flex items-center justify-end gap-1">
                      {c.status === "draft" && (
                        <button onClick={() => sendCampaign(c.id)} disabled={sendingId === c.id}
                          className="text-indigo-400 hover:text-indigo-300 p-2 hover:bg-white/10 rounded-xl transition-all" title="Send Now">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => deleteCampaign(c.id)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-white/10 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-16 text-white/40">No campaigns yet. Create your first one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative w-full max-w-sm bg-gray-900 border border-purple-500/20 rounded-2xl p-6 shadow-2xl z-10 transition-all">
            <h3 className="text-xl font-bold text-white mb-2 text-left">Delete Campaign</h3>
            <p className="text-white/70 text-sm mb-8 leading-relaxed text-left">Are you sure you want to permanently delete this campaign? This action cannot be undone.</p>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all font-medium">Cancel</button>
              <button onClick={() => confirmDelete(deleteConfirmId)} className="px-5 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all font-medium font-bold">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Campaign Form (Modal) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#13131c] border border-white/10 rounded-2xl w-full max-w-[900px] max-h-[92vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col">
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              
              <div className="p-8 pb-6 flex flex-col gap-6">
                
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Campaign Name</label>
                  <input
                    type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)}
                    placeholder="Test"
                    className="w-full bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none transition-all"
                  />
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Subject Line</label>
                  <input
                    required type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="Your email subject..."
                    className="w-full bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none transition-all"
                  />
                </div>

                {/* Schedule Send */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Schedule Send</label>
                  <div className="flex gap-3 items-center">
                    <div className="relative w-48">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                        className="w-full bg-[#1a1a24] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-white/70 text-sm focus:outline-none transition-all [color-scheme:dark]" />
                    </div>
                    <div className="relative w-32">
                      <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                        className="w-full bg-[#1a1a24] border border-white/5 rounded-xl pl-4 pr-10 py-2.5 text-white/70 text-sm focus:outline-none transition-all [color-scheme:dark]" />
                      <Clock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Rich Editor Component */}
                <div className="mt-2">
                  <RichEditor value={contentHtml} onChange={setContentHtml} />
                </div>

                {/* Target Audience & Attachments & Template & SMTP */}
                <div className="grid grid-cols-2 gap-6 mt-2">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Use Template</label>
                            <div className="relative">
                                <select value={templateId} onChange={handleTemplateSelect}
                                className="w-full appearance-none bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all pr-8">
                                <option value="">Select template...</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Target Audience *</label>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => handleListToggle("all")}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${selectedLists.includes("all") ? "bg-indigo-600 border-indigo-500 text-white" : "bg-transparent border-white/10 text-white/50 hover:text-white hover:bg-white/5"}`}>
                                    All Contacts
                                </button>
                                {lists.map(list => (
                                    <button key={list.id} type="button" onClick={() => handleListToggle(list.id)}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${selectedLists.includes(list.id) ? "bg-indigo-600 border-indigo-500 text-white" : "bg-transparent border-white/10 text-white/50 hover:text-white hover:bg-white/5"}`}>
                                    {list.name} <span className="text-[10px] opacity-70 ml-1">({list._count.contacts})</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Sending Server *</label>
                            <div className="relative">
                                <select required value={smtpConfigId} onChange={e => setSmtpConfigId(e.target.value)}
                                className="w-full appearance-none bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all pr-8">
                                {configs.length === 0 && <option value="">No SMTP configured</option>}
                                {configs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Sending Speed (<span className="text-white/50 font-normal">Anti-Spam</span>)</label>
                            <div className="relative">
                                <select value={sendingRate} onChange={e => setSendingRate(Number(e.target.value))}
                                className="w-full appearance-none bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all pr-8">
                                    <option value={0}>Blast (Unlimited)</option>
                                    <option value={10}>Slow (10 emails / min)</option>
                                    <option value={30}>Safe (30 emails / min)</option>
                                    <option value={60}>Fast (60 emails / min)</option>
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Attachments</label>
                            <div className="relative">
                                <input type="file" multiple onChange={handleFileUpload}
                                    className="w-full absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-2.5 flex justify-center items-center gap-2 text-sm text-indigo-400 font-medium hover:bg-white/5 transition-colors">
                                    <Paperclip className="w-4 h-4" /> Add Files
                                </div>
                            </div>
                            
                            {attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1">
                                {attachments.map((f, i) => (
                                <div key={i} className="flex items-center justify-between bg-[#1a1a24] rounded-lg px-3 py-2 text-xs text-white border border-white/5">
                                    <span className="truncate max-w-[150px]">{f.name}</span>
                                    <button type="button" onClick={() => setAttachments(p => p.filter((_, j) => j !== i))} className="text-white/40 hover:text-red-400 ml-2">
                                    <X className="w-3 h-3" />
                                    </button>
                                </div>
                                ))}
                            </div>
                            )}
                            {uploading && <p className="text-indigo-400 text-[10px] mt-1 animate-pulse">Uploading…</p>}
                        </div>
                    </div>
                </div>

              </div>
              
              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-[#13131c]/90 backdrop-blur-md border-t border-white/5 px-8 py-5 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={() => setShowModal(false)}
                  className="text-white hover:text-white text-sm font-semibold px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all text-sm flex items-center gap-2">
                  <Send className="w-4 h-4" /> Save Campaign
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
