"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ClipboardList, Loader2, Info } from "lucide-react";
import { canViewAuditLogs, type UserRole } from "@/lib/permissions";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  createdAt: string;
  metadata?: Record<string, any>;
};

const ACTION_COLORS: Record<string, string> = {
  "contact.created":   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "contact.deleted":   "text-red-400 bg-red-500/10 border-red-500/20",
  "campaign.created":  "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "campaign.sent":     "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "campaign.deleted":  "text-red-400 bg-red-500/10 border-red-500/20",
  "member.invited":    "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  "member.removed":    "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "smtp.created":      "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  "smtp.deleted":      "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const myRole = (((session?.user as any)?.role) || "owner") as UserRole;
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canViewAuditLogs(myRole)) { setLoading(false); return; }
    fetch("/api/audit-logs?limit=100")
      .then(r => r.ok ? r.json() : [])
      .then(data => setLogs(data))
      .finally(() => setLoading(false));
  }, [myRole]);

  if (!canViewAuditLogs(myRole)) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-white/40">
        <Info className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-white/60">Access Denied</h2>
        <p>You need Admin or Owner role to view audit logs.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
          <ClipboardList className="w-10 h-10 text-indigo-400" />
          Audit Logs
        </h1>
        <p className="text-white/60 mt-2 text-lg">Track all critical actions performed within your workspace.</p>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        {loading ? (
          <div className="text-center py-20 text-white/40 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" /> Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-white/30 italic">No audit logs yet. Actions will appear here.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="pb-3 pl-2 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Entity</th>
                  <th className="pb-3 font-semibold">Details</th>
                  <th className="pb-3 font-semibold text-right pr-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pl-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${ACTION_COLORS[log.action] || "text-white/60 bg-white/5 border-white/10"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-white/60 text-sm">
                      <span className="capitalize">{log.entityType}</span>
                    </td>
                    <td className="py-3 text-white/40 text-xs font-mono truncate max-w-48" title={log.entityId}>
                      {log.metadata ? JSON.stringify(log.metadata) : log.entityId}
                    </td>
                    <td className="py-3 text-right pr-2 text-white/40 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
