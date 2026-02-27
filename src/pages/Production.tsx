import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  Plus, 
  Calendar, 
  ArrowRight, 
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

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
  
  // Form State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [preformId, setPreformId] = useState('');
  const [bottleId, setBottleId] = useState('');
  const [quantity, setQuantity] = useState('');

  const { token } = useAuth();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eRes, pRes] = await Promise.all([
        fetch('/api/production', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      setEntries(await eRes.json());
      setProducts(await pRes.json());
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const preforms = products.filter(p => p.category === 'Preform');
  const bottles = products.filter(p => p.category === 'Bottle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Production Entries</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus size={20} />
          <span>New Production</span>
        </button>
      </div>

      {/* Production Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Preform Used</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center"></th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bottle Produced</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600" size={32} />
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No production entries recorded</td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{format(new Date(e.date), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{e.preform_name}</td>
                    <td className="px-6 py-4 text-center text-slate-400">
                      <ArrowRight size={16} className="mx-auto" />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{e.bottle_name}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{e.quantity} Units</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Factory className="text-indigo-600" />
                  Record Production
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      required
                      type="date"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preform (Source)</label>
                    <select
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    <div className="p-2 bg-slate-100 rounded-full text-slate-400">
                      <ArrowRight size={20} className="rotate-90 sm:rotate-0" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bottle (Result)</label>
                    <select
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity (PCS)</label>
                  <input
                    required
                    type="number"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter quantity in pieces"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  {preformId && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <AlertCircle size={14} />
                      <span>Available stock: {products.find(p => p.id === parseInt(preformId))?.current_stock} PCS</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    Record Production
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
