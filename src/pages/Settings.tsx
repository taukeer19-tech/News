import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Mail, 
  Shield, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Database
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'smtp'>('smtp');
  const [smtpConfigs, setSmtpConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: '',
    host: '',
    port: '465',
    user: '',
    pass: '',
    fromName: '',
    fromEmail: '',
  });

  useEffect(() => {
    fetchSmtpConfigs();
  }, []);

  const fetchSmtpConfigs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'smtp_configs'));
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setSmtpConfigs(list);
    } catch (error) {
      console.error('Error fetching SMTP configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'smtp_configs'), {
        ...newConfig,
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewConfig({ name: '', host: '', port: '465', user: '', pass: '', fromName: '', fromEmail: '' });
      fetchSmtpConfigs();
    } catch (error) {
      console.error('Error saving SMTP config:', error);
      alert('Failed to save configuration');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this SMTP configuration?')) return;
    try {
      await deleteDoc(doc(db, 'smtp_configs', id));
      fetchSmtpConfigs();
    } catch (error) {
      console.error('Error deleting SMTP config:', error);
    }
  };

  const togglePass = (id: string) => {
    setShowPass(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <SettingsIcon className="text-indigo-500" />
            Settings
          </h1>
          <p className="text-slate-400 mt-1">Configure your platform and email delivery providers.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('smtp')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
            activeTab === 'smtp' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
          )}
        >
          <Mail size={18} /> SMTP Providers
        </button>
        <button 
          onClick={() => setActiveTab('general')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
            activeTab === 'general' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
          )}
        >
          <Shield size={18} /> General Settings
        </button>
      </div>

      {activeTab === 'smtp' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="h-48 bg-white/5 rounded-3xl animate-pulse border border-white/10" />
            ) : smtpConfigs.map((config) => (
              <div key={config.id} className="p-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Database size={80} />
                </div>
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Database size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight italic">{config.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{config.host}:{config.port}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDelete(config.id)}
                      className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 italic">Username</p>
                    <p className="text-sm font-mono text-slate-300">{config.user}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 italic">Password</p>
                      <p className="text-sm font-mono text-slate-300">
                        {showPass[config.id] ? config.pass : '••••••••••••'}
                      </p>
                    </div>
                    <button 
                      onClick={() => togglePass(config.id)}
                      className="text-slate-500 hover:text-white p-1"
                    >
                      {showPass[config.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 italic">From Name</p>
                      <p className="text-sm font-medium text-slate-300">{config.fromName}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 italic">From Email</p>
                      <p className="text-sm font-medium text-slate-300 truncate">{config.fromEmail}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-6 bg-slate-900/20 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-indigo-400 hover:bg-white/5 hover:border-indigo-500/30 transition-all group min-h-[300px]"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={32} />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">Add New SMTP provider</p>
                <p className="text-sm text-slate-600">Connect a new email delivery service</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="max-w-2xl p-8 bg-slate-900/50 border border-white/10 rounded-3xl">
          <h3 className="text-xl font-bold mb-6">General Platform Settings</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">Platform Name</label>
              <input type="text" defaultValue="News Portal" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">Support Email</label>
              <input type="email" defaultValue="support@news.portal" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
            <button className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20">
              <Save size={18} /> Update Settings
            </button>
          </div>
        </div>
      )}

      {/* New SMTP Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-white/5">
              <h2 className="text-2xl font-bold italic">Add SMTP Provider</h2>
              <p className="text-slate-400 mt-1">Configure a new email delivery gateway.</p>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">Provider Name (Label)</label>
                  <input required type="text" placeholder="e.g., Gmail SMTP, Amazon SES" value={newConfig.name} onChange={e => setNewConfig({...newConfig, name: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">SMTP Host</label>
                  <input required type="text" placeholder="smtp.gmail.com" value={newConfig.host} onChange={e => setNewConfig({...newConfig, host: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
                <div className="space-y-2 w-32">
                  <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">Port</label>
                  <input required type="text" placeholder="465" value={newConfig.port} onChange={e => setNewConfig({...newConfig, port: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">Username</label>
                  <input required type="text" value={newConfig.user} onChange={e => setNewConfig({...newConfig, user: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">Password</label>
                  <input required type="password" value={newConfig.pass} onChange={e => setNewConfig({...newConfig, pass: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">From Name</label>
                  <input required type="text" placeholder="The News Team" value={newConfig.fromName} onChange={e => setNewConfig({...newConfig, fromName: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">From Email</label>
                  <input required type="email" placeholder="no-reply@news.portal" value={newConfig.fromEmail} onChange={e => setNewConfig({...newConfig, fromEmail: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20">Save Provider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
