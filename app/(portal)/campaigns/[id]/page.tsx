"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Users, Send, MailOpen, MousePointerClick, AlertTriangle, FileText, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ReportData = {
    campaign: any;
    stats: {
        total: number;
        sent: number;
        opened: number;
        clicked: number;
        bounced: number;
        pending: number;
    };
    chartData: Array<{ date: string, activity: number }>;
    recipients: Array<{
        id: string;
        email: string;
        name: string;
        status: string;
        error: string | null;
        sentAt: string | null;
        openedAt: string | null;
        clickedAt: string | null;
    }>;
};

export default function CampaignReportPage() {
    const params = useParams();
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            if (!params?.id) return;
            const res = await fetch(`/api/campaigns/${params.id}/report`);
            if (res.ok) {
                setData(await res.json());
            }
            setLoading(false);
        };
        fetchReport();
    }, [params]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center p-8 text-white/50 animate-pulse text-xl">Loading campaign report...</div>;
    }

    if (!data) {
        return <div className="min-h-screen flex items-center justify-center p-8 text-white text-xl">Campaign not found or error loading report.</div>;
    }

    const { campaign, stats, recipients, chartData } = data;

    const openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0;
    const clickRate = stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0;
    const bounceRate = stats.total > 0 ? Math.round((stats.bounced / stats.total) * 100) : 0;

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'sent': return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Sent</span>;
            case 'opened': return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Opened</span>;
            case 'clicked': return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Clicked</span>;
            case 'failed':
            case 'bounced': return <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">{status}</span>;
            default: return <span className="bg-gray-500/20 text-gray-300 border border-gray-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">{status}</span>;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <Link href="/campaigns" className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors mb-8 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Campaigns
            </Link>

            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-4xl font-bold text-white tracking-tight">{campaign.subject}</h1>
                        <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-xs uppercase tracking-wider font-bold">
                            {campaign.status}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/60 text-sm">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                        {campaign.smtpConfig && <span className="flex items-center gap-1.5"><Send className="w-4 h-4" /> Provider: {campaign.smtpConfig.name}</span>}
                        {campaign.template && <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Template: {campaign.template.name}</span>}
                    </div>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-white/50" /> Recipients</p>
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Send className="w-4 h-4 text-blue-400" /> Sent</p>
                    <p className="text-3xl font-bold text-blue-400">{stats.sent}</p>
                    <p className="text-white/40 text-xs mt-1">{stats.pending} pending</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><MailOpen className="w-4 h-4 text-emerald-400" /> Opened</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-emerald-400">{stats.opened}</p>
                        <p className="text-emerald-400/70 text-sm font-semibold mb-1">{openRate}% rate</p>
                    </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><MousePointerClick className="w-4 h-4 text-purple-400" /> Clicked</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-purple-400">{stats.clicked}</p>
                        <p className="text-purple-400/70 text-sm font-semibold mb-1">{clickRate}% rate</p>
                    </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 border-red-500/20">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Bounced</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-red-400">{stats.bounced}</p>
                        <p className="text-red-400/70 text-sm font-semibold mb-1">{bounceRate}% rate</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Chart Area */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:col-span-2">
                    <h2 className="text-xl font-bold text-white mb-6">Activity Timeline</h2>
                    {chartData.length > 0 ? (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                                    <XAxis dataKey="date" stroke="#ffffff50" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                                    <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff' }} 
                                        itemStyle={{ color: '#818cf8' }}
                                    />
                                    <Area type="monotone" dataKey="activity" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-white/30 border border-white/5 rounded-2xl border-dashed">
                            No activity data available yet.
                        </div>
                    )}
                </div>

                {/* Email Preview Snippet */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col">
                    <h2 className="text-xl font-bold text-white mb-6">Email Content Preview</h2>
                    <div className="bg-white rounded-2xl p-4 flex-1 overflow-y-auto min-h-[16rem]">
                         <div 
                           className="text-black text-sm" 
                           dangerouslySetInnerHTML={{ __html: campaign.contentHtml.substring(0, 500) + (campaign.contentHtml.length > 500 ? '...' : '') }} 
                         />
                    </div>
                </div>
            </div>

            {/* Recipient Details */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                 <h2 className="text-xl font-bold text-white mb-6">Recipient Detailed Report</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                        <th className="pb-4 pt-2 pl-4 font-semibold">Contact</th>
                        <th className="pb-4 pt-2 font-semibold">Status</th>
                        <th className="pb-4 pt-2 font-semibold">Last Activity</th>
                        <th className="pb-4 pt-2 font-semibold pr-4">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {recipients.map(r => (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 pl-4">
                                <div className="text-white font-medium">{r.email}</div>
                                {r.name && <div className="text-white/50 text-xs">{r.name}</div>}
                            </td>
                            <td className="py-4">
                                {getStatusBadge(r.status)}
                            </td>
                            <td className="py-4 text-white/70 text-sm">
                                {r.clickedAt ? new Date(r.clickedAt).toLocaleString() :
                                 r.openedAt ? new Date(r.openedAt).toLocaleString() :
                                 r.sentAt ? new Date(r.sentAt).toLocaleString() : '-'}
                            </td>
                            <td className="py-4 pr-4">
                                {r.error ? (
                                    <span className="text-red-400 text-xs max-w-[200px] truncate block" title={r.error}>{r.error}</span>
                                ) : (
                                    <span className="text-white/30 text-xs">-</span>
                                )}
                            </td>
                        </tr>
                        ))}
                        {recipients.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-center py-8 text-white/50">
                            No recipients processed yet.
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
