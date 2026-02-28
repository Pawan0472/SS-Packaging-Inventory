import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  Plus, 
  Calendar, 
  ArrowRight, 
  Loader2,
  X,
  AlertCircle,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowDownRight,
  ArrowUpRight,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

interface Product {
  id: number;
  name: string;
  category: string;
  current_stock: number;
}

interface ProductionEntry {
  id: number;
  date: string;
  preform_name: string;
  bottle_name: string;
  quantity: number;
}

const Production: React.FC = () => {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Form State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [preformId, setPreformId] = useState('');
  const [bottleId, setBottleId] = useState('');
  const [quantity, setQuantity] = useState('');

  const { token, isDemo } = useAuth();

  const fetchData = async () => {
    if (isDemo) {
      setEntries([
        { id: 1, date: '2024-03-25', preform_name: '18g Preform Blue', bottle_name: '500ml Water Bottle', quantity: 5000 },
        { id: 2, date: '2024-03-24', preform_name: '24g Preform Clear', bottle_name: '1L Juice Bottle', quantity: 3000 },
        { id: 3, date: '2024-03-23', preform_name: '18g Preform Blue', bottle_name: '500ml Water Bottle', quantity: 4500 },
      ]);
      setProducts([
        { id: 1, name: '18g Preform Blue', category: 'Preform', current_stock: 15000 },
        { id: 2, name: '24g Preform Clear', category: 'Preform', current_stock: 8000 },
        { id: 3, name: '500ml Water Bottle', category: 'Bottle', current_stock: 12000 },
        { id: 4, name: '1L Juice Bottle', category: 'Bottle', current_stock: 5000 },
      ]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [eRes, pRes] = await Promise.all([
        fetch('/api/production', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (eRes.ok) setEntries(await eRes.json());
      if (pRes.ok) setProducts(await pRes.json());
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, isDemo]);

  const preforms = products.filter(p => p.category === 'Preform');
  const bottles = products.filter(p => p.category === 'Bottle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      toast.success('Demo: Production recorded successfully');
      setIsModalOpen(false);
      resetForm();
      return;
    }

    if (!preformId || !bottleId || !quantity) return toast.error('Please fill all fields');

    const selectedPreform = products.find(p => p.id === parseInt(preformId));
    if (selectedPreform && selectedPreform.current_stock < parseFloat(quantity)) {
      return toast.error(`Insufficient preform stock. Available: ${selectedPreform.current_stock}`);
    }

    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          preform_product_id: parseInt(preformId),
          bottle_product_id: parseInt(bottleId),
          quantity: parseFloat(quantity)
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to record production');

      toast.success('Production recorded successfully');
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setPreformId('');
    setBottleId('');
    setQuantity('');
  };

  const filteredEntries = entries.filter(e => 
    e.preform_name.toLowerCase().includes(search.toLowerCase()) ||
    e.bottle_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Production</h2>
          <p className="text-slate-500 mt-1">Track manufacturing logs and stock transformations.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <History size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Logs</p>
            <p className="text-2xl font-bold text-slate-900">{entries.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bottles Produced</p>
            <p className="text-2xl font-bold text-slate-900">
              {entries.reduce((sum, e) => sum + e.quantity, 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <ArrowDownRight size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preforms Consumed</p>
            <p className="text-2xl font-bold text-slate-900">
              {entries.reduce((sum, e) => sum + e.quantity, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by product name..." 
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="bg-white border border-slate-200 px-6 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source (Preform)</th>
                <th className="text-center">Process</th>
                <th>Result (Bottle)</th>
                <th>Quantity</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-8 px-6 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Factory size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No production logs</h3>
                    <p className="text-slate-500 mt-1 font-medium">Record your first manufacturing entry to see it here.</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="group">
                    <td className="text-slate-600 font-medium">{format(new Date(e.date), 'dd MMM yyyy')}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                          <ArrowDownRight size={14} />
                        </div>
                        <span className="font-bold text-slate-900">{e.preform_name}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center">
                        <div className="h-px w-8 bg-slate-200"></div>
                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 bg-white">
                          <ArrowRight size={14} />
                        </div>
                        <div className="h-px w-8 bg-slate-200"></div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <ArrowUpRight size={14} />
                        </div>
                        <span className="font-bold text-slate-900">{e.bottle_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs">
                        {e.quantity.toLocaleString()} PCS
                      </span>
                    </td>
                    <td className="text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {filteredEntries.length} entries</p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-900 transition-all disabled:opacity-50">
              <ChevronLeft size={18} />
            </button>
            <button className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-900 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* New Production Modal */}
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
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Record Production</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">Log manufacturing output</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="label-caps ml-1">Production Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="date"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Source Preform</label>
                    <select
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none transition-all"
                      value={preformId}
                      onChange={(e) => setPreformId(e.target.value)}
                    >
                      <option value="">Select Preform</option>
                      {preforms.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <ArrowRight size={20} className="rotate-90" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="label-caps ml-1">Resulting Bottle</label>
                    <select
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none transition-all"
                      value={bottleId}
                      onChange={(e) => setBottleId(e.target.value)}
                    >
                      <option value="">Select Bottle</option>
                      {bottles.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-caps ml-1">Quantity Produced (PCS)</label>
                  <div className="relative">
                    <Factory className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="number"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Enter pieces"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  {preformId && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <AlertCircle size={12} className="text-indigo-500" />
                      <span>Available stock: {products.find(p => p.id === parseInt(preformId))?.current_stock} PCS</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all"
                  >
                    Confirm Entry
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

export default Production;
