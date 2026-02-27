import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  PlusCircle, 
  Calendar,
  FileText,
  Users,
  Loader2,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

interface Product {
  id: number;
  name: string;
  current_stock: number;
}

interface Customer {
  id: number;
  name: string;
}

interface SalesItem {
  product_id: number;
  quantity: number;
  rate: number;
}

interface Sale {
  id: number;
  invoice_number: string;
  date: string;
  customer_name: string;
  total_amount: number;
  transport_cost: number;
}

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  
  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customerId, setCustomerId] = useState('');
  const [transportCost, setTransportCost] = useState('0');
  const [items, setItems] = useState<SalesItem[]>([{ product_id: 0, quantity: 0, rate: 0 }]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { token, user } = useAuth();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sRes, prodRes, custRes] = await Promise.all([
        fetch('/api/sales', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/customers', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      setSales(await sRes.json());
      setProducts(await prodRes.json());
      setCustomers(await custRes.json());
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const addItem = () => setItems([...items, { product_id: 0, quantity: 0, rate: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof SalesItem, value: number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0) + parseFloat(transportCost || '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.some(i => !i.product_id || !i.quantity || !i.rate)) {
      return toast.error('Please fill all required fields');
    }

    // Stock Validation
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (product && product.current_stock < item.quantity) {
        return toast.error(`Insufficient stock for ${product.name}. Available: ${product.current_stock}`);
      }
    }

    const formData = new FormData();
    formData.append('invoice_number', invoiceNumber);
    formData.append('date', date);
    formData.append('customer_id', customerId);
    formData.append('transport_cost', transportCost);
    formData.append('items', JSON.stringify(items));
    if (selectedFile) formData.append('image', selectedFile);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to record sale');

      toast.success('Sale recorded successfully');
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
    setCustomerId('');
    setTransportCost('0');
    setItems([{ product_id: 0, quantity: 0, rate: 0 }]);
    setSelectedFile(null);
  };

  const viewDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/sales/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedSale(data);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Sales Invoices</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus size={20} />
          <span>New Sale</span>
        </button>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600" size={32} />
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No sales recorded</td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{s.invoice_number}</td>
                    <td className="px-6 py-4 text-slate-600">{format(new Date(s.date), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-slate-600">{s.customer_name}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">₹{s.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => viewDetails(s.id)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
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
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" />
                  Record New Sale
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                {/* Master Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        required
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="SAL-001"
                      />
                    </div>
                  </div>
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select
                        required
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                      >
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-700">Sales Items</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                    >
                      <PlusCircle size={16} />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const selectedProduct = products.find(p => p.id === item.product_id);
                      const isLowStock = selectedProduct && selectedProduct.current_stock < item.quantity;

                      return (
                        <div key={index} className={cn(
                          "grid grid-cols-12 gap-3 items-end p-3 rounded-xl border transition-colors",
                          isLowStock ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100"
                        )}>
                          <div className="col-span-4">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
                            <select
                              required
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                              value={item.product_id}
                              onChange={(e) => updateItem(index, 'product_id', parseInt(e.target.value))}
                            >
                              <option value="0">Select Product</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Qty (PCS)</label>
                            <input
                              required
                              type="number"
                              className={cn(
                                "w-full px-3 py-2 rounded-lg border focus:ring-2 outline-none text-sm",
                                isLowStock ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                              )}
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Rate</label>
                            <input
                              required
                              type="number"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                              value={item.rate}
                              onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value))}
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Total</label>
                            <div className="px-3 py-2 text-sm font-bold text-slate-700 flex items-center justify-between">
                              <span>₹{(item.quantity * item.rate).toLocaleString()}</span>
                              {isLowStock && (
                                <div className="flex items-center gap-1 text-red-600 text-[10px] font-bold">
                                  <AlertCircle size={12} />
                                  <span>LOW STOCK</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                              className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dispatch Image (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Transport Cost:</span>
                      <input
                        type="number"
                        className="w-32 px-3 py-1 rounded-lg border border-slate-200 text-right font-bold"
                        value={transportCost}
                        onChange={(e) => setTransportCost(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xl font-bold text-slate-900 pt-2 border-t border-slate-100">
                      <span>Total Amount:</span>
                      <span className="text-indigo-600">₹{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white pb-2">
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
                    Save Sale
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Invoice Details: {selectedSale.invoice_number}</h3>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Customer</p>
                    <p className="font-bold text-slate-900">{selectedSale.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Date</p>
                    <p className="font-bold text-slate-900">{format(new Date(selectedSale.date), 'dd MMM yyyy')}</p>
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 text-slate-500">Product</th>
                      <th className="text-right py-2 text-slate-500">Qty</th>
                      <th className="text-right py-2 text-slate-500">Rate</th>
                      <th className="text-right py-2 text-slate-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedSale.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2 font-medium">{item.product_name}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">₹{item.rate}</td>
                        <td className="py-2 text-right font-bold">₹{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200">
                      <td colSpan={3} className="py-2 text-right text-slate-500">Subtotal</td>
                      <td className="py-2 text-right font-bold">₹{(selectedSale.total_amount - selectedSale.transport_cost).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-2 text-right text-slate-500">Transport</td>
                      <td className="py-2 text-right font-bold">₹{selectedSale.transport_cost.toLocaleString()}</td>
                    </tr>
                    <tr className="text-lg">
                      <td colSpan={3} className="py-2 text-right font-bold text-slate-900">Total</td>
                      <td className="py-2 text-right font-bold text-indigo-600">₹{selectedSale.total_amount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>

                {selectedSale.image_url && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Dispatch Image</p>
                    <img 
                      src={selectedSale.image_url} 
                      alt="Dispatch" 
                      className="max-h-64 rounded-xl border border-slate-200 mx-auto"
                      referrerPolicy="no-referrer"
                    />
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

export default Sales;
