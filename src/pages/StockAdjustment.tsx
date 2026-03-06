import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  X,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  History,
  AlertCircle,
  Package,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { toast } from 'react-hot-toast';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';

const StockAdjustment = () => {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isDemo } = useAuth();

  const [formData, setFormData] = useState({
    product_id: '',
    type: 'Add',
    quantity: '',
    reason: 'Opening Stock',
    weight_kg: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adjData, prodData] = await Promise.all([
        db.stockAdjustments.getAll(),
        db.products.getAll()
      ]);
      setAdjustments(adjData);
      setProducts(prodData);
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.quantity) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const adjustmentData = {
        product_id: formData.product_id,
        type: formData.type,
        quantity: formData.quantity,
        reason: formData.reason
      };
      await db.stockAdjustments.create(adjustmentData, user?.email || 'system');
      toast.success('Stock adjusted successfully');
      setIsModalOpen(false);
      setFormData({ product_id: '', type: 'Add', quantity: '', reason: 'Opening Stock', weight_kg: '' });
      fetchData();
    } catch (error) {
      console.error('Adjustment error:', error);
      toast.error('Failed to adjust stock');
    }
  };

  const handleWeightChange = (kg: string) => {
    const product = products.find(p => p.id === parseInt(formData.product_id));
    if (product && product.gram_weight) {
      const gramWeight = typeof product.gram_weight === 'string' 
        ? parseFloat(product.gram_weight) 
        : product.gram_weight;
      
      if (gramWeight > 0) {
        const pieces = Math.floor((parseFloat(kg) * 1000) / gramWeight);
        setFormData({ ...formData, weight_kg: kg, quantity: pieces.toString() });
      }
    } else {
      setFormData({ ...formData, weight_kg: kg });
    }
  };

  const filteredAdjustments = adjustments.filter(a => 
    a.products?.name.toLowerCase().includes(search.toLowerCase()) || 
    a.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Stock Adjustment</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Directly manage product stock levels and opening stock.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>New Adjustment</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search adjustments by product or reason..." 
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
                <th>Date</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Adjusted By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-8 px-6 bg-slate-50/20 dark:bg-slate-800/20"></td>
                  </tr>
                ))
              ) : filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
                      <History size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No adjustments found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Start by adding a stock adjustment.</p>
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((adj) => (
                  <tr key={adj.id}>
                    <td className="text-slate-500 dark:text-slate-400 text-sm">
                      {new Date(adj.created_at).toLocaleString()}
                    </td>
                    <td>
                      <p className="font-bold text-slate-900 dark:text-white">{adj.products?.name || 'Unknown Product'}</p>
                    </td>
                    <td>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        adj.type === 'Add' ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "text-rose-500 bg-rose-50 dark:bg-rose-500/10"
                      )}>
                        {adj.type}
                      </span>
                    </td>
                    <td className="font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        {adj.type === 'Add' ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-rose-500" />}
                        {adj.quantity}
                      </div>
                    </td>
                    <td className="text-slate-600 dark:text-slate-400">{adj.reason}</td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs">{adj.user_email}</td>
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
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">New Adjustment</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">Update stock manually</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="label-caps ml-1">Select Product</label>
                  <select 
                    required
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                    value={formData.product_id}
                    onChange={e => setFormData({...formData, product_id: e.target.value})}
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Current: {p.stock})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Adjustment Type</label>
                    <select 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Add">Add Stock (+)</option>
                      <option value="Subtract">Subtract Stock (-)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Quantity (PCS)</label>
                    <input 
                      type="number"
                      required 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={formData.quantity} 
                      onChange={e => setFormData({...formData, quantity: e.target.value})} 
                      placeholder="e.g. 100"
                    />
                  </div>
                </div>

                {products.find(p => p.id === parseInt(formData.product_id))?.category === 'Preform' && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Weight Calculator (KG to PCS)</label>
                      <AlertCircle size={14} className="text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="Weight in KG"
                          className="w-full pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={formData.weight_kg}
                          onChange={(e) => handleWeightChange(e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">KG</span>
                      </div>
                      <ArrowRight size={16} className="text-slate-300" />
                      <div className="flex-1 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
                        {formData.quantity || 0} PCS
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                      Based on {products.find(p => p.id === parseInt(formData.product_id))?.gram_weight}g grammage
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="label-caps ml-1">Reason / Note</label>
                  <input 
                    required 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                    value={formData.reason} 
                    onChange={e => setFormData({...formData, reason: e.target.value})} 
                    placeholder="e.g. Opening Stock, Damaged, Correction"
                  />
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
                    Apply Adjustment
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

export default StockAdjustment;
