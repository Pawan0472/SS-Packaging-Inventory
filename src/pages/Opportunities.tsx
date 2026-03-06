import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  X,
  TrendingUp,
  DollarSign,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { toast } from 'react-hot-toast';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isDemo } = useAuth();

  const [formData, setFormData] = useState({
    customer_id: '',
    title: '',
    value: '',
    stage: 'Discovery',
    probability: '20',
    expected_close_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oppsData, custData] = await Promise.all([
        db.opportunities.getAll(),
        db.customers.getAll()
      ]);
      setOpportunities(oppsData);
      setCustomers(custData);
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
      toast.error('Failed to load opportunities');
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
      await db.opportunities.create(formData, user?.email || 'system');
      toast.success('Opportunity created successfully');
      setIsModalOpen(false);
      setFormData({ 
        customer_id: '', 
        title: '', 
        value: '', 
        stage: 'Discovery', 
        probability: '20', 
        expected_close_date: new Date().toISOString().split('T')[0] 
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to save opportunity');
    }
  };

  const filteredOpps = opportunities.filter(o => 
    o.title.toLowerCase().includes(search.toLowerCase()) || 
    o.customers?.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Discovery': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
      case 'Proposal': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
      case 'Negotiation': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10';
      case 'Closed Won': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
      case 'Closed Lost': return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Opportunities</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track deals and sales pipeline.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>New Opportunity</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search opportunities..." 
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

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Deal Title</th>
                <th>Customer</th>
                <th>Value</th>
                <th>Stage</th>
                <th>Probability</th>
                <th>Expected Close</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-8 px-6 bg-slate-50/20 dark:bg-slate-800/20"></td>
                  </tr>
                ))
              ) : filteredOpps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
                      <Briefcase size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No opportunities found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Start tracking your sales pipeline.</p>
                  </td>
                </tr>
              ) : (
                filteredOpps.map((opp) => (
                  <tr key={opp.id} className="group">
                    <td>
                      <p className="font-bold text-slate-900 dark:text-white">{opp.title}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 dark:text-slate-400">{opp.customers?.name || 'Unknown Customer'}</span>
                      </div>
                    </td>
                    <td className="font-bold text-slate-900 dark:text-white">₹{parseFloat(opp.value).toLocaleString()}</td>
                    <td>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        getStageColor(opp.stage)
                      )}>
                        {opp.stage}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-16">
                          <div className="h-full bg-indigo-600" style={{ width: `${opp.probability}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{opp.probability}%</span>
                      </div>
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 text-sm">
                      {new Date(opp.expected_close_date).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                        <CheckCircle2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
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
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">New Opportunity</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">Deal details</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="label-caps ml-1">Opportunity Title</label>
                  <input 
                    required 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g. Bulk Bottle Order Q3"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-caps ml-1">Customer</label>
                  <select 
                    required
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                    value={formData.customer_id}
                    onChange={e => setFormData({...formData, customer_id: e.target.value})}
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Expected Value (₹)</label>
                    <input 
                      type="number"
                      required 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={formData.value} 
                      onChange={e => setFormData({...formData, value: e.target.value})} 
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Probability (%)</label>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      required 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={formData.probability} 
                      onChange={e => setFormData({...formData, probability: e.target.value})} 
                      placeholder="20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Stage</label>
                    <select 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                      value={formData.stage}
                      onChange={e => setFormData({...formData, stage: e.target.value})}
                    >
                      <option value="Discovery">Discovery</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Closed Won">Closed Won</option>
                      <option value="Closed Lost">Closed Lost</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Expected Close</label>
                    <input 
                      type="date"
                      required 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={formData.expected_close_date} 
                      onChange={e => setFormData({...formData, expected_close_date: e.target.value})} 
                    />
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
                    Create Opportunity
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

export default Opportunities;
