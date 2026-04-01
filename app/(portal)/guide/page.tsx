"use client";

import { useState, useRef } from "react";
import {
  BookOpen, Mail, ChevronRight, Server, Users, Layout, Send,
  PieChart, ShieldCheck, History, CheckCircle2, Printer, X,
  Loader2, Check, AlertTriangle, Lightbulb, Globe, Lock,
  FileText, BarChart2, HelpCircle, Crown, UserCog, Eye
} from "lucide-react";
import { useSession } from "next-auth/react";
import { type UserRole, getRoleLabel, canManageSmtp, canManageTeam, canViewAuditLogs, canCreateCampaign, canManageContacts, isViewer } from "@/lib/permissions";

// ── Role-based section visibility ──────────────────────────────────────────
function getSectionsForRole(role: UserRole) {
  const all = [
    { id: "cover",     title: "Personal Guide",       icon: Crown,      roles: ["owner","admin","member","viewer"] },
    { id: "toc",       title: "Table of Contents",    icon: FileText,   roles: ["owner","admin","member","viewer"] },
    { id: "intro",     title: "1. Introduction",      icon: BookOpen,   roles: ["owner","admin","member","viewer"] },
    { id: "login",     title: "2. Getting Started",   icon: Globe,      roles: ["owner","admin","member","viewer"] },
    { id: "smtp",      title: "3. SMTP Setup",         icon: Server,     roles: ["owner","admin"] },
    { id: "contacts",  title: "4. Contacts & Lists",   icon: Users,      roles: ["owner","admin","member"] },
    { id: "templates", title: "5. Email Templates",    icon: Layout,     roles: ["owner","admin","member"] },
    { id: "campaigns", title: "6. Campaigns",          icon: Send,       roles: ["owner","admin","member","viewer"] },
    { id: "reports",   title: "7. Reporting",          icon: PieChart,   roles: ["owner","admin","member","viewer"] },
    { id: "team",      title: "8. Team Management",    icon: ShieldCheck,roles: ["owner","admin"] },
    { id: "audit",     title: "9. Security & Audit",   icon: History,    roles: ["owner","admin"] },
    { id: "faq",       title: "10. FAQ",               icon: HelpCircle, roles: ["owner","admin","member","viewer"] },
  ];
  return all.filter(s => s.roles.includes(role));
}

const ROLE_COLORS: Record<UserRole, string> = {
  owner:  "from-yellow-500 to-amber-600",
  admin:  "from-red-500 to-rose-600",
  member: "from-blue-500 to-indigo-600",
  viewer: "from-slate-500 to-slate-600",
};
const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  owner: Crown, admin: ShieldCheck, member: UserCog, viewer: Eye,
};

