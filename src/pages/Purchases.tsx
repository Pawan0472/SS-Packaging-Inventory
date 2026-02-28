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
    if (isDemo) {
      setPurchases([
        { id: 1, invoice_number: 'INV-2024-001', date: '2024-03-15', supplier_name: 'Global Polymers Ltd', total_amount: 125000, transport_cost: 2500 },
        { id: 2, invoice_number: 'INV-2024-002', date: '2024-03-18', supplier_name: 'Apex Masterbatch', total_amount: 45000, transport_cost: 800 },
        { id: 3, invoice_number: 'INV-2024-003', date: '2024-03-20', supplier_name: 'Shree Krishna Packaging', total_amount: 82000, transport_cost: 1500 },
      ]);
      setProducts([
        { id: 1, name: '500ml PET Bottle', category: 'Bottle' },
        { id: 2, name: '1L PET Preform', category: 'Preform' },
        { id: 3, name: '2L PET Bottle', category: 'Bottle' },
      ]);
      setSuppliers([
        { id: 1, name: 'Global Polymers Ltd' },
        { id: 2, name: 'Apex Masterbatch' },
        { id: 3, name: 'Shree Krishna Packaging' },
      ]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [pRes, prodRes, supRes] = await Promise.all([
        fetch('/api/purchases', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/suppliers', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (pRes.ok) setPurchases(await pRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, isDemo]);

  const addItem = () => setItems([...items, { product_id: 0, quantity: 0, rate: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof PurchaseItem, value: number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0) + parseFloat(transportCost || '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      toast.success('Demo: Purchase recorded successfully');
      setIsModalOpen(false);
      resetForm();
      return;
    }

    if (!supplierId || items.some(i => !i.product_id || !i.quantity || !i.rate)) {
      return toast.error('Please fill all required fields');
    }

    const formData = new FormData();
    formData.append('invoice_number', invoiceNumber);
    formData.append('date', date);
    formData.append('supplier_id', supplierId);
    formData.append('transport_cost', transportCost);
    formData.append('items', JSON.stringify(items));
    if (selectedFile) formData.append('image', selectedFile);

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to record purchase');

      toast.success('Purchase recorded successfully');
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
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
      const res = await fetch(`/api/purchases/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedPurchase(data);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load details');
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
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Purchases</h2>
          <p className="text-slate-500 mt-1">Track raw material procurement and vendor invoices.</p>
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by invoice # or supplier..." 
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
                    <td colSpan={5} className="py-8 px-6 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Receipt size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No purchases found</h3>
                    <p className="text-slate-500 mt-1 font-medium">Record your first procurement invoice to see it here.</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="group">
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.invoice_number}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {p.id + 1000}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600 font-medium">{format(new Date(p.date), 'dd MMM yyyy')}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-slate-400" />
                        <span className="font-bold text-slate-700">{p.supplier_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-emerald-600 font-bold">₹{p.total_amount.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Incl. ₹{p.transport_cost} Transport</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => viewDetails(p.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Eye size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                          <MoreVertical size={18} />
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
        <div className="p-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {filteredPurchases.length} results</p>
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
              className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Record New Purchase</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">Enter invoice and item details</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto">
                {/* Master Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Invoice Number</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="INV-2024-001"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Purchase Date</label>
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
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Select Supplier</label>
                    <div className="relative">
                      <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none transition-all"
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
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Purchase Items</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <PlusCircle size={16} />
                      Add Another Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="col-span-12 md:col-span-5">
                          <label className="label-caps ml-1 mb-1 block">Product</label>
                          <select
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all"
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
                          <label className="label-caps ml-1 mb-1 block">Quantity</label>
                          <input
                            required
                            type="number"
                            step="0.01"
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="col-span-6 md:col-span-2">
                          <label className="label-caps ml-1 mb-1 block">Rate (₹)</label>
                          <input
                            required
                            type="number"
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="col-span-10 md:col-span-2">
                          <label className="label-caps ml-1 mb-1 block">Subtotal</label>
                          <div className="px-4 py-2.5 text-sm font-bold text-slate-900 bg-white rounded-xl border border-slate-100 data-value">
                            ₹{(item.quantity * item.rate).toLocaleString()}
                          </div>
                        </div>
                        <div className="col-span-2 md:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6 border-t border-slate-100">
                  <div className="space-y-4">
                    <label className="label-caps ml-1 block">Invoice Attachment</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full py-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-indigo-400 group-hover:bg-indigo-50/30 transition-all">
                        <ImageIcon className="text-slate-400 group-hover:text-indigo-500" size={32} />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          {selectedFile ? selectedFile.name : 'Upload Invoice Image'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 bg-slate-50 p-6 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transport Cost</span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                        <input
                          type="number"
                          className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-right font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/10"
                          value={transportCost}
                          onChange={(e) => setTransportCost(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="h-px bg-slate-200"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Grand Total</span>
                      <span className="text-2xl font-bold text-indigo-600 data-value">₹{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4 sticky bottom-0 bg-white pb-2">
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
              className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Invoice: {selectedPurchase.invoice_number}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">Transaction Details</p>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="label-caps">Supplier</p>
                    <p className="text-lg font-bold text-slate-900">{selectedPurchase.supplier_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="label-caps">Transaction Date</p>
                    <p className="text-lg font-bold text-slate-900">{format(new Date(selectedPurchase.date), 'dd MMMM yyyy')}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">Product</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 text-right">Qty</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 text-right">Rate</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPurchase.items.map((item: any) => (
                        <tr key={item.id} className="bg-white">
                          <td className="py-3 px-4 text-sm font-bold text-slate-900">{item.product_name}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 text-right data-value">{item.quantity}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 text-right data-value">₹{item.rate}</td>
                          <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right data-value">₹{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-xs font-bold text-slate-400 text-right uppercase tracking-widest">Subtotal</td>
                        <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right data-value">₹{(selectedPurchase.total_amount - selectedPurchase.transport_cost).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-xs font-bold text-slate-400 text-right uppercase tracking-widest">Transport</td>
                        <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right data-value">₹{selectedPurchase.transport_cost.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-indigo-50">
                        <td colSpan={3} className="py-4 px-4 text-sm font-bold text-indigo-900 text-right uppercase tracking-widest">Grand Total</td>
                        <td className="py-4 px-4 text-xl font-bold text-indigo-600 text-right data-value">₹{selectedPurchase.total_amount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedPurchase.image_url && (
                  <div className="pt-4">
                    <p className="label-caps mb-4">Invoice Attachment</p>
                    <div className="relative group overflow-hidden rounded-2xl border border-slate-200">
                      <img 
                        src={selectedPurchase.image_url} 
                        alt="Invoice" 
                        className="w-full h-auto max-h-80 object-contain bg-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all flex items-center justify-center">
                        <button className="bg-white p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                          <ExternalLink size={20} className="text-slate-900" />
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
