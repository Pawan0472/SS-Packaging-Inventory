import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  X,
  UserPlus,
  Mail,
  Phone,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  ExternalLink,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { toast } from 'react-hot-toast';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { indiaMartService } from '../services/indiaMartService';

const Leads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncKey, setSyncKey] = useState(localStorage.getItem('indiamart_crm_key') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const { user, isDemo } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'New',
    source: 'Website'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await db.leads.getAll();
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await db.leads.update(editingLead.id, formData, user?.email || 'system');
        toast.success('Lead updated successfully');
      } else {
        await db.leads.create(formData, user?.email || 'system');
        toast.success('Lead created successfully');
      }
      setIsModalOpen(false);
      setEditingLead(null);
      setFormData({ name: '', company: '', email: '', phone: '', status: 'New', source: 'Website' });
      fetchData();
    } catch (error) {
      toast.error('Failed to save lead');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await db.leads.softDelete(id, user?.email || 'system');
      toast.success('Lead deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.company.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-500';
      case 'Contacted': return 'bg-amber-500';
      case 'Qualified': return 'bg-emerald-500';
      case 'Lost': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  const handleSyncIndiaMart = async () => {
    if (!syncKey) {
      setIsSyncModalOpen(true);
      return;
    }

    setIsSyncing(true);
    const syncToast = toast.loading('Syncing leads from IndiaMART...');
    try {
      localStorage.setItem('indiamart_crm_key', syncKey);
      const imLeads = await indiaMartService.fetchLeads(syncKey);
      
      if (imLeads.length === 0) {
        toast.dismiss(syncToast);
        toast.success('No new leads found on IndiaMART');
        return;
      }

      // Bulk create leads (or one by one if db doesn't support bulk)
      let count = 0;
      for (const lead of imLeads) {
        try {
          // Check if lead already exists by email or phone if possible
          // For now, just create them
          await db.leads.create(lead, user?.email || 'system');
          count++;
        } catch (e) {
          console.error('Failed to create IndiaMART lead', e);
        }
      }

      toast.dismiss(syncToast);
      toast.success(`Successfully synced ${count} leads from IndiaMART`);
      fetchData();
    } catch (error) {
      toast.dismiss(syncToast);
      toast.error('Failed to sync IndiaMART leads. Check your CRM Key.');
      setIsSyncModalOpen(true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Leads</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage potential customers and inquiries.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSyncIndiaMart}
            disabled={isSyncing}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={18} className={cn(isSyncing && "animate-spin")} />
            <span>Sync IndiaMART</span>
          </button>
          <button 
            onClick={() => {
              setEditingLead(null);
              setFormData({ name: '', company: '', email: '', phone: '', status: 'New', source: 'Website' });
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search leads by name or company..." 
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl"></div>
          ))
        ) : filteredLeads.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
              <UserPlus size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No leads found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Start by adding your first potential customer.</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <motion.div 
              key={lead.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("w-2 h-2 rounded-full", getStatusColor(lead.status))} />
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingLead(lead);
                      setFormData({
                        name: lead.name,
                        company: lead.company,
                        email: lead.email,
                        phone: lead.phone,
                        status: lead.status,
                        source: lead.source
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(lead.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{lead.name}</h3>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-4">
                <Building size={14} />
                <span>{lead.company}</span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <Mail size={14} className="text-slate-400" />
                  <span>{lead.email}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <Phone size={14} className="text-slate-400" />
                  <span>{lead.phone}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lead.source}</span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white",
                  getStatusColor(lead.status)
                )}>
                  {lead.status}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsSyncModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">IndiaMART Config</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">Enter your CRM API Key</p>
                </div>
                <button onClick={() => setIsSyncModalOpen(false)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="label-caps ml-1">CRM API Key</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password"
                      className="w-full pl-12 pr-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={syncKey} 
                      onChange={e => setSyncKey(e.target.value)} 
                      placeholder="Your IndiaMART CRM Key"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                    <ExternalLink size={10} />
                    <span>Get your key from IndiaMART Seller Panel</span>
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsSyncModalOpen(false);
                    handleSyncIndiaMart();
                  }}
                  className="w-full px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all"
                >
                  Save & Sync Now
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{editingLead ? 'Edit Lead' : 'New Lead'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">Potential customer details</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Contact Name</label>
                    <input 
                      required 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Company</label>
                    <input 
                      required 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={formData.company} 
                      onChange={e => setFormData({...formData, company: e.target.value})} 
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Email</label>
                    <input 
                      type="email"
                      required 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Phone</label>
                    <input 
                      required 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Status</label>
                    <select 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Source</label>
                    <select 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                      value={formData.source}
                      onChange={e => setFormData({...formData, source: e.target.value})}
                    >
                      <option value="Website">Website</option>
                      <option value="Referral">Referral</option>
                      <option value="Cold Call">Cold Call</option>
                      <option value="Event">Event</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all"
                  >
                    Save Lead
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Leads;