export default function GuidePage() {
  const { data: session } = useSession();
  const role: UserRole = ((session?.user as any)?.role as UserRole) || "viewer";
  const userEmail: string = (session?.user as any)?.email || "user@workspace.com";
  const userName: string = (session?.user as any)?.name || userEmail.split("@")[0];

  const sections = getSectionsForRole(role);
  const navSections = sections.filter(s => s.id !== "cover");

  const [activeSection, setActiveSection] = useState("toc");
  const [emailModal, setEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState(userEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/guide/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, manualHtml: contentRef.current?.innerHTML }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(() => { setEmailModal(false); setSent(false); }, 2500);
      }
    } catch { alert("Failed to send. Check SMTP settings."); }
    setSending(false);
  };

  const today = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const RoleIcon = ROLE_ICONS[role];

  // ── Reusable sub-components ──────────────────────────────────────────────
  const Step = ({ n, title, desc }: { n: string; title: string; desc: string }) => (
    <li className="flex items-start gap-4 bg-white/5 p-4 rounded-xl print-card">
      <div className="step-pill w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">{n}</div>
      <div>
        <p className="font-bold text-white mb-1">{title}</p>
        <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
      </div>
    </li>
  );

  const InfoCard = ({ title, desc }: { title: string; desc: string }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 print-card">
      <h5 className="font-bold text-white mb-2">{title}</h5>
      <p className="text-xs text-white/55 leading-relaxed">{desc}</p>
    </div>
  );

  const Tip = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start print-card tip-warn">
      <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-200 leading-relaxed">{children}</p>
    </div>
  );
  const Warning = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-start print-card tip-danger">
      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
      <p className="text-sm text-red-200 leading-relaxed">{children}</p>
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm 18mm; }
          body, body * { visibility: hidden !important; }
          #guide-print-root, #guide-print-root * { visibility: visible !important; }
          #guide-print-root {
            position: absolute !important; top: 0 !important; left: 0 !important;
            width: 100% !important; padding: 0 !important; margin: 0 !important;
            background: white !important; font-family: Georgia, serif !important;
            font-size: 10.5pt !important; line-height: 1.75 !important;
            border: none !important; border-radius: 0 !important;
            box-shadow: none !important; backdrop-filter: none !important;
          }
          .screen-only { display: none !important; visibility: hidden !important; }
          .print-show { display: flex !important; visibility: visible !important; }
          .print-footer-bar { display: block !important; visibility: visible !important; }
          .print-cover { display: flex !important; visibility: visible !important; }
          .print-section { page-break-before: always !important; }
          section { page-break-inside: avoid; orphans: 3; widows: 3; }
          #guide-print-root * {
            background-color: transparent !important; background-image: none !important;
            text-shadow: none !important; box-shadow: none !important; backdrop-filter: none !important;
          }
          #guide-print-root h2 {
            font-size: 15pt !important; font-weight: bold !important; color: #4c1d95 !important;
            border-bottom: 1pt solid #7c3aed !important; padding-bottom: 4pt !important;
            margin-top: 18pt !important; margin-bottom: 10pt !important; background: transparent !important;
          }
          #guide-print-root h3 { font-size: 12pt !important; color: #3730a3 !important; margin-top: 12pt !important; }
          #guide-print-root h4, #guide-print-root h5 { font-size: 11pt !important; color: #1e1b4b !important; }
          #guide-print-root p, #guide-print-root li { color: #111 !important; margin-bottom: 6pt !important; }
          #guide-print-root .print-card { background-color: #f8f7ff !important; border: 0.5pt solid #c4b5fd !important; border-radius: 4pt !important; padding: 8pt !important; margin-bottom: 6pt !important; }
          #guide-print-root .tip-card   { background-color: #ecfdf5 !important; border-color: #6ee7b7 !important; }
          #guide-print-root .tip-warn   { background-color: #fffbeb !important; border-color: #fcd34d !important; }
          #guide-print-root .tip-danger { background-color: #fff1f2 !important; border-color: #fca5a5 !important; }
          #guide-print-root .step-pill  { background-color: #ede9fe !important; color: #4c1d95 !important; border: 0.5pt solid #c4b5fd !important; }
          #guide-print-root .cover-box  { background-color: #f3f0ff !important; border: 1pt solid #7c3aed !important; border-radius: 8pt !important; padding: 20pt !important; }
          #guide-print-root table { width: 100%; border-collapse: collapse; font-size: 9pt; }
          #guide-print-root th { background-color: #ede9fe !important; color: #4c1d95 !important; border: 0.5pt solid #c4b5fd !important; padding: 5pt !important; font-weight: bold !important; }
          #guide-print-root td { border: 0.5pt solid #e5e7eb !important; padding: 4pt !important; color: #111 !important; }
          #guide-print-root .toc-row { border-bottom: 0.5pt dotted #ccc !important; padding: 2pt 0 !important; }
        }
      `}</style>

      <div className="guide-page-wrapper min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
        {/* Web Header */}
        <div className="screen-only mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-purple-400" /> My User Guide
            </h1>
            <p className="text-white/60 mt-2 text-lg">Personalised for <span className="text-purple-300 font-semibold">{userName}</span> · <span className="text-white/40">{getRoleLabel(role)}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl border border-white/10 transition-all font-semibold">
              <Printer className="w-4 h-4" /> Download PDF
            </button>
            <button onClick={() => setEmailModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-purple-500/20 transition-all">
              <Mail className="w-4 h-4" /> Email My Guide
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Web Sidebar */}
          <div className="screen-only w-full md:w-56 space-y-1 sticky top-8 h-fit">
            {navSections.map((section) => {
              const Icon = section.icon;
              return (
                <button key={section.id}
                  onClick={() => { setActiveSection(section.id); document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" }); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left ${activeSection === section.id
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="font-medium text-xs">{section.title}</span>
                  {activeSection === section.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
            {/* Role badge in sidebar */}
            <div className={`mt-4 rounded-xl p-3 bg-gradient-to-r ${ROLE_COLORS[role]} bg-opacity-20 border border-white/10`}>
              <div className="flex items-center gap-2">
                <RoleIcon className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">{getRoleLabel(role)}</span>
              </div>
              <p className="text-xs text-white/50 mt-1">{sections.length - 2} sections in your guide</p>
            </div>
          </div>

          {/* ═══ MAIN CONTENT ═══ */}
          <div id="guide-print-root" ref={contentRef}
            className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl space-y-14 text-white">

            {/* Print-only Header */}
            <div className="print-show hidden items-center justify-between pb-6 mb-2 border-b-2 border-purple-700">
              <img src="https://fyrptjy.stripocdn.email/content/guids/CABINET_e77334dc9b7a99972af7127fbf474f9ef41e8a3dc909c3a7e9d86f162965e37d/images/bombino_express_pvt_ltd_logo_2.PNG"
                alt="Bombino Express" style={{ height: 44, width: "auto" }} />
              <div className="text-right">
                <p style={{ fontSize: "13pt", fontWeight: "bold", color: "#4c1d95" }}>Personal User Guide</p>
                <p style={{ fontSize: "9pt", color: "#6b7280" }}>For: {userName} · {getRoleLabel(role)} · {today}</p>
              </div>
            </div>

            {/* ── PERSONALISED COVER ── */}
            <section id="cover" className="scroll-mt-8">
              <div className="cover-box bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-3xl p-8 text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${ROLE_COLORS[role]} mb-6 shadow-2xl`}>
                  <RoleIcon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Welcome, {userName}!</h2>
                <p className="text-white/60 mb-6 text-lg">This guide has been personalised for your <span className={`font-bold bg-gradient-to-r ${ROLE_COLORS[role]} bg-clip-text text-transparent`}>{getRoleLabel(role)}</span> access level.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-left">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 print-card">
                    <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-1">Assigned To</p>
                    <p className="text-white font-semibold text-sm truncate">{userEmail}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 print-card">
                    <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-1">Access Level</p>
                    <p className="text-purple-300 font-semibold text-sm">{getRoleLabel(role)}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 print-card">
                    <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-1">Sections in Guide</p>
                    <p className="text-white font-semibold text-sm">{navSections.length} Chapters</p>
                  </div>
                </div>

                {/* Permission badges */}
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {[
                    { label: "View Campaigns",    ok: true },
                    { label: "Create Campaigns",  ok: canCreateCampaign(role) },
                    { label: "Manage Contacts",   ok: canManageContacts(role) },
                    { label: "Manage SMTP",        ok: canManageSmtp(role) },
                    { label: "Manage Team",        ok: canManageTeam(role) },
                    { label: "View Audit Logs",   ok: canViewAuditLogs(role) },
                  ].map(({ label, ok }) => (
                    <span key={label} className={`px-3 py-1 rounded-full text-xs font-bold border ${ok
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-white/5 text-white/25 border-white/10 line-through"}`}>
                      {ok ? "✓" : "✗"} {label}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* ── TABLE OF CONTENTS ── */}
            <section id="toc" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-5">
                <FileText className="w-7 h-7 text-purple-400 shrink-0" />
                <h2 className="text-2xl font-bold text-white">Table of Contents</h2>
              </div>
              <p className="text-white/50 text-sm mb-4">This guide contains only the sections relevant to your <strong className="text-purple-300">{getRoleLabel(role)}</strong> role.</p>
              <div className="space-y-2">
                {navSections.map((s, i) => (
                  <div key={s.id} className="toc-row flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-white/80 text-sm">{s.title}</span>
                    <span className="text-white/30 text-xs font-mono">§{i + 1}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── SECTION 1: INTRODUCTION ── */}
            <section id="intro" className="scroll-mt-8 print-section">
              <div className="flex items-center gap-3 mb-5">
                <BookOpen className="w-7 h-7 text-purple-400 shrink-0" />
                <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
              </div>
              <p className="text-white/75 leading-relaxed mb-4">
                <strong className="text-white">Bombino Express</strong> is a production-ready, multi-tenant email marketing platform.
                As a <strong className="text-purple-300">{getRoleLabel(role)}</strong>, you have access to the features described in this guide.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { show: true,                      icon: Send,       title: "Campaigns",      desc: "View and " + (canCreateCampaign(role) ? "create" : "read") + " email campaigns." },
                  { show: canManageContacts(role),   icon: Users,      title: "Contacts",       desc: "Import, tag and manage your subscriber lists." },
                  { show: canCreateCampaign(role),   icon: Layout,     title: "Templates",      desc: "Design professional email templates with the built-in editor." },
                  { show: canManageSmtp(role),       icon: Server,     title: "SMTP Servers",   desc: "Connect and manage your email delivery infrastructure." },
                  { show: true,                      icon: BarChart2,  title: "Analytics",      desc: "Track open rates, click rates, bounces and unsubscribes." },
                  { show: canManageTeam(role),       icon: ShieldCheck,"title": "Team",         desc: "Add members, assign roles, and manage workspace access." },
                ].filter(f => f.show).map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3 bg-white/5 border border-white/10 rounded-xl p-4 print-card">
                    <Icon className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-sm mb-1">{title}</p>
                      <p className="text-xs text-white/55 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── SECTION 2: GETTING STARTED ── */}
            <section id="login" className="scroll-mt-8 print-section">
              <div className="flex items-center gap-3 mb-5">
                <Globe className="w-7 h-7 text-purple-400 shrink-0" />
                <h2 className="text-2xl font-bold text-white">2. Getting Started</h2>
              </div>
              <h3 className="text-lg font-bold text-purple-300 mb-3">Logging In</h3>
              <ul className="space-y-3 list-none pl-0 mb-6">
                {[
                  { n: "1", title: "Go to Login Page", desc: "Navigate to your Bombino Express URL and go to /login. Enter the email and password provided by your workspace administrator." },
                  { n: "2", title: "Check Your Welcome Email", desc: `Your login credentials were sent to ${userEmail} when your account was created. If you didn't receive it, ask your workspace admin to resend.` },
                  { n: "3", title: "First Login & Navigation", desc: "After login, you will land on the Dashboard. Use the left sidebar to navigate between sections available to your role." },
                ].map(p => <Step key={p.n} {...p} />)}
              </ul>
              <h3 className="text-lg font-bold text-purple-300 mb-3">Your Navigation Menu</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-white/70 border border-white/10 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-white/10 text-white">
                      <th className="text-left p-3">Sidebar Item</th>
                      <th className="text-left p-3">Purpose</th>
                      <th className="text-center p-3">Your Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { item: "Dashboard",      purpose: "Key metrics and recent campaign overview",  ok: true },
                      { item: "Campaigns",      purpose: "View" + (canCreateCampaign(role) ? " & create" : "") + " email campaigns", ok: true },
                      { item: "Contacts",       purpose: "View and manage subscriber contacts",       ok: canManageContacts(role) },
                      { item: "Segments & Lists",purpose: "Create targeted contact groups",           ok: canManageContacts(role) },
                      { item: "Templates",      purpose: "Design reusable email templates",          ok: canCreateCampaign(role) },
                      { item: "Settings / SMTP",purpose: "Connect mail servers",                     ok: canManageSmtp(role) },
                      { item: "Team",           purpose: "Add members and assign roles",             ok: canManageTeam(role) },
                      { item: "Audit Logs",     purpose: "Review all platform activity",            ok: canViewAuditLogs(role) },
                      { item: "User Guide",     purpose: "This personalised manual",               ok: true },
                    ].map(({ item, purpose, ok }) => (
                      <tr key={item} className="border-t border-white/5">
                        <td className="p-3 font-semibold text-white">{item}</td>
                        <td className="p-3">{purpose}</td>
                        <td className="p-3 text-center">{ok ? <span className="text-emerald-400 font-bold">✓ Yes</span> : <span className="text-white/25">✗ No</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── SECTION 3: SMTP (Owner/Admin only) ── */}
            {canManageSmtp(role) && (
              <section id="smtp" className="scroll-mt-8 print-section">
                <div className="flex items-center gap-3 mb-5">
                  <Server className="w-7 h-7 text-purple-400 shrink-0" />
                  <h2 className="text-2xl font-bold text-white">3. SMTP Setup</h2>
                </div>
                <p className="text-white/75 leading-relaxed mb-4">As an <strong className="text-purple-300">{getRoleLabel(role)}</strong>, you can configure SMTP servers that power all email delivery on the platform.</p>
                <ul className="space-y-3 list-none pl-0 mb-6">
                  {[
                    { n: "1", title: "Open Settings › SMTP",   desc: "Click \"Settings\" in the sidebar, then select the SMTP tab." },
                    { n: "2", title: "Click Add SMTP Server",  desc: "Open the configuration form and fill in: Host, Port, Username, Password, From Name, and From Email." },
                    { n: "3", title: "Test Connection",         desc: "Click \"Test Connection\" to verify your credentials with a real SMTP handshake before saving." },
                    { n: "4", title: "Set as Active",           desc: "Save and toggle the record to Active. All campaigns and welcome emails will use this server automatically." },
                  ].map(p => <Step key={p.n} {...p} />)}
                </ul>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-xs text-white/70 border border-white/10 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-white/10 text-white">
                        <th className="text-left p-3">Provider</th><th className="text-left p-3">Host</th><th className="text-left p-3">Port</th><th className="text-left p-3">Encryption</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Gmail",    "smtp.gmail.com",     "587","TLS"],
                        ["Outlook",  "smtp.office365.com", "587","TLS"],
                        ["SendGrid", "smtp.sendgrid.net",  "587","TLS"],
                        ["Mailgun",  "smtp.mailgun.org",   "587","TLS"],
                        ["AWS SES",  "email-smtp.us-east-1.amazonaws.com","587","TLS"],
                        ["Zoho",     "smtp.zoho.com",      "465","SSL"],
                      ].map(([p,h,port,enc]) => (
                        <tr key={p} className="border-t border-white/5">
                          <td className="p-3 font-semibold text-white">{p}</td><td className="p-3 font-mono">{h}</td><td className="p-3">{port}</td><td className="p-3 text-emerald-400">{enc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Warning>For Gmail, use an App Password (not your Google account password) and enable 2-Factor Authentication first.</Warning>
              </section>
            )}

            {/* ── SECTION 4: CONTACTS (Owner/Admin/Member) ── */}
            {canManageContacts(role) && (
              <section id="contacts" className="scroll-mt-8 print-section">
                <div className="flex items-center gap-3 mb-5">
                  <Users className="w-7 h-7 text-purple-400 shrink-0" />
                  <h2 className="text-2xl font-bold text-white">4. Contacts &amp; Lists</h2>
                </div>
                <ul className="space-y-3 list-none pl-0 mb-6">
                  {[
                    { n: "1", title: "Add Single Contact", desc: "Go to Contacts → \"Add Contact\" → enter Name, Email → Save." },
                    { n: "2", title: "CSV Import",         desc: "Click \"Import CSV\" and upload a file with Email (required) and Name (optional) columns. The system deduplicates automatically." },
                    { n: "3", title: "Create Lists",       desc: "Go to Segments & Lists → \"New List\" → add contacts to it for use in targeted campaigns." },
                  ].map(p => <Step key={p.n} {...p} />)}
                </ul>
                <Warning>Never re-subscribe a contact who has unsubscribed without their explicit consent. This violates GDPR and CAN-SPAM regulations.</Warning>
              </section>
            )}

            {/* ── SECTION 5: TEMPLATES (Owner/Admin/Member) ── */}
            {canCreateCampaign(role) && (
              <section id="templates" className="scroll-mt-8 print-section">
                <div className="flex items-center gap-3 mb-5">
                  <Layout className="w-7 h-7 text-purple-400 shrink-0" />
                  <h2 className="text-2xl font-bold text-white">5. Email Templates</h2>
                </div>
                <ul className="space-y-3 list-none pl-0 mb-6">
                  {[
                    { n: "1", title: "Go to Templates", desc: "Click \"Templates\" in the sidebar → \"New Template\"." },
                    { n: "2", title: "Name Your Template", desc: "Give it a descriptive name (e.g., \"Monthly Newsletter\")." },
                    { n: "3", title: "Design the Email",  desc: "Use the WYSIWYG editor for text/images, or switch to HTML mode for custom code." },
                    { n: "4", title: "Use Merge Tags",    desc: "Insert {{contact_name}} or {{unsubscribe_url}} as dynamic placeholders filled per-recipient during send." },
                    { n: "5", title: "Send Test Email",   desc: "Enter your own email and click \"Send Test\" to preview the real rendering in your inbox." },
                    { n: "6", title: "Save",              desc: "Your template is now available when creating campaigns." },
                  ].map(p => <Step key={p.n} {...p} />)}
                </ul>
                <div className="bg-black/20 rounded-2xl p-5 border border-white/5 print-card tip-card">
                  <h5 className="mb-3 flex items-center gap-2 text-white font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Design Best Practices</h5>
                  <ul className="text-sm text-white/60 space-y-2 list-disc pl-5">
                    <li>Subject line: under 60 characters, no ALL CAPS</li>
                    <li>One clear call-to-action (CTA) button per email</li>
                    <li>Compress images to under 500 KB</li>
                    <li>Always preview on mobile — over 60% of opens are mobile</li>
                    <li>Unsubscribe links are inserted automatically — do not remove them</li>
                  </ul>
                </div>
              </section>
            )}

            {/* ── SECTION 6: CAMPAIGNS ── */}
            <section id="campaigns" className="scroll-mt-8 print-section">
              <div className="flex items-center gap-3 mb-5">
                <Send className="w-7 h-7 text-purple-400 shrink-0" />
                <h2 className="text-2xl font-bold text-white">6. Campaigns</h2>
              </div>
              {isViewer(role) ? (
                <>
                  <p className="text-white/75 leading-relaxed mb-4">As a <strong className="text-purple-300">Viewer</strong>, you can view all campaigns and their reports but cannot create or send campaigns.</p>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 print-card">
                    <p className="text-sm text-white/60">Navigate to <strong className="text-white">Campaigns</strong> in the sidebar to see all campaigns. Click any campaign to view its details, recipient list, and delivery statistics.</p>
                  </div>
                </>
              ) : (
                <>
                  <ul className="space-y-3 list-none pl-0 mb-6">
                    {[
                      { n:"1", title:"Go to Campaigns",     desc:"Click \"Campaigns\" in the sidebar → \"New Campaign\"." },
                      { n:"2", title:"Fill Campaign Details",desc:"Enter Campaign Name, Subject Line, and optional Preview Text (shown after subject in inbox)." },
                      { n:"3", title:"Choose Template",      desc:"Select a saved template. You can edit content per-campaign if needed." },
                      { n:"4", title:"Select Contact List",  desc:"Choose the list(s) to target. Recipient count is shown before sending." },
                      { n:"5", title:"Send Test Email",      desc:"Enter your own email and click \"Send Test\" — ALWAYS do this before the real send." },
                      { n:"6", title:"Send or Schedule",     desc:"Click \"Send Now\" for immediate delivery, or set a future date/time." },
                    ].map(p => <Step key={p.n} {...p} />)}
                  </ul>
                  <Warning>Once sent, a campaign cannot be recalled. Always verify your content with a test email first.</Warning>
                </>
              )}
            </section>

            {/* ── SECTION 7: REPORTING ── */}
            <section id="reports" className="scroll-mt-8 print-section">
              <div className="flex items-center gap-3 mb-5">
                <PieChart className="w-7 h-7 text-purple-400 shrink-0" />
                <h2 className="text-2xl font-bold text-white">7. Reporting &amp; Analytics</h2>
              </div>
              <p className="text-white/75 leading-relaxed mb-6">After a campaign is sent, click "View Report" for real-time and historical analytics.</p>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs text-white/70 border border-white/10 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-white/10 text-white">
                      <th className="text-left p-3">Metric</th><th className="text-left p-3">Formula</th><th className="text-left p-3">Target</th><th className="text-left p-3">If Low...</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Delivery Rate",    "Delivered / Sent × 100",    ">98%",   "Check SMTP config, clean list"],
                      ["Open Rate",        "Opened / Delivered × 100",  "20–25%", "Improve subject line & send time"],
                      ["Click Rate",       "Clicked / Delivered × 100", "2–5%+",  "Stronger CTA, better content"],
                      ["Bounce Rate",      "Bounced / Sent × 100",      "<2%",    "Remove invalid emails"],
                      ["Unsubscribe Rate", "Unsubs / Delivered × 100",  "<0.5%",  "Reduce frequency, improve content"],
                    ].map(([m,f,t,a]) => (
                      <tr key={m} className="border-t border-white/5">
                        <td className="p-3 font-semibold text-white">{m}</td>
                        <td className="p-3 font-mono text-purple-300 text-xs">{f}</td>
                        <td className="p-3 text-emerald-400 font-medium">{t}</td>
                        <td className="p-3 text-white/50">{a}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Tip>Best send times: Tuesday–Thursday, 9–11 AM or 1–3 PM in your audience's local timezone.</Tip>
            </section>

            {/* ── SECTION 8: TEAM (Owner/Admin only) ── */}
            {canManageTeam(role) && (
              <section id="team" className="scroll-mt-8 print-section">
                <div className="flex items-center gap-3 mb-5">
                  <ShieldCheck className="w-7 h-7 text-purple-400 shrink-0" />
                  <h2 className="text-2xl font-bold text-white">8. Team Management</h2>
                </div>
                <ul className="space-y-3 list-none pl-0 mb-6">
                  {[
                    { n:"1", title:"Go to Team Page",     desc:"Click \"Team\" in the sidebar." },
                    { n:"2", title:"Fill in the Form",    desc:"Enter the new member's Email, assign a Role, and set a Password." },
                    { n:"3", title:"Click Add Member",    desc:"The account is created immediately and a Welcome Email with credentials is sent automatically via your active SMTP." },
                    { n:"4", title:"Edit / Remove",       desc:"Use the Edit (pencil) button to update roles or passwords, or remove a member to revoke access instantly." },
                  ].map(p => <Step key={p.n} {...p} />)}
                </ul>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-white/70 border border-white/10 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-white/10 text-white">
                        <th className="text-left p-3">Role</th><th className="text-center p-3">Campaigns</th><th className="text-center p-3">Contacts</th><th className="text-center p-3">SMTP</th><th className="text-center p-3">Team</th><th className="text-center p-3">Audit Logs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { r:"Owner",  c:"✅ Full",  co:"✅ Full", s:"✅ Full", t:"✅ Full", a:"✅ Full" },
                        { r:"Admin",  c:"✅ Full",  co:"✅ Full", s:"✅ Full", t:"✅ Full", a:"✅ Full" },
                        { r:"Member", c:"✅ Create",co:"✅ Write",s:"❌",      t:"❌",      a:"❌" },
                        { r:"Viewer", c:"👁 View",  co:"👁 View", s:"❌",      t:"❌",      a:"❌" },
                      ].map(({ r,c,co,s,t,a }) => (
                        <tr key={r} className="border-t border-white/5">
                          <td className="p-3 font-bold text-purple-300">{r}</td>
                          <td className="p-3 text-center">{c}</td><td className="p-3 text-center">{co}</td>
                          <td className="p-3 text-center">{s}</td><td className="p-3 text-center">{t}</td><td className="p-3 text-center">{a}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── SECTION 9: AUDIT (Owner/Admin only) ── */}
            {canViewAuditLogs(role) && (
              <section id="audit" className="scroll-mt-8 print-section">
                <div className="flex items-center gap-3 mb-5">
                  <History className="w-7 h-7 text-purple-400 shrink-0" />
                  <h2 className="text-2xl font-bold text-white">9. Security &amp; Audit Logs</h2>
                </div>
                <p className="text-white/75 leading-relaxed mb-4">Every platform action is recorded in immutable Audit Logs. View them at Audit Logs in the sidebar.</p>
                <div className="space-y-3">
                  {[
                    { tip: "Regularly review logs for unexpected actions (e.g. campaigns sent outside business hours)." },
                    { tip: "Remove departed team members immediately via the Team page to revoke access." },
                    { tip: "Rotate SMTP credentials periodically and whenever a team member with SMTP access leaves." },
                    { tip: "Assign the least-privileged role. Not all users need Admin access." },
                  ].map(({ tip }, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl print-card">
                      <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-white/60">{tip}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── SECTION 10: FAQ ── */}
            <section id="faq" className="scroll-mt-8 print-section">
              <div className="flex items-center gap-3 mb-5">
                <HelpCircle className="w-7 h-7 text-purple-400 shrink-0" />
                <h2 className="text-2xl font-bold text-white">FAQ &amp; Troubleshooting</h2>
              </div>
              <div className="space-y-4">
                {[
                  { show: true,                 q: "I forgot my password. How do I reset it?",                  a: "Ask your workspace Owner or Admin to go to Team → Edit Member → set a new password for your account." },
                  { show: true,                 q: "I didn't receive my Welcome Email.",                         a: `Check your Spam/Junk folder. If it's not there, ask your admin to verify an active SMTP server is configured and re-add your account.` },
                  { show: true,                 q: "How do I change my email address?",                         a: "Contact your workspace Owner. They can update your account details from the Team management page." },
                  { show: canCreateCampaign(role), q: "My test email arrives in Spam. How do I fix this?",      a: "Ensure your domain has SPF, DKIM, and DMARC DNS records. Use a reputable SMTP provider. Avoid spam trigger words (\"Free!\", \"Winner!\") in subject lines." },
                  { show: canManageSmtp(role),  q: "SMTP test connection keeps failing.",                        a: "Verify the host, port, and credentials. For Gmail, use an App Password (not your account password). Check if port 587 is open on your network firewall." },
                  { show: canManageTeam(role),  q: "Welcome email wasn't sent when I added a member.",          a: "Ensure at least one SMTP server is toggled Active in Settings › SMTP. The welcome email uses your active SMTP configuration to send." },
                  { show: true,                 q: "Who do I contact for support?",                             a: "Contact your workspace Owner or Administrator. They have full access to all platform settings and logs." },
                ].filter(f => f.show).map(({ q, a }, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 print-card">
                    <p className="font-bold text-white text-sm mb-2 flex items-start gap-2"><span className="text-purple-400 shrink-0">Q:</span>{q}</p>
                    <p className="text-sm text-white/60 leading-relaxed flex items-start gap-2"><span className="text-emerald-400 shrink-0">A:</span>{a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Document Footer */}
            <div className="pt-10 border-t border-white/10 flex items-center justify-between text-xs text-white/30">
              <span className="font-bold uppercase tracking-widest">Bombino Express &copy; {new Date().getFullYear()}</span>
              <span>Personal guide for {userEmail} · {getRoleLabel(role)} · {today}</span>
            </div>
            <div className="print-footer-bar hidden text-center" style={{ fontSize: "8pt", color: "#6b7280", borderTop: "1pt solid #e5e7eb", paddingTop: "6pt" }}>
              Bombino Express · Personal User Guide · {getRoleLabel(role)} · {today} · Confidential
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {emailModal && (
        <div className="screen-only fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e1e2e] border border-white/20 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" /> Email My Guide
              </h2>
              <button onClick={() => setEmailModal(false)} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEmail} className="p-6 space-y-5">
              <p className="text-sm text-white/60">Send your personalised <strong className="text-purple-300">{getRoleLabel(role)}</strong> guide to the address below.</p>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2 tracking-widest">Recipient Address</label>
                <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all" />
              </div>
              <button type="submit" disabled={sending || sent}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : sent ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                {sending ? "Sending..." : sent ? "Sent Successfully!" : "Send My Guide"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
