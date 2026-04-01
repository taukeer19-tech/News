"use client";

import { useEffect, useState } from "react";
import {
  Users, Send, TrendingDown, MailOpen, MousePointerClick,
  ArrowUpRight, ArrowDownRight, Plus, FileText, Settings,
  Activity, Zap, Clock, CheckCircle2, AlertCircle, BarChart3,
  ChevronRight, ShieldCheck
} from "lucide-react";
import Link from "next/link";

type Campaign = {
  id: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sent: number;
  opened: number;
  clicked: number;
};

type Metrics = {
  totalContacts: number;
  totalCampaigns: number;
  unsubscribes: number;
  recentCampaigns: Campaign[];
};

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-white/10 rounded-full" />
          <div className="h-8 w-16 bg-white/10 rounded-lg" />
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-2xl" />
      </div>
      <div className="h-3 w-32 bg-white/10 rounded-full" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse flex items-center gap-4">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-48 bg-white/10 rounded-full" />
        <div className="h-2.5 w-32 bg-white/10 rounded-full" />
      </div>
      <div className="h-6 w-16 bg-white/10 rounded-full" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    sent:     { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: <CheckCircle2 className="w-3 h-3" />, label: "Sent" },
    sending:  { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",   icon: <Zap className="w-3 h-3" />,          label: "Sending" },
    draft:    { color: "bg-gray-500/20 text-gray-300 border-gray-500/30",          icon: <Clock className="w-3 h-3" />,         label: "Draft" },
    failed:   { color: "bg-red-500/20 text-red-300 border-red-500/30",             icon: <AlertCircle className="w-3 h-3" />,   label: "Failed" },
  };
  const cfg = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.ok ? r.json() : null)
      .then(data => { setMetrics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Derived stats
  const totalSent     = metrics?.recentCampaigns.reduce((s, c) => s + c.sent, 0) ?? 0;
  const totalOpened   = metrics?.recentCampaigns.reduce((s, c) => s + c.opened, 0) ?? 0;
  const totalClicked  = metrics?.recentCampaigns.reduce((s, c) => s + c.clicked, 0) ?? 0;
  const avgOpenRate   = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const avgClickRate  = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;

  const statCards = [
    {
      label: "Total Contacts",
      value: metrics?.totalContacts ?? 0,
      icon: <Users className="w-6 h-6" />,
      gradient: "from-violet-500 to-indigo-600",
      glow: "shadow-violet-500/25",
      trend: null,
      link: "/contacts",
    },
    {
      label: "Campaigns Sent",
      value: metrics?.totalCampaigns ?? 0,
      icon: <Send className="w-6 h-6" />,
      gradient: "from-cyan-500 to-blue-600",
      glow: "shadow-cyan-500/25",
      trend: null,
      link: "/campaigns",
    },
    {
      label: "Avg. Open Rate",
      value: `${avgOpenRate}%`,
      icon: <MailOpen className="w-6 h-6" />,
      gradient: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/25",
      trend: avgOpenRate >= 20 ? "up" : "down",
      link: "/campaigns",
    },
    {
      label: "Avg. Click Rate",
      value: `${avgClickRate}%`,
      icon: <MousePointerClick className="w-6 h-6" />,
      gradient: "from-amber-500 to-orange-500",
      glow: "shadow-amber-500/25",
      trend: avgClickRate >= 5 ? "up" : "down",
      link: "/campaigns",
    },
    {
      label: "Unsubscribes",
      value: metrics?.unsubscribes ?? 0,
      icon: <TrendingDown className="w-6 h-6" />,
      gradient: "from-rose-500 to-red-600",
      glow: "shadow-rose-500/25",
      trend: (metrics?.unsubscribes ?? 0) > 0 ? "down" : null,
      link: "/contacts",
    },
    {
      label: "Emails Sent",
      value: totalSent,
      icon: <Activity className="w-6 h-6" />,
      gradient: "from-pink-500 to-fuchsia-600",
      glow: "shadow-pink-500/25",
      trend: null,
      link: "/campaigns",
    },
  ];

  const quickActions = [
    { label: "New Campaign",  href: "/campaigns",  icon: <Send className="w-5 h-5" />,     color: "from-indigo-500 to-violet-500" },
    { label: "Add Contact",   href: "/contacts",   icon: <Plus className="w-5 h-5" />,     color: "from-cyan-500 to-blue-500" },
    { label: "New Template",  href: "/templates",  icon: <FileText className="w-5 h-5" />, color: "from-emerald-500 to-teal-500" },
    { label: "SMTP Settings", href: "/settings",   icon: <Settings className="w-5 h-5" />, color: "from-amber-500 to-orange-500" },
    { label: "Compliance Test", href: "/compliance", icon: <ShieldCheck className="w-5 h-5" />, color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto min-h-screen space-y-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest mb-1">Overview</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="text-white/60 mt-1">Your email marketing performance at a glance.</p>
        </div>
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold px-5 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </Link>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card, i) => (
            <Link href={card.link} key={i} className="group block">
              <div className={`relative bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 rounded-3xl p-6 shadow-xl ${card.glow} transition-all duration-300 overflow-hidden hover:-translate-y-0.5`}>
                {/* Glow blob */}
                <div className={`absolute -right-6 -top-6 w-28 h-28 rounded-full bg-gradient-to-br ${card.gradient} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />

                <div className="relative z-10 flex justify-between items-start mb-5">
                  <p className="text-white/60 text-sm font-medium">{card.label}</p>
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                    {card.icon}
                  </div>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{card.value}</span>
                  {card.trend === "up" && (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-500/15 px-2.5 py-1 rounded-full">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Good
                    </span>
                  )}
                  {card.trend === "down" && (
                    <span className="flex items-center gap-1 text-rose-400 text-xs font-semibold bg-rose-500/15 px-2.5 py-1 rounded-full">
                      <ArrowDownRight className="w-3.5 h-3.5" /> Low
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        }
      </div>

      {/* ── Quick Actions + Recent Campaigns ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            {quickActions.map((a, i) => (
              <Link key={i} href={a.href}
                className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 transition-all duration-200">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                  {a.icon}
                </div>
                <span className="text-white/80 group-hover:text-white font-medium text-sm flex-1 transition-colors">{a.label}</span>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="lg:col-span-2 bg-white/[0.06] border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Recent Campaigns</h2>
            </div>
            <Link href="/campaigns" className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            ) : metrics && metrics.recentCampaigns.length > 0 ? (
              metrics.recentCampaigns.slice(0, 5).map(camp => {
                const openRate  = camp.sent > 0   ? Math.round((camp.opened  / camp.sent)   * 100) : 0;
                const clickRate = camp.opened > 0 ? Math.round((camp.clicked / camp.opened) * 100) : 0;
                return (
                  <div key={camp.id} className="group bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-4 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Send className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{camp.subject}</p>
                          <p className="text-white/40 text-xs mt-0.5">{camp.totalRecipients.toLocaleString()} recipients</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={camp.status} />
                        <Link href={`/campaigns/${camp.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1 rounded-lg text-xs font-medium">
                          Report
                        </Link>
                      </div>
                    </div>

                    {/* Open & Click rates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/40 flex items-center gap-1"><MailOpen className="w-3 h-3" /> Open Rate</span>
                          <span className="text-emerald-400 font-semibold">{openRate}%</span>
                        </div>
                        <ProgressBar value={openRate} color="bg-gradient-to-r from-emerald-500 to-teal-400" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/40 flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Click Rate</span>
                          <span className="text-purple-400 font-semibold">{clickRate}%</span>
                        </div>
                        <ProgressBar value={clickRate} color="bg-gradient-to-r from-purple-500 to-fuchsia-500" />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* ── Empty State ── */
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mb-4">
                  <Send className="w-7 h-7 text-indigo-400" />
                </div>
                <p className="text-white font-semibold mb-1">No campaigns yet</p>
                <p className="text-white/40 text-sm mb-5">Create your first campaign to see performance data here.</p>
                <Link
                  href="/campaigns"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25"
                >
                  <Plus className="w-4 h-4" /> Create Campaign
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Rate Summary Bar ───────────────────────────────────── */}
      {!loading && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Overall Open Rate",  value: avgOpenRate,  color: "bg-gradient-to-r from-emerald-500 to-teal-400",     icon: <MailOpen className="w-4 h-4 text-emerald-400" />,        benchmark: "Industry avg. 21%" },
            { label: "Overall Click Rate", value: avgClickRate, color: "bg-gradient-to-r from-purple-500 to-fuchsia-500",   icon: <MousePointerClick className="w-4 h-4 text-purple-400" />, benchmark: "Industry avg. 6%" },
            { label: "Delivery Rate",      value: totalSent > 0 ? Math.round((totalSent / Math.max(metrics.recentCampaigns.reduce((s,c)=>s+c.totalRecipients,0),1)) * 100) : 0,
              color: "bg-gradient-to-r from-cyan-500 to-blue-500", icon: <Send className="w-4 h-4 text-cyan-400" />, benchmark: "Target ≥ 95%" },
          ].map((row, i) => (
            <div key={i} className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {row.icon}
                  <p className="text-white/70 text-xs font-medium">{row.label}</p>
                </div>
                <span className="text-white font-bold text-lg">{row.value}%</span>
              </div>
              <ProgressBar value={row.value} color={row.color} />
              <p className="text-white/30 text-xs mt-2">{row.benchmark}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
