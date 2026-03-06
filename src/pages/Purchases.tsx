import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  PlusCircle, 
  Calendar,
  FileText,
  Truck,
  Loader2,
  Eye,
  Image as ImageIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

interface Product {
  id: number;
  name: string;
  category?: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface PurchaseItem {
  product_id: number;
  quantity: number;
  rate: number;
  weight_kg?: number;
}

interface Purchase {
  id: number;
  invoice_number: string;
  date: string;
  supplier_name: string;
  total_amount: number;
  transport_cost: number;
}

const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [supplierId, setSupplierId] = useState('');
  const [transportCost, setTransportCost] = useState('0');
  const [items, setItems] = useState<PurchaseItem[]>([{ product_id: 0, quantity: 0, rate: 0 }]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { token, user, isDemo } = useAuth();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pData, prodData, supData] = await Promise.all([
        db.purchases.getAll(),
        db.products.getAll(),
        db.suppliers.getAll()
      ]);
      setPurchases(pData);
      setProducts(prodData);
      setSuppliers(supData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, isDemo]);

  const addItem = () => setItems([...items, { product_id: 0, quantity: 0, rate: 0, weight_kg: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof PurchaseItem, value: number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;

    // Auto-calculate pieces if weight is changed and it's a preform
    if (field === 'weight_kg') {
      const product = products.find(p => p.id === newItems[index].product_id);
      if (product && (product as any).gram_weight) {
        const gramWeight = typeof (product as any).gram_weight === 'string' 
          ? parseFloat((product as any).gram_weight) 
          : (product as any).gram_weight;
        
        if (gramWeight > 0) {
          newItems[index].quantity = Math.floor((value * 1000) / gramWeight);
        }
      }
    }
    
    // Auto-calculate weight if quantity is changed and it's a preform
    if (field === 'quantity') {
      const product = products.find(p => p.id === newItems[index].product_id);
      if (product && (product as any).gram_weight) {
        const gramWeight = typeof (product as any).gram_weight === 'string' 
          ? parseFloat((product as any).gram_weight) 
          : (product as any).gram_weight;
        
        if (gramWeight > 0) {
          newItems[index].weight_kg = parseFloat(((value * gramWeight) / 1000).toFixed(2));
        }
      }
    }

    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      if (product?.category === 'Preform' && item.weight_kg) {
        return sum + (item.weight_kg * item.rate);
      }
      return sum + (item.quantity * item.rate);
    }, 0) + parseFloat(transportCost || '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.some(i => !i.product_id || (!i.quantity && !i.weight_kg) || !i.rate)) {
      return toast.error('Please fill all required fields');
    }

    try {
      const processedItems = items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        if (product?.category === 'Preform' && item.weight_kg) {
          const gramWeight = typeof (product as any).gram_weight === 'string' 
            ? parseFloat((product as any).gram_weight) 
            : (product as any).gram_weight || 0;
          
          if (gramWeight > 0) {
            const qtyPcs = Math.floor((item.weight_kg * 1000) / gramWeight);
            const totalItemAmount = item.weight_kg * item.rate;
            const ratePerPiece = totalItemAmount / qtyPcs;
            return {
              product_id: item.product_id,
              quantity: qtyPcs,
              rate: ratePerPiece
            };
          }
        }
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          rate: item.rate
        };
      });

      await db.purchases.create({
        invoice_number: invoiceNumber,
        date,
        supplier_id: parseInt(supplierId),
        transport_cost: parseFloat(transportCost || '0'),
        total_amount: calculateTotal()
      }, processedItems, user?.email || 'system');

      toast.success('Purchase recorded successfully');
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record purchase');
    }
  };

  const resetForm = () => {
    setInvoiceNumber('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setSupplierId('');
    setTransportCost('0');
    setItems([{ product_id: 0, quantity: 0, rate: 0 }]);
    setSelectedFile(null);
  };

  const viewDetails = async (id: number) => {
    if (isDemo) {
      const p = purchases.find(pur => pur.id === id);
      setSelectedPurchase({
        ...p,
        items: [
          { id: 1, product_name: '1L PET Preform', quantity: 5000, rate: 8.20, total: 41000 },
          { id: 2, product_name: '28mm Blue Cap', quantity: 10000, rate: 0.85, total: 8500 },
        ]
      });
      setIsViewModalOpen(true);
      return;
    }

    try {
      const data = await db.purchases.getById(id);
      setSelectedPurchase(data);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure? This will hide it and reverse the stock.')) return;

    try {
      await db.purchases.softDelete(id, user?.email || 'system');
      toast.success('Purchase deleted and stock reversed');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete purchase');
    }
  };

  const filteredPurchases = purchases.filter(p => 
    p.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Purchases</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track raw material procurement and vendor invoices.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>New Purchase</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search by invoice # or supplier..." 
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

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Invoice Details</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Total Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="py-8 px-6 bg-slate-50/20 dark:bg-slate-800/20"></td>
                  </tr>
                ))
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
                      <Receipt size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No purchases found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Record your first procurement invoice to see it here.</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="group">
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{p.invoice_number}</p>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID: {p.id + 1000}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600 dark:text-slate-400 font-medium">{format(new Date(p.date), 'dd MMM yyyy')}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-slate-400 dark:text-slate-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">{p.supplier_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{p.total_amount.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Incl. ₹{p.transport_cost} Transport</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => viewDetails(p.id)}
                          className="p-2 text-slate-400 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-slate-400 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Delete Purchase"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Showing {filteredPurchases.length} results</p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50">
              <ChevronLeft size={18} />
            </button>
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* New Purchase Modal */}
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
              className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Record New Purchase</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">Enter invoice and item details</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto">
                {/* Master Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Invoice Number</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                      <input
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="INV-2024-001"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Purchase Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                      <input
                        required
                        type="date"
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Select Supplier</label>
                    <div className="relative">
                      <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                      <select
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                      >
                        <option value="">Choose Vendor</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Purchase Items</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-bold flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <PlusCircle size={16} />
                      Add Another Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-end bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="col-span-12 md:col-span-5">
                          <label className="label-caps ml-1 mb-1 block">Product</label>
                          <select
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all text-slate-900 dark:text-white"
                            value={item.product_id}
                            onChange={(e) => updateItem(index, 'product_id', parseInt(e.target.value))}
                          >
                            <option value="0">Select Product</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.category === 'Preform' ? 'KG' : 'PCS'})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-6 md:col-span-2">
                          <label className="label-caps ml-1 mb-1 block">Quantity (PCS)</label>
                          <input
                            required
                            type="number"
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all text-slate-900 dark:text-white"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                          />
                        </div>
                        {products.find(p => p.id === item.product_id)?.category === 'Preform' && (
                          <div className="col-span-6 md:col-span-2">
                            <label className="label-caps ml-1 mb-1 block">Weight (KG)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-4 py-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all text-slate-900 dark:text-white font-bold"
                              value={item.weight_kg || ''}
                              onChange={(e) => updateItem(index, 'weight_kg', parseFloat(e.target.value))}
                              placeholder="KG"
                            />
                          </div>
                        )}
                        <div className="col-span-6 md:col-span-2">
                          <label className="label-caps ml-1 mb-1 block">
                            {products.find(p => p.id === item.product_id)?.category === 'Preform' ? 'Rate (per KG)' : 'Rate (₹)'}
                          </label>
                          <input
                            required
                            type="number"
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all text-slate-900 dark:text-white"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="col-span-10 md:col-span-2">
                          <label className="label-caps ml-1 mb-1 block">Subtotal</label>
                          <div className="px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 data-value">
                            ₹{(() => {
                              const product = products.find(p => p.id === item.product_id);
                              if (product?.category === 'Preform' && item.weight_kg) {
                                return (item.weight_kg * item.rate).toLocaleString();
                              }
                              return (item.quantity * item.rate).toLocaleString();
                            })()}
                          </div>
                        </div>
                        <div className="col-span-2 md:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                            className="p-2.5 text-slate-400 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-30"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-4">
                    <label className="label-caps ml-1 block">Invoice Attachment</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-indigo-400 dark:group-hover:border-indigo-500 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-500/5 transition-all">
                        <ImageIcon className="text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" size={32} />
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {selectedFile ? selectedFile.name : 'Upload Invoice Image'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transport Cost</span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs font-bold">₹</span>
                        <input
                          type="number"
                          className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-right font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10"
                          value={transportCost}
                          onChange={(e) => setTransportCost(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Grand Total</span>
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 data-value">₹{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
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
                    Confirm Purchase
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedPurchase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Invoice: {selectedPurchase.invoice_number}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">Transaction Details</p>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="label-caps">Supplier</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedPurchase.supplier_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="label-caps">Transaction Date</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{format(new Date(selectedPurchase.date), 'dd MMMM yyyy')}</p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">Product</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 text-right">Qty</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 text-right">Rate</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedPurchase.items.map((item: any) => (
                        <tr key={item.id} className="bg-white dark:bg-slate-900">
                          <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white">{item.product_name}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right data-value">{item.quantity}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right data-value">₹{item.rate}</td>
                          <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white text-right data-value">₹{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-xs font-bold text-slate-400 dark:text-slate-500 text-right uppercase tracking-widest">Subtotal</td>
                        <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white text-right data-value">₹{(selectedPurchase.total_amount - selectedPurchase.transport_cost).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-xs font-bold text-slate-400 dark:text-slate-500 text-right uppercase tracking-widest">Transport</td>
                        <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white text-right data-value">₹{selectedPurchase.transport_cost.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-indigo-50 dark:bg-indigo-500/10">
                        <td colSpan={3} className="py-4 px-4 text-sm font-bold text-indigo-900 dark:text-indigo-300 text-right uppercase tracking-widest">Grand Total</td>
                        <td className="py-4 px-4 text-xl font-bold text-indigo-600 dark:text-indigo-400 text-right data-value">₹{selectedPurchase.total_amount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedPurchase.image_url && (
                  <div className="pt-4">
                    <p className="label-caps mb-4">Invoice Attachment</p>
                    <div className="relative group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                      <img 
                        src={selectedPurchase.image_url} 
                        alt="Invoice" 
                        className="w-full h-auto max-h-80 object-contain bg-slate-100 dark:bg-slate-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all flex items-center justify-center">
                        <button className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                          <ExternalLink size={20} className="text-slate-900 dark:text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Purchases;
