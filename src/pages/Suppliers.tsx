import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Phone, 
  MapPin, 
  Hash, 
  Loader2,
  MoreVertical,
  ExternalLink,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  address: string;
  gst: string;
}

import { db } from '../services/db';

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');
  const { token, user, isDemo } = useAuth();

  const [formData, setFormData] = useState({ name: '', phone: '', address: '', gst: '' });

  const fetchSuppliers = async () => {
    if (isDemo) {
      setSuppliers([
        { id: 1, name: 'Global Polymers Ltd', phone: '+91 98765 43210', address: 'Plot 45, GIDC Industrial Estate, Vapi, Gujarat', gst: '24AAAAA0000A1Z5' },
        { id: 2, name: 'Apex Masterbatch Solutions', phone: '+91 88888 77777', address: '12/B, MIDC Phase 2, Thane, Maharashtra', gst: '27BBBBB1111B1Z2' },
        { id: 3, name: 'Shree Krishna Packaging', phone: '+91 99000 11223', address: 'Survey No. 442, Silvassa Road, Daman', gst: '25CCCCC2222C1Z9' },
      ]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await db.suppliers.getAll();
      setSuppliers(data);
    } catch (error) {
      toast.error('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [token, isDemo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      toast.success('Demo: Supplier saved successfully');
      setIsModalOpen(false);
      return;
    }

    try {
      if (editingSupplier) {
        await db.suppliers.update(editingSupplier.id, formData);
        toast.success('Supplier updated');
      } else {
        await db.suppliers.create(formData);
        toast.success('Supplier created');
      }
      setIsModalOpen(false);
      setEditingSupplier(null);
      setFormData({ name: '', phone: '', address: '', gst: '' });
      fetchSuppliers();
    } catch (error) {
      toast.error('Failed to save supplier');
    }
  };

  const handleDelete = async (id: number) => {
    if (isDemo) {
      toast.success('Demo: Supplier deleted');
      return;
    }

    if (!window.confirm('Are you sure?')) return;
    try {
      await db.suppliers.delete(id);
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch (error) {
      toast.error('Error deleting supplier');
    }
  };

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Suppliers</h2>
          <p className="text-slate-500 mt-1">Manage raw material vendors and partners.</p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setFormData({ name: '', phone: '', address: '', gst: '' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search suppliers by name, GST or location..." 
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

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-200 rounded-3xl animate-pulse"></div>
            ))
          ) : filteredSuppliers.length === 0 ? (
            <div className="col-span-full py-20 text-center bento-card">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Truck size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No suppliers found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your search or add a new vendor.</p>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={supplier.id}
                className="bento-card group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <Truck size={24} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setFormData(supplier);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                    >
                      <Edit2 size={16} />
                    </button>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleDelete(supplier.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-6 group-hover:text-indigo-600 transition-colors">{supplier.name}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Phone size={14} />
                    </div>
                    <span className="text-sm font-medium text-slate-600">{supplier.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <MapPin size={14} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 line-clamp-2">{supplier.address || 'No address'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Hash size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="label-caps">GST Number</span>
                      <span className="text-xs font-bold text-slate-900 data-value">{supplier.gst || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Partner</span>
                  <button className="text-indigo-600 hover:underline flex items-center gap-1 text-xs font-bold">
                    <span>View History</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
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
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{editingSupplier ? 'Edit Supplier' : 'New Supplier'}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">Fill in vendor information</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Supplier Name</label>
                    <input 
                      required 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g. Global Polymers"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Phone Number</label>
                    <input 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="label-caps ml-1">GST Number</label>
                  <input 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                    value={formData.gst} 
                    onChange={e => setFormData({...formData, gst: e.target.value})} 
                    placeholder="24AAAAA0000A1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-caps ml-1">Full Address</label>
                  <textarea 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                    rows={3} 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="Enter complete office/factory address..."
                  />
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
                    Save Supplier
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

export default Suppliers;
