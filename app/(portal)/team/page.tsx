"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, ShieldCheck, Trash2, Crown, Eye, UserCog, PlusCircle, Send, Loader2, Edit2, X, Check, Lock } from "lucide-react";
import { canManageTeam, canChangeRoles, getRoleLabel, getRoleBadgeClass, type UserRole } from "@/lib/permissions";

type Member = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export default function TeamPage() {
  const { data: session } = useSession();
  const myRole = (((session?.user as any)?.role) || "owner") as UserRole;
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({ role: "", password: "" });
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    const res = await fetch("/api/workspace/members");
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteResult(null);
    const res = await fetch("/api/workspace/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: inviteEmail, 
        role: inviteRole,
        password: invitePassword || undefined
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setInviteResult(`✅ User ${inviteEmail} added and welcome email sent successfully.`);
      setInviteEmail("");
      setInvitePassword("");
      fetchMembers();
    } else {
      setInviteResult(`❌ ${data.error || "Failed to add user"}`);
    }
    setInviting(false);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setEditForm({ role: member.role, password: "" });
  };

  const saveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSaving(true);
    const res = await fetch(`/api/workspace/members/${editingMember.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditingMember(null);
      fetchMembers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update member");
    }
    setSaving(false);
  };

  const changeRole = async (memberId: string, newRole: string) => {
    const res = await fetch(`/api/workspace/members/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) fetchMembers();
    else alert("Failed to change role");
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Remove this member from the workspace?")) return;
    const res = await fetch(`/api/workspace/members/${memberId}`, { method: "DELETE" });
    if (res.ok) fetchMembers();
    else alert("Failed to remove member");
  };

  const roleIcon = (role: string) => {
    if (role === "owner") return <Crown className="w-3 h-3" />;
    if (role === "admin") return <ShieldCheck className="w-3 h-3" />;
    if (role === "viewer") return <Eye className="w-3 h-3" />;
    return <UserCog className="w-3 h-3" />;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
          <Users className="w-10 h-10 text-purple-400" />
          Team Management
        </h1>
        <p className="text-white/60 mt-2 text-lg">Add new users and manage access base roles within your workspace.</p>
      </div>

      {/* Invite Form */}
      {canManageTeam(myRole) && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl mb-8">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-purple-400" /> Add User and Access Base Role</h2>
          <form onSubmit={sendInvite} className="flex flex-wrap gap-3">
            <input
              type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 min-w-52 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none">
              <option value="admin">Administrator</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer (Read-only)</option>
            </select>
            <input
              type="password" required value={invitePassword} onChange={e => setInvitePassword(e.target.value)}
              placeholder="Required: Set Password"
              className="w-48 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <button type="submit" disabled={inviting}
              className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50">
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Add Member & Email Details
            </button>
          </form>
          {inviteResult && (
            <div className={`mt-4 text-sm p-3 rounded-xl border ${inviteResult.startsWith("✅") ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
              {inviteResult}
            </div>
          )}
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-5">Workspace Members</h2>
        {loading ? (
          <div className="text-center py-10 text-white/40 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" /> Loading members...
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-10 text-white/30 italic text-sm">No additional members in this workspace yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Member</th>
                <th className="pb-3 font-semibold">Role</th>
                {canChangeRoles(myRole) && <th className="pb-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-4">
                    <div className="text-white font-medium">{member.email}</div>
                    <div className="text-white/40 text-xs">{member.name || "No name"}</div>
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClass(member.role as UserRole)}`}>
                      {roleIcon(member.role)} {getRoleLabel(member.role as UserRole)}
                    </span>
                  </td>
                  <td className="py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canManageTeam(myRole) && (
                      <button onClick={() => handleEdit(member)} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canChangeRoles(myRole) && member.role !== "owner" && (
                      <button onClick={() => removeMember(member.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Legend */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white/60 text-sm font-semibold mb-4 uppercase tracking-wider">Role Permissions Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { role: "owner", desc: "Full control, billing, workspace" },
            { role: "admin", desc: "Manage campaigns, contacts, SMTP" },
            { role: "member", desc: "Create campaigns, manage contacts" },
            { role: "viewer", desc: "Read-only access to all data" },
          ].map(({ role, desc }) => (
            <div key={role} className="bg-black/20 rounded-xl p-3">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border mb-2 ${getRoleBadgeClass(role as UserRole)}`}>
                {roleIcon(role)} {getRoleLabel(role as UserRole)}
              </span>
              <p className="text-white/40 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e1e2e] border border-white/20 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Team Member</h2>
                <p className="text-xs text-white/40 mt-1">{editingMember.email}</p>
              </div>
              <button onClick={() => setEditingMember(null)} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveMember} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-2 ml-1 tracking-widest">Access Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  disabled={editingMember.role === "owner"}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all appearance-none cursor-pointer"
                >
                  <option value="admin" className="bg-[#1e1e2e]">Administrator</option>
                  <option value="member" className="bg-[#1e1e2e]">Member</option>
                  <option value="viewer" className="bg-[#1e1e2e]">Viewer (Read-only)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-2 ml-1 tracking-widest">Reset Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="password"
                    placeholder="New password (leave blank to keep current)"
                    value={editForm.password}
                    onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingMember(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
