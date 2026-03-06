import React, { useState, useEffect } from 'react';
import { 
  Users, 
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
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  gst: string;
}

import { db } from '../services/db';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const { token, user, isDemo } = useAuth();

  const [formData, setFormData] = useState({ name: '', phone: '', address: '', gst: '' });

  const fetchCustomers = async () => {
    if (isDemo) {
      setCustomers([
        { id: 1, name: 'Reliance Industries', phone: '+91 22 4444 5555', address: 'Reliance Corporate Park, Ghansoli, Navi Mumbai', gst: '27AAAAA0000A1Z5' },
        { id: 2, name: 'Tata Consumer Products', phone: '+91 22 6666 7777', address: 'Kirloskar Business Park, Hebbal, Bengaluru', gst: '29BBBBB1111B1Z2' },
        { id: 3, name: 'Hindustan Unilever', phone: '+91 22 3333 4444', address: 'BD Sawant Marg, Chakala, Andheri East, Mumbai', gst: '27CCCCC2222C1Z9' },
      ]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await db.customers.getAll();
      setCustomers(data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token, isDemo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await db.customers.update(editingCustomer.id, formData, user?.email || 'system');
        toast.success('Customer updated');
      } else {
        await db.customers.create(formData, user?.email || 'system');
        toast.success('Customer created');
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', address: '', gst: '' });
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to save customer');
    }
  };

  const handleDelete = async (id: number) => {
    if (isDemo) {
      toast.success('Demo: Customer deleted');
      return;
    }

    if (!window.confirm('Are you sure? This will hide the customer from the list.')) return;
    try {
      await db.customers.softDelete(id, user?.email || 'system');
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (error) {
      toast.error('Error deleting customer');
    }
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Customers</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your client relationships and accounts.</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', address: '', gst: '' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search customers by name, GST or location..." 
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse"></div>
            ))
          ) : filteredCustomers.length === 0 ? (
            <div className="col-span-full py-20 text-center bento-card">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No customers found</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or add a new client.</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={customer.id}
                className="bento-card group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <UserCheck size={24} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => {
                        setEditingCustomer(customer);
                        setFormData(customer);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-400 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl"
                    >
                      <Edit2 size={16} />
                    </button>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 text-slate-400 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{customer.name}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600">
                      <Phone size={14} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{customer.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 shrink-0">
                      <MapPin size={14} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-2">{customer.address || 'No address'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600">
                      <Hash size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="label-caps">GST Number</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white data-value">{customer.gst || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Key Account</span>
                  <button className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-xs font-bold">
                    <span>Order History</span>
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
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{editingCustomer ? 'Edit Customer' : 'New Customer'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">Fill in client information</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Customer Name</label>
                    <input 
                      required 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g. Reliance Industries"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Phone Number</label>
                    <input 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="label-caps ml-1">GST Number</label>
                  <input 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                    value={formData.gst} 
                    onChange={e => setFormData({...formData, gst: e.target.value})} 
                    placeholder="24AAAAA0000A1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-caps ml-1">Full Address</label>
                  <textarea 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
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
                    className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all"
                  >
                    Save Customer
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

export default Customers;
