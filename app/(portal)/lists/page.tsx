"use client";

import { useEffect, useState } from "react";
import { ListTodo, PlusCircle, Search, Trash2, Users } from "lucide-react";
import Link from "next/link";

type ContactList = {
  id: string;
  name: string;
  _count: { contacts: number };
  createdAt: string;
};

export default function ListsPage() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const fetchLists = async () => {
    setLoading(true);
    const res = await fetch(`/api/contact-lists?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      setLists(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/contact-lists/${editId}` : "/api/contact-lists";
    const method = editId ? "PUT" : "POST";
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setShowModal(false);
      setEditId(null);
      setName("");
      fetchLists();
    } else {
      alert("Failed to save list");
    }
  };

  const openForm = (list?: ContactList) => {
    if (list) {
      setEditId(list.id);
      setName(list.name);
    } else {
      setEditId(null);
      setName("");
    }
    setShowModal(true);
  };

  const deleteList = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (id: string) => {
    setDeleteConfirmId(null);
    setLists(prev => prev.filter(l => l.id !== id));
    const res = await fetch(`/api/contact-lists/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete list");
      fetchLists(); // revert
    }
  };

  const filteredLists = lists.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <ListTodo className="w-10 h-10" />
            Contact Lists
          </h1>
          <p className="text-white/70 mt-2 text-lg">Group your subscribers for targeted campaigns.</p>
        </div>
        <button 
          onClick={() => openForm()}
          className="bg-purple-500 hover:bg-purple-600 text-white border border-purple-400/30 px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 backdrop-blur-md font-semibold"
        >
          <PlusCircle className="w-5 h-5" /> Create List
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search lists..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-white/70 py-10 animate-pulse">Loading lists...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLists.map(list => (
              <div key={list.id} className="group relative">
                <Link href={`/lists/${list.id}`} className="block h-full bg-black/20 hover:bg-black/30 border border-white/10 rounded-3xl p-6 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white pr-8 truncate group-hover:text-purple-300 transition-colors">{list.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/60 mb-6">
                    <Users className="w-4 h-4" />
                    <span>{list._count.contacts} Contacts</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-white/40 text-xs mt-auto">Created {new Date(list.createdAt).toLocaleDateString()}</p>
                    <span className="text-purple-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">View List →</span>
                  </div>
                </Link>
                <div className="absolute right-4 top-4 z-10 flex gap-2">
                  <button 
                    onClick={(e) => { e.preventDefault(); openForm(list); }} 
                    className="text-purple-400 hover:text-purple-300 p-2 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <PlusCircle className="w-5 h-5 rotate-45" /> {/* Using PlusCircle rotated as an edit alternative or Edit2 if available */}
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); deleteList(list.id); }} 
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {filteredLists.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10 text-white/60 bg-black/10 rounded-3xl border border-white/5 border-dashed">
                No lists found. Create your first one!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative w-full max-w-sm bg-gray-900 border border-purple-500/20 rounded-2xl p-6 shadow-2xl z-10 transition-all">
            <h3 className="text-xl font-bold text-white mb-2">Delete List</h3>
            <p className="text-white/70 text-sm mb-8 leading-relaxed">Are you sure you want to permanently delete this contact list? Your contacts will remain in the database.</p>
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
          <div className="relative bg-[#2A1B38]/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-purple-900/50">
            <h2 className="text-2xl font-bold text-white mb-6">{editId ? "Rename List" : "Create New List"}</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 mb-2 text-sm font-medium">List Name *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="e.g. Weekly Newsletter" />
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-white/70 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-xl transition-colors font-medium shadow-lg shadow-purple-500/20">Create List</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
