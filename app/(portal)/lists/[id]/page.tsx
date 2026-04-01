"use client";

import { useEffect, useState } from "react";
import { Users, Search, PlusCircle, Trash2, ArrowLeft, Loader2, UserMinus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Contact = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  unsubscribed: boolean;
};

type ContactList = {
  id: string;
  name: string;
  contacts: { contact: Contact }[];
  _count: { contacts: number };
};

export default function ListDetailPage() {
  const { id } = useParams();
  const [list, setList] = useState<ContactList | null>(null);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [listRes, contactsRes] = await Promise.all([
      fetch(`/api/contact-lists/${id}`),
      fetch("/api/contacts")
    ]);

    if (listRes.ok) setList(await listRes.json());
    if (contactsRes.ok) setAllContacts(await contactsRes.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const addContactToList = async (contactId: string) => {
    const res = await fetch(`/api/contact-lists/${id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });

    if (res.ok) {
      fetchData();
      setShowAddModal(false);
    } else {
      const err = await res.json();
      alert(err.error || "Failed to add contact to list");
    }
  };

  const removeContactFromList = async (contactId: string) => {
    if (!confirm("Remove this contact from the list?")) return;
    const res = await fetch(`/api/contact-lists/${id}/contacts?contactId=${contactId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchData();
    } else {
      alert("Failed to remove contact");
    }
  };

  const filteredListContacts = list?.contacts.filter(c => 
    c.contact.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.contact.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  ) || [];

  const contactsInListIds = list?.contacts.map(c => c.contact.id) || [];
  const contactsNotInList = allContacts.filter(c => 
     !contactsInListIds.includes(c.id) &&
     (c.email.toLowerCase().includes(addSearchTerm.toLowerCase()) || 
      (c.firstName?.toLowerCase() || "").includes(addSearchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="p-8 text-center text-white/50 flex flex-col items-center gap-3 min-h-screen justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        Loading list details...
      </div>
    );
  }

  if (!list) {
    return (
      <div className="p-8 text-center text-white min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">List not found</h1>
        <Link href="/lists" className="text-purple-400 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to lists
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6">
        <Link href="/lists" className="text-white/50 hover:text-white flex items-center gap-2 transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Lists
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              {list.name}
            </h1>
            <p className="text-white/70 mt-2 text-lg">{list._count.contacts} total subscribers in this group.</p>
          </div>
          <button 
             onClick={() => setShowAddModal(true)}
             className="bg-purple-500 hover:bg-purple-600 text-white border border-purple-400/30 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 backdrop-blur-md font-semibold"
          >
            <PlusCircle className="w-5 h-5" /> Add to List
          </button>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
          <input 
            type="text" 
            placeholder="Search within this list..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                <th className="pb-4 pt-2 pl-4 font-semibold">Contact</th>
                <th className="pb-4 pt-2 font-semibold lowercase first-letter:uppercase">Subscription</th>
                <th className="pb-4 pt-2 font-semibold text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredListContacts.map(({ contact }) => (
                <tr key={contact.id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-4 pl-4">
                    <div className="text-white font-medium">{contact.email}</div>
                    <div className="text-white/50 text-sm mt-0.5">{contact.firstName} {contact.lastName}</div>
                  </td>
                  <td className="py-4">
                    {contact.unsubscribed ? (
                        <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">Unsubscribed</span>
                    ) : (
                        <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Subscribed</span>
                    )}
                  </td>
                  <td className="py-4 text-right pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => removeContactFromList(contact.id)} title="Remove from list" className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-all">
                      <UserMinus className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredListContacts.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-20 text-white/40 border border-white/5 border-dashed rounded-3xl">
                    No contacts found in this list.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-purple-900/40">
            <h2 className="text-2xl font-bold text-white mb-6">Add Contacts to List</h2>
            <div className="relative mb-6">
                <Search className="absolute left-4 top-3 w-4 h-4 text-white/40" />
                <input 
                    type="text" 
                    placeholder="Search your database..." 
                    value={addSearchTerm}
                    onChange={e => setAddSearchTerm(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {contactsNotInList.map(contact => (
                    <div key={contact.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                        <div>
                            <div className="text-white text-sm font-medium">{contact.email}</div>
                            <div className="text-white/40 text-xs">{contact.firstName} {contact.lastName}</div>
                        </div>
                        <button 
                            onClick={() => addContactToList(contact.id)}
                            className="bg-purple-500 hover:bg-purple-600 text-white p-1.5 rounded-lg transition-colors"
                        >
                            <PlusCircle className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {contactsNotInList.length === 0 && (
                    <div className="text-center py-8 text-white/30 text-sm italic">
                        No additional contacts found.
                    </div>
                )}
            </div>

            <div className="flex justify-end mt-8">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 text-white/70 hover:text-white transition-colors text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
