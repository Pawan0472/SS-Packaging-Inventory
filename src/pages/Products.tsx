import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { toast } from 'react-hot-toast';

import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { isDemo, user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Bottle',
    gram_weight: '',
    price: '',
    min_stock_level: ''
  });

  const fetchData = async () => {
    if (isDemo) {
      setTimeout(() => {
        setProducts([
          { id: 1, name: '500ml PET Bottle', category: 'Bottle', gram_weight: '18g', stock: 12500, min_stock_level: 5000, price: '4.50' },
          { id: 2, name: '1L PET Preform', category: 'Preform', gram_weight: '24g', stock: 4200, min_stock_level: 10000, price: '8.20' },
          { id: 3, name: '2L PET Bottle', category: 'Bottle', gram_weight: '32g', stock: 8900, min_stock_level: 5000, price: '12.00' },
          { id: 4, name: '28mm Blue Cap', category: 'Other', gram_weight: '2.5g', stock: 1200, min_stock_level: 5000, price: '0.85' },
          { id: 5, name: '500ml Preform', category: 'Preform', gram_weight: '16g', stock: 15000, min_stock_level: 10000, price: '3.90' },
        ]);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const data = await db.products.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      toast.success('Demo: Product saved successfully');
      setIsModalOpen(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
        stock: editingProduct ? editingProduct.stock : 0
      };

      if (editingProduct) {
        await db.products.update(editingProduct.id, payload);
        toast.success('Product updated successfully');
      } else {
        await db.products.create(payload);
        toast.success('Product created successfully');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', category: 'Bottle', gram_weight: '', price: '', min_stock_level: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id: number) => {
    if (isDemo) {
      toast.success('Demo: Product deleted');
      return;
    }

    if (!window.confirm('Are you sure?')) return;
    try {
      await db.products.delete(id);
      toast.success('Product deleted');
      fetchData();
    } catch (error) {
      toast.error('Error deleting product');
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Products</h2>
          <p className="text-slate-500 mt-1">Manage your inventory and product catalogue.</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', category: 'Bottle', gram_weight: '', price: '', min_stock_level: '' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search products by name, SKU or category..." 
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
                <th>Product Details</th>
                <th>Category</th>
                <th>Weight</th>
                <th>Stock Level</th>
                <th>Unit Price</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-8 px-6 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Package size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No products found</h3>
                    <p className="text-slate-500 mt-1">Try adjusting your search or add a new product.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="group">
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{product.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU: SS-PRD-{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {product.category}
                      </span>
                    </td>
                    <td className="data-value">{product.gram_weight}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className={cn("font-bold", (product.stock || 0) < (product.min_stock_level || 0) ? "text-rose-500" : "text-slate-900")}>
                          {(product.stock || 0).toLocaleString()}
                        </span>
                        <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full", (product.stock || 0) < (product.min_stock_level || 0) ? "bg-rose-500" : "bg-emerald-500")}
                            style={{ width: `${Math.min(((product.stock || 0) / (product.min_stock_level || 1)) * 50, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="font-bold text-slate-900">₹{product.price}</td>
                    <td>
                      {(product.stock || 0) < (product.min_stock_level || 0) ? (
                        <div className="flex items-center gap-1.5 text-rose-500">
                          <AlertTriangle size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Low Stock</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <TrendingUp size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Healthy</span>
                        </div>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => {
                            setEditingProduct(product);
                            setFormData({
                              name: product.name,
                              category: product.category,
                              gram_weight: product.gram_weight,
                              price: product.price,
                              min_stock_level: product.min_stock_level
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                          <MoreVertical size={16} />
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
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {filteredProducts.length} products</p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-900 transition-all disabled:opacity-50">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">1</button>
            </div>
            <button className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-900 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
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
                  <h3 className="text-2xl font-bold text-slate-900">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">Fill in product details</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="label-caps ml-1">Product Name</label>
                  <input 
                    required 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. 500ml PET Bottle"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Category</label>
                    <select 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="Bottle">Bottle</option>
                      <option value="Preform">Preform</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Weight (e.g. 18g)</label>
                    <input 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                      value={formData.gram_weight} 
                      onChange={e => setFormData({...formData, gram_weight: e.target.value})} 
                      placeholder="18g"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Unit Price (₹)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      placeholder="4.50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Min Stock Level</label>
                    <input 
                      type="number"
                      required
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                      value={formData.min_stock_level} 
                      onChange={e => setFormData({...formData, min_stock_level: e.target.value})} 
                      placeholder="5000"
                    />
                  </div>
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
                    Save Product
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

export default Products;
