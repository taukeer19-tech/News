import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Send, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Trash2,
  Edit2
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn, formatDate } from '../lib/utils';

export const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    templateId: '',
    smtpId: '',
    targetListId: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setCampaigns(list);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'campaigns'), {
        ...newCampaign,
        status: 'draft',
        sentCount: 0,
        openCount: 0,
        clickCount: 0,
        createdAt: serverTimestamp(),
      });
      setIsNewModalOpen(false);
      setNewCampaign({ name: '', subject: '', content: '', templateId: '', smtpId: '', targetListId: '' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await deleteDoc(doc(db, 'campaigns', id));
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-medium border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 size={12} /> Sent</span>;
      case 'sending':
        return <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-medium border border-blue-500/20 flex items-center gap-1 animate-pulse"><Clock size={12} /> Sending</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-xs font-medium border border-rose-500/20 flex items-center gap-1"><AlertCircle size={12} /> Failed</span>;
      default:
        return <span className="px-2 py-1 bg-slate-500/10 text-slate-400 rounded-lg text-xs font-medium border border-slate-500/20 flex items-center gap-1">Draft</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Campaigns</h1>
          <p className="text-slate-400 mt-1">Manage and track your email newsletter campaigns.</p>
        </div>
        <button 
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          Create Campaign
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-medium">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      {/* Campaigns Grid/List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/50 rounded-2xl animate-pulse border border-white/10" />
          ))
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-white/10 rounded-2xl border-dashed">
            <Send size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-300">No campaigns yet</h3>
            <p className="text-slate-500 mt-1">Start by creating your first marketing campaign.</p>
            <button 
              onClick={() => setIsNewModalOpen(true)}
              className="mt-6 text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Create Campaign &rarr;
            </button>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="group p-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Send size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate w-48 sm:w-64">
                      {campaign.name}
                    </h3>
                    {getStatusBadge(campaign.status)}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5 mt-1">Subject: {campaign.subject}</p>
                </div>
              </div>

              <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-lg font-bold">{campaign.sentCount || 0}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{campaign.openCount || 0}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Opens</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <BarChart3 size={20} />
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10">
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(campaign.id)}
                    className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Campaign Modal (Simplified) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-white/5">
              <h2 className="text-2xl font-bold">New Campaign</h2>
              <p className="text-slate-400 mt-1">Draft your next marketing masterpiece.</p>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 italic">Campaign Name</label>
                  <input 
                    required
                    type="text" 
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 italic">Email Subject</label>
                  <input 
                    required
                    type="text" 
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                {/* Content Editor would go here */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 italic">HTML Content (Raw)</label>
                  <textarea 
                    required
                    rows={4}
                    value={newCampaign.content}
                    onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
