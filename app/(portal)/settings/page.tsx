"use client";

import { useEffect, useState } from "react";
import { Settings, PlusCircle, Trash2, Edit2, Server, CheckCircle2, Moon, Sun, Palette, Mail, KeyRound, Loader2, ChevronDown, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";

type SmtpConfig = {
  id: string;
  name: string;
  provider: string;
  fromEmail: string;
  fromName: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function SettingsPage() {
  const [configs, setConfigs] = useState<SmtpConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("auto");
  const [detecting, setDetecting] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [detectingUI, setDetectingUI] = useState(false);
  const [detectedUI, setDetectedUI] = useState<{name: string, provider: string} | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [encryption, setEncryption] = useState("tls");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");

  const fetchConfigs = async () => {
    setLoading(true);
    const res = await fetch(`/api/smtp-configs?_t=${Date.now()}`);
    if (res.ok) {
        const data = await res.json();
        setConfigs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchConfigs();
  }, []);

  const openModal = () => {
    setEditId(null);
    setName("");
    setProvider("auto");
    setAdvancedMode(false);
    setDetectedUI(null);
    setApiKey("");
    setHost("");
    setPort("");
    setEncryption("tls");
    setUsername("");
    setPassword("");
    setFromName("");
    setShowModal(true);
  };

  const editConfig = (config: SmtpConfig) => {
    setEditId(config.id);
    setName(config.name);
    setProvider(config.provider);
    setAdvancedMode(true);
    // Since some fields might be undefined/null in DB, use config properties and fallback to default
    setHost((config as any).host || "");
    setPort((config as any).port ? String((config as any).port) : "");
    setEncryption((config as any).encryption || "tls");
    setUsername((config as any).username || "");
    setFromEmail(config.fromEmail);
    setFromName(config.fromName || "");
    // Not loading passwords/keys for security
    setApiKey("");
    setPassword("");
    setShowModal(true);
  };

  useEffect(() => {
    if (advancedMode || !fromEmail || !fromEmail.includes('@') || editId) {
        setDetectedUI(null);
        return;
    }
    const timer = setTimeout(async () => {
        setDetectingUI(true);
        try {
            const res = await fetch(`/api/smtp-configs/autodiscover?email=${encodeURIComponent(fromEmail)}`);
            if (res.ok) {
                const data = await res.json();
                const map:Record<string,string> = { gmail: 'Google Workspace', outlook: 'Microsoft 365', yahoo: 'Yahoo Mail', smtp: 'Custom Settings' };
                setDetectedUI({ name: map[data.provider] || data.provider, provider: data.provider });
                setProvider("auto");
            }
        } catch (e) {}
        setDetectingUI(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [fromEmail, advancedMode, editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/smtp-configs/${editId}` : "/api/smtp-configs";
    const method = editId ? "PUT" : "POST";

    let finalHost = host;
    let finalPort = port;
    let finalEncryption = encryption;
    let finalUsername = username;
    let finalProvider = provider;

    if (provider === "auto") {
        setDetecting(true);
        try {
            const detectRes = await fetch(`/api/smtp-configs/autodiscover?email=${encodeURIComponent(fromEmail)}`);
            if (!detectRes.ok) throw new Error("Auto-discovery failed");
            const detectData = await detectRes.json();
            
            finalHost = detectData.host;
            finalPort = detectData.port.toString();
            finalEncryption = detectData.encryption;
            finalUsername = fromEmail;
            finalProvider = detectData.provider;
            
            // Allow testing feedback loop
            console.log(detectData.message);
        } catch (e) {
            alert("Could not automatically detect settings for this email. Please configure manually via 'Custom SMTP Server'.");
            setDetecting(false);
            return;
        }
        setDetecting(false);
    } else if (provider === "gmail") {
        finalHost = "smtp.gmail.com"; finalPort = "465"; finalEncryption = "ssl"; finalUsername = fromEmail;
    } else if (provider === "outlook") {
        finalHost = "smtp-mail.outlook.com"; finalPort = "587"; finalEncryption = "tls"; finalUsername = fromEmail;
    } else if (provider === "yahoo") {
        finalHost = "smtp.mail.yahoo.com"; finalPort = "465"; finalEncryption = "ssl"; finalUsername = fromEmail;
    }

    const isApiKeyProvider = ["resend", "sendgrid", "ses", "mailgun"].includes(finalProvider);

    const payload = {
      name,
      provider: finalProvider,
      apiKey: isApiKeyProvider ? apiKey : undefined,
      host: !isApiKeyProvider ? finalHost : undefined,
      port: !isApiKeyProvider ? finalPort : undefined,
      encryption: !isApiKeyProvider ? finalEncryption : undefined,
      username: !isApiKeyProvider ? finalUsername : undefined,
      password: !isApiKeyProvider ? password : undefined,
      fromEmail,
      fromName
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowModal(false);
      fetchConfigs();
    } else {
      alert("Failed to save configuration");
    }
  };

  const deleteConfig = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (id: string) => {
    setDeleteConfirmId(null);
    setConfigs(prev => prev.filter(c => c.id !== id));
    const res = await fetch(`/api/smtp-configs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete configuration");
      fetchConfigs(); // revert
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
    const res = await fetch(`/api/smtp-configs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentStatus }),
    });
    if (!res.ok) {
      fetchConfigs(); // revert
    }
  };

  const handleTest = async (id: string) => {
    const res = await fetch(`/api/smtp-configs/${id}/test`, { method: "POST" });
    if (res.ok) {
        alert("Test email sent successfully!");
    } else {
        const error = await res.json();
        alert(`Test failed: ${error.error}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <Settings className="w-10 h-10" />
            Sending Identities
          </h1>
          <p className="text-white/70 mt-2 text-lg">Manage SMTP configurations and email providers like Resend, Amazon SES, or SendGrid.</p>
        </div>
        <button 
          onClick={openModal}
          className="bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400/30 px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 backdrop-blur-md font-semibold"
        >
          <PlusCircle className="w-5 h-5" /> Add Provider
        </button>
      </div>

      {/* ── Appearance ─────────────────────────────────────────── */}
      <div className="mb-10 bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Appearance</h2>
              <p className="text-white/40 text-xs mt-0.5">Choose how the platform looks and feels</p>
            </div>
          </div>
          {mounted && (
            <span className="text-xs font-semibold bg-white/10 border border-white/10 text-white/60 px-3 py-1.5 rounded-full">
              Current: {theme === "glass" ? "Glassmorphism" : theme === "aesthetic" ? "Aesthetic" : theme ?? "System"}
            </span>
          )}
        </div>

        {mounted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* ── Theme: Glassmorphism ── */}
            <button
              onClick={() => setTheme("glass")}
              className={`group relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
                theme === "glass"
                  ? "border-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.01]"
                  : "border-white/10 hover:border-white/30 hover:shadow-lg"
              }`}
            >
              {/* Mini preview mockup */}
              <div className="h-36 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="h-2 w-16 rounded-full bg-white/20" />
                  <div className="h-2 w-10 rounded-full bg-indigo-400/40" />
                </div>
                <div className="flex gap-2 flex-1">
                  <div className="w-16 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm flex flex-col gap-1.5 p-2">
                    {["Dashboard","Campaigns","Contacts"].map(l => (
                      <div key={l} className="h-1.5 rounded-full bg-white/20" />
                    ))}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-1.5">
                      {["bg-violet-500/60","bg-cyan-500/60","bg-rose-500/60"].map(c => (
                        <div key={c} className={`flex-1 h-8 rounded-lg ${c} border border-white/10 backdrop-blur-sm`} />
                      ))}
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm" />
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className={`p-4 flex items-start justify-between gap-3 ${theme === "glass" ? "bg-indigo-950/80" : "bg-[#0f0f1a]"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${theme === "glass" ? "bg-indigo-500/30 border border-indigo-500/40" : "bg-white/10 border border-white/10"}`}>
                    <Moon className={`w-4 h-4 ${theme === "glass" ? "text-indigo-300" : "text-white/50"}`} />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Frosted glass · Dark · Translucent</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 mt-0.5 transition-all ${
                  theme === "glass" ? "bg-indigo-500 border-indigo-400" : "border-white/20 bg-transparent"
                }`}>
                  {theme === "glass" && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>

              {theme === "glass" && (
                <div className="absolute top-2 right-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                  ACTIVE
                </div>
              )}
            </button>

            {/* ── Theme: Aesthetic ── */}
            <button
              onClick={() => setTheme("aesthetic")}
              className={`group relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
                theme === "aesthetic"
                  ? "border-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.01]"
                  : "border-white/10 hover:border-white/30 hover:shadow-lg"
              }`}
            >
              {/* Mini preview mockup */}
              <div className="h-36 bg-gradient-to-br from-gray-50 to-slate-100 relative overflow-hidden p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="h-2 w-16 rounded-full bg-gray-300" />
                  <div className="h-2 w-10 rounded-full bg-emerald-400/60" />
                </div>
                <div className="flex gap-2 flex-1">
                  <div className="w-16 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col gap-1.5 p-2">
                    {["Dashboard","Campaigns","Contacts"].map(l => (
                      <div key={l} className="h-1.5 rounded-full bg-gray-200" />
                    ))}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-1.5">
                      {["bg-emerald-400/80","bg-blue-400/80","bg-purple-400/80"].map(c => (
                        <div key={c} className={`flex-1 h-8 rounded-lg ${c} shadow-sm`} />
                      ))}
                    </div>
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className={`p-4 flex items-start justify-between gap-3 ${theme === "aesthetic" ? "bg-emerald-950/80" : "bg-[#0f0f1a]"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${theme === "aesthetic" ? "bg-emerald-500/30 border border-emerald-500/40" : "bg-white/10 border border-white/10"}`}>
                    <Sun className={`w-4 h-4 ${theme === "aesthetic" ? "text-emerald-300" : "text-white/50"}`} />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Clean · Light · Minimalist</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 mt-0.5 transition-all ${
                  theme === "aesthetic" ? "bg-emerald-500 border-emerald-400" : "border-white/20 bg-transparent"
                }`}>
                  {theme === "aesthetic" && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>

              {theme === "aesthetic" && (
                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                  ACTIVE
                </div>
              )}
            </button>

          </div>
        )}
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        {loading ? (
          <div className="text-center text-white/70 py-10 animate-pulse">Loading configurations...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {configs.map(config => (
              <div key={config.id} className="bg-gradient-to-br from-black/40 to-black/20 hover:from-black/50 hover:to-black/30 border border-white/10 rounded-3xl p-6 transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Server className={`w-8 h-8 ${config.isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="text-xl font-bold text-white pr-8 truncate">{config.name}</h3>
                      <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-white/70 uppercase">{config.provider}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleActive(config.id, config.isActive)}
                      className={`p-2 rounded-xl transition-all ${config.isActive ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-gray-400 hover:text-emerald-400 hover:bg-white/10'}`}
                      title={config.isActive ? "Deactivate" : "Activate"}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleTest(config.id)}
                      className="p-2 rounded-xl text-indigo-400 hover:bg-indigo-400/10 transition-all"
                      title="Test Connection"
                    >
                      <Server className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => editConfig(config)}
                      className="p-2 rounded-xl text-blue-400 hover:bg-blue-400/10 transition-all"
                      title="Edit Configuration"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteConfig(config.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-white/10 rounded-xl transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-white/70 bg-black/20 rounded-2xl p-4">
                  <p><span className="text-white/40 w-24 inline-block">From Email:</span> <span className="text-white">{config.fromEmail}</span></p>
                  <p><span className="text-white/40 w-24 inline-block">From Name:</span> <span className="text-white">{config.fromName || '-'}</span></p>
                  <p><span className="text-white/40 w-24 inline-block">Status:</span> 
                    <span className={config.isActive ? "text-emerald-400" : "text-gray-400"}> {config.isActive ? "Active" : "Inactive"}</span>
                  </p>
                </div>
              </div>
            ))}
            {configs.length === 0 && (
              <div className="col-span-1 lg:col-span-2 text-center py-10 text-white/60 bg-black/10 rounded-3xl border border-white/5 border-dashed">
                No sending configurations found. Add one to start sending campaigns.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative w-full max-w-sm bg-gray-900 border border-red-500/20 rounded-2xl p-6 shadow-2xl z-10">
            <h3 className="text-xl font-bold text-white mb-2">Delete Setup</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">Are you sure you want to permanently delete this SMTP connection?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl text-white/70 hover:bg-white/10 transition-all font-medium">Cancel</button>
              <button onClick={() => confirmDelete(deleteConfirmId)} className="px-4 py-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all font-medium">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#0F2027]/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-emerald-900/40">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">{editId ? "Edit Configuration" : "Connect Your Email"}</h2>
            <p className="text-white/50 text-sm text-center mb-8">We'll automatically configure your secure sending and SMTP settings.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {!advancedMode && !editId ? (
                <>
                  <div className="space-y-4">
                     <div>
                       <label className="block text-white/50 mb-2 text-xs font-bold uppercase tracking-wider pl-1">Email Address</label>
                       <div className="relative flex items-center">
                          <div className="absolute left-4 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                             {detectingUI ? <Loader2 className="w-3 h-3 text-blue-400 animate-spin" /> : 
                              detectedUI ? <Sparkles className="w-3 h-3 text-emerald-400" /> : 
                              <Mail className="w-3 h-3 text-white/50" />}
                          </div>
                          <input required type="email" value={fromEmail} onChange={e => {setFromEmail(e.target.value); setName(e.target.value); setFromName(e.target.value.split('@')[0] || '');}} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium" placeholder="you@company.com" disabled={!!editId} />
                       </div>
                     </div>

                     <div className={`transition-all duration-500 overflow-hidden ${fromEmail.includes('@') && !detectingUI ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                       <label className="block text-white/50 mb-2 text-xs font-bold uppercase tracking-wider pl-1 flex justify-between">
                          <span>App / Email Password</span>
                          {detectedUI && <span className="text-emerald-400 normal-case tracking-normal">{detectedUI.name} Detected ✨</span>}
                       </label>
                       <div className="relative flex items-center">
                          <div className="absolute left-4"><KeyRound className="w-4 h-4 text-white/50" /></div>
                          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium" placeholder="••••••••••••••••" />
                       </div>
                     </div>
                  </div>

                  <button type="submit" disabled={detecting || detectingUI || !fromEmail || !password} className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50 flex items-center justify-center gap-2">
                     {detecting ? <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</> : `Securely Connect ${detectedUI ? detectedUI.name : 'Account'}`}
                  </button>

                  <div className="pt-6 mt-4 border-t border-white/10 flex justify-center">
                      <button type="button" onClick={() => {setAdvancedMode(true); setProvider("resend");}} className="text-white/40 hover:text-white/70 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1">
                         Advanced: Manual Setup <ChevronDown className="w-3 h-3" />
                      </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-white/70 mb-2 text-sm font-medium">Config Name *</label>
                      <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="e.g. Primary Resend" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-white/70 mb-2 text-sm font-medium">Provider Type *</label>
                      <select required value={provider} onChange={e => setProvider(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none">
                        <option value="auto">✨ Auto-Detect (Smart Connect)</option>
                        <option disabled>──────────</option>
                        <option value="resend">Resend</option>
                        <option value="sendgrid">SendGrid</option>
                        <option value="ses">Amazon SES</option>
                        <option value="mailgun">Mailgun</option>
                        <option disabled>──────────</option>
                        <option value="gmail">Google / Gmail</option>
                        <option value="outlook">Microsoft Outlook</option>
                        <option value="yahoo">Yahoo Mail</option>
                        <option disabled>──────────</option>
                        <option value="smtp">Custom SMTP Server</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-white/70 mb-2 text-sm font-medium">From Email *</label>
                      <input required type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="newsletter@yourdomain.com" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-white/70 mb-2 text-sm font-medium">From Name</label>
                      <input type="text" value={fromName} onChange={e => setFromName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="John from Acme" />
                    </div>
                  </div>

                  {["resend", "sendgrid", "ses", "mailgun"].includes(provider) ? (
                    <div>
                      <label className="block text-white/70 mb-2 text-sm font-medium">API Key *</label>
                      <input required type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder={`Enter your ${provider} API key`} />
                    </div>
                  ) : provider === "smtp" ? (
                    <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <h4 className="text-white font-medium mb-2">Custom SMTP Details</h4>
                      <div className="flex gap-4">
                        <div className="flex-[2]">
                          <label className="block text-white/70 mb-2 text-xs font-medium">Host *</label>
                          <input required type="text" value={host} onChange={e => setHost(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm" placeholder="smtp.example.com" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-white/70 mb-2 text-xs font-medium">Port *</label>
                          <input required type="number" value={port} onChange={e => setPort(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm" placeholder="587" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-white/70 mb-2 text-xs font-medium">Encryption</label>
                          <select value={encryption} onChange={e => setEncryption(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm appearance-none">
                            <option value="tls">TLS</option>
                            <option value="ssl">SSL</option>
                            <option value="none">None</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-white/70 mb-2 text-xs font-medium">Username *</label>
                          <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-white/70 mb-2 text-xs font-medium">Password *</label>
                          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                      <h4 className="text-emerald-400 font-bold mb-1 flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        {provider === "auto" ? "Smart Auto-Connect" : provider === "gmail" ? "Gmail Account Setup" : provider === "outlook" ? "Outlook Setup" : "Yahoo Mail Setup"}
                      </h4>
                      <p className="text-white/60 text-xs mb-4">
                        {provider === "auto" 
                           ? "We'll analyze your email domain to automatically configure the SMTP settings." 
                           : "We'll automatically configure the correct host, port, and security settings for you."}
                      </p>
                      <div>
                        <label className="block text-emerald-100/90 mb-2 text-xs font-semibold uppercase tracking-wider">App Password *</label>
                        <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-emerald-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Paste your generated App Password" />
                        <p className="text-[10px] text-emerald-400/70 mt-2">
                          Use a dedicated App Password instead of your primary email password. Turn on 2FA in your account settings to create one.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end mt-8">
                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-white/70 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" disabled={detecting} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl transition-colors font-medium shadow-lg shadow-emerald-500/20">
                        {detecting ? "Connecting..." : "Save Provider"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
