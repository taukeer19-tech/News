import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Layout, 
  Trash2, 
  Edit2, 
  Eye, 
  Copy,
  Code,
  FileCode,
  CheckCircle2,
  X,
  MoreVertical,
  Clock
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
import { cn, formatDate } from '../lib/utils';

export const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '<html><body>\n  <h1>Hello, {{name}}!</h1>\n  <p>Your message here.</p>\n</body></html>',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'templates'));
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setTemplates(list);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentTemplate) {
        await updateDoc(doc(db, 'templates', currentTemplate.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'templates'), {
          ...formData,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setCurrentTemplate(null);
      setFormData({ name: '', description: '', content: '' });
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await deleteDoc(doc(db, 'templates', id));
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const openEdit = (template: any) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      content: template.content,
    });
    setIsModalOpen(true);
  };

  const openPreview = (template: any) => {
    setCurrentTemplate(template);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Layout className="text-indigo-500" />
            Email Templates
          </h1>
          <p className="text-slate-400 mt-1">Design and manage your email layouts and reusable blocks.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentTemplate(null);
            setFormData({ name: '', description: '', content: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          Create Template
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse border border-white/10" />
          ))
        ) : templates.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-900/50 border border-dashed border-white/10 rounded-3xl">
            <FileCode size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-lg font-medium text-slate-400">No templates found</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Build your first template &rarr;
            </button>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="group bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all flex flex-col">
              <div className="h-40 bg-slate-800/50 relative overflow-hidden flex items-center justify-center p-4 border-b border-white/5">
                <div className="opacity-10 group-hover:opacity-20 transition-opacity">
                  <Code size={120} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 gap-2">
                  <button 
                    onClick={() => openPreview(template)}
                    className="p-3 bg-white text-slate-900 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    onClick={() => openEdit(template)}
                    className="p-3 bg-indigo-600 text-white rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <Edit2 size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight italic">{template.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 italic">{template.description || 'No description provided'}</p>
                  </div>
                  <button className="text-slate-500 hover:text-white p-1">
                    <MoreVertical size={18} />
                  </button>
                </div>
                
                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs font-mono text-slate-500 italic">
                  <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(template.createdAt?.toDate() || new Date())}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDelete(template.id)}
                      className="hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button className="hover:text-white transition-colors">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold italic">{currentTemplate ? 'Edit Template' : 'New Template'}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">Template Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">Description</label>
                    <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                </div>
                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="text-sm font-medium text-slate-400 uppercase italic tracking-wider">HTML Content</label>
                  <textarea 
                    required 
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})} 
                    className="w-full flex-1 min-h-[300px] px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-white transition-all">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                  <CheckCircle2 size={18} /> Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && currentTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="w-full max-w-4xl h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
            <button 
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors z-10"
            >
              <X size={24} />
            </button>
            <div className="bg-slate-100 p-4 border-b flex items-center justify-between text-slate-500">
              <span className="text-sm font-medium">Previewing: {currentTemplate.name}</span>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
            </div>
            <iframe 
              srcDoc={currentTemplate.content} 
              title="Template Preview"
              className="flex-1 w-full border-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
