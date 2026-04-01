"use client";

import { useEffect, useState, useRef } from "react";
import { Users, Search, PlusCircle, Trash2, Edit2, Upload, Download, Loader2 } from "lucide-react";
import Papa from "papaparse";

type Contact = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  customFields: string | null;
  unsubscribed: boolean;
  createdAt: string;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const fetchContacts = async () => {
    setLoading(true);
    const res = await fetch(`/api/contacts?_t=${Date.now()}`);
    if (res.ok) {
      setContacts(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const openForm = (contact?: Contact) => {
    if (contact) {
      setEditId(contact.id);
      setEmail(contact.email);
      setFirstName(contact.firstName || "");
      setLastName(contact.lastName || "");
    } else {
      setEditId(null);
      setEmail("");
      setFirstName("");
      setLastName("");
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/contacts/${editId}` : "/api/contacts";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName, lastName }),
    });

    if (res.ok) {
      setShowModal(false);
      fetchContacts();
    } else {
      alert("Failed to save contact.");
    }
  };

  const deleteContact = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (id: string) => {
    setDeleteConfirmId(null);
    setContacts(prev => prev.filter(c => c.id !== id));
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete contact.");
      fetchContacts();
    }
  };

  // CSV Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
              const data = results.data as Array<{email?: string, firstName?: string, lastName?: string}>;
              let added = 0;
              setLoading(true);
              for (const row of data) {
                  if (row.email) {
                      try {
                          await fetch("/api/contacts", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: row.email, firstName: row.firstName || "", lastName: row.lastName || "" })
                          });
                          added++;
                      } catch (err) {}
                  }
              }
              alert(`Successfully imported ${added} contacts.`);
              fetchContacts();
              if (fileInputRef.current) fileInputRef.current.value = "";
          }
      });
  };

  // CSV Export
  const exportCSV = () => {
      const csvData = contacts.map(c => ({
          Email: c.email,
          FirstName: c.firstName || "",
          LastName: c.lastName || "",
          Unsubscribed: c.unsubscribed ? "Yes" : "No",
          Joined: new Date(c.createdAt).toLocaleDateString()
      }));
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "contacts_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Example CSV
  const downloadExampleCSV = () => {
      const csv = "email,firstName,lastName\njohn@example.com,John,Doe\njane@example.com,Jane,Smith";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "example_format.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const filteredContacts = contacts.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="w-10 h-10" />
            Contacts Database
          </h1>
          <p className="text-white/70 mt-2 text-lg">Manage, import, and export your email subscribers.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <div className="flex flex-col md:flex-row items-center gap-2">
            <button 
               onClick={() => fileInputRef.current?.click()}
               className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all backdrop-blur-sm text-sm font-semibold"
            >
               <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button onClick={downloadExampleCSV} className="text-white/40 hover:text-indigo-400 text-xs underline cursor-pointer transition-colors px-1">
               Example Format
            </button>
          </div>
          
          <button 
             onClick={exportCSV}
             className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all backdrop-blur-sm text-sm font-semibold"
          >
             <Download className="w-4 h-4" /> Export
          </button>
          <button 
             onClick={() => openForm()}
             className="bg-indigo-500 hover:bg-indigo-600 text-white border border-indigo-400/30 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 backdrop-blur-md font-semibold"
          >
            <PlusCircle className="w-5 h-5" /> Add Contact
          </button>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
          <input 
            type="text" 
            placeholder="Search contacts by email or name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        {loading ? (
          <div className="text-center text-white/50 py-20 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              Loading contacts...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                  <th className="pb-4 pt-2 pl-4 font-semibold">Contact Info</th>
                  <th className="pb-4 pt-2 font-semibold">Status</th>
                  <th className="pb-4 pt-2 font-semibold">Date Added</th>
                  <th className="pb-4 pt-2 font-semibold text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 pl-4">
                      <div className="text-white font-medium">{contact.email}</div>
                      <div className="text-white/50 text-sm mt-0.5">{contact.firstName} {contact.lastName}</div>
                    </td>
                    <td className="py-4">
                      {contact.unsubscribed ? (
                          <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold">Unsubscribed</span>
                      ) : (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">Subscribed</span>
                      )}
                    </td>
                    <td className="py-4 text-white/70 text-sm">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right pr-4 flex justify-end gap-2">
                      <button onClick={() => openForm(contact)} className="p-2 text-indigo-300 hover:bg-indigo-500/20 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteContact(contact.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-white/50 border border-white/5 border-dashed rounded-xl">
                      No contacts found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative w-full max-w-sm bg-gray-900 border border-red-500/20 rounded-2xl p-6 shadow-2xl z-10 transition-all">
            <h3 className="text-xl font-bold text-white mb-2">Delete Contact</h3>
            <p className="text-white/70 text-sm mb-8 leading-relaxed">Are you sure you want to permanently delete this contact?</p>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all font-medium">Cancel</button>
              <button onClick={() => confirmDelete(deleteConfirmId)} className="px-5 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all font-medium">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-indigo-900/40">
            <h2 className="text-2xl font-bold text-white mb-6">{editId ? 'Edit Contact' : 'Add New Contact'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Email Address *</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">First Name</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Last Name</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
              </div>

              <div className="flex gap-3 justify-end mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-white/70 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl transition-colors font-medium shadow-lg shadow-indigo-500/20">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
