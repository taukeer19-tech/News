"use client";

import { useEffect, useState } from "react";
import { Users, Trash2, Calendar, LayoutDashboard, Loader2, ShieldCheck, Edit2, X, Check } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  _count: {
      contacts: number;
      campaigns: number;
  };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", password: "" });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
        setUsers(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email,
      role: user.role,
      password: "" 
    });
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    
    const res = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      setEditingUser(null);
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update user");
    }
    setSaving(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/users/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update status");
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("CRITICAL WARNING: Are you sure you want to permanently delete this tenant? All their contacts, campaigns, and templates will be destroyed.")) return;
    
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
        fetchUsers();
    } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Approved</span>;
      case "pending":
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Pending Approval</span>;
      case "suspended":
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Suspended</span>;
      default:
        return <span className="bg-white/10 text-white/50 border border-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="w-10 h-10" />
            Registered Tenants
        </h1>
        <p className="text-white/60 mt-2 text-lg">Manage platform users, view usage, and moderate accounts.</p>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        {loading ? (
             <div className="text-center text-white/50 py-20 flex flex-col items-center gap-3">
                 <Loader2 className="w-8 h-8 animate-spin text-red-400" />
                 Loading platform tenants...
             </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                  <th className="pb-4 pt-2 pl-4 font-semibold">User Info</th>
                  <th className="pb-4 pt-2 font-semibold">Role / Status</th>
                  <th className="pb-4 pt-2 font-semibold">Usage Limits</th>
                  <th className="pb-4 pt-2 font-semibold">Join Date</th>
                  <th className="pb-4 pt-2 font-semibold text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 pl-4">
                      <div className="text-white font-medium">{user.email}</div>
                      <div className="text-white/50 text-xs mt-0.5">{user.name || "No name provided"}</div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col gap-2">
                        {user.role === "admin" || user.role === "owner" ? (
                            <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><ShieldCheck className="w-3 h-3"/> {user.role}</span>
                        ) : (
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold w-fit">Member</span>
                        )}
                        {getStatusBadge(user.status || "approved")}
                      </div>
                    </td>
                    <td className="py-4">
                        <div className="flex flex-col gap-1 text-xs text-white/60">
                            <span className="flex gap-2 items-center"><Users className="w-3 h-3 text-emerald-400"/> {user._count.contacts} Contacts</span>
                            <span className="flex gap-2 items-center"><LayoutDashboard className="w-3 h-3 text-purple-400"/> {user._count.campaigns} Campaigns</span>
                        </div>
                    </td>
                    <td className="py-4 text-white/70 text-sm whitespace-nowrap">
                      <div className="flex gap-2 items-center">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.role !== "owner" && (
                          <>
                            <button onClick={() => handleEdit(user)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Edit User Details">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {user.status === "pending" && (
                              <button 
                                onClick={() => updateStatus(user.id, "approved")}
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                            )}
                            {user.status === "approved" && (
                              <button 
                                onClick={() => updateStatus(user.id, "suspended")}
                                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-bold transition-all"
                              >
                                Suspend
                              </button>
                            )}
                            {user.status === "suspended" && (
                              <button 
                                onClick={() => updateStatus(user.id, "approved")}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all"
                              >
                                Reactivate
                              </button>
                            )}
                            <button onClick={() => deleteUser(user.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-all" title="Delete Tenant Data">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e1e2e] border border-white/20 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit User Settings</h2>
              <button onClick={() => setEditingUser(null)} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-1.5 ml-1">Full Name</label>
                <input
                  type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="Enter user name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-1.5 ml-1">Email Address</label>
                <input
                  type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-1.5 ml-1">Account Role</label>
                <select
                  value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none"
                >
                  <option value="member" className="bg-[#1e1e2e]">Member</option>
                  <option value="admin" className="bg-[#1e1e2e]">Admin</option>
                  <option value="viewer" className="bg-[#1e1e2e]">Viewer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-1.5 ml-1">Reset Password</label>
                <input
                  type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="Enter new password to reset"
                />
                <p className="text-[10px] text-white/30 mt-1 ml-1">Leave blank to keep current password.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
