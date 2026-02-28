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
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Beautiful mock data for immediate "wow" factor
    setTimeout(() => {
      setProducts([
        { id: 1, name: '500ml PET Bottle', category: 'Bottle', weight: '18g', stock: 12500, min: 5000, price: '₹4.50' },
        { id: 2, name: '1L PET Preform', category: 'Preform', weight: '24g', stock: 4200, min: 10000, price: '₹8.20' },
        { id: 3, name: '2L PET Bottle', category: 'Bottle', weight: '32g', stock: 8900, min: 5000, price: '₹12.00' },
        { id: 4, name: '28mm Blue Cap', category: 'Other', weight: '2.5g', stock: 1200, min: 5000, price: '₹0.85' },
        { id: 5, name: '500ml Preform', category: 'Preform', weight: '16g', stock: 15000, min: 10000, price: '₹3.90' },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Products</h2>
          <p className="text-slate-500 mt-1">Manage your inventory and product catalogue.</p>
        </div>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group">
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
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="group">
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{product.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU: SS-PRD-{product.id + 100}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {product.category}
                      </span>
                    </td>
                    <td className="data-value">{product.weight}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className={cn("font-bold", product.stock < product.min ? "text-rose-500" : "text-slate-900")}>
                          {product.stock.toLocaleString()}
                        </span>
                        <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full", product.stock < product.min ? "bg-rose-500" : "bg-emerald-500")}
                            style={{ width: `${Math.min((product.stock / product.min) * 50, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="font-bold text-slate-900">{product.price}</td>
                    <td>
                      {product.stock < product.min ? (
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
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
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
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing 1-5 of 124 products</p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-900 transition-all disabled:opacity-50">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(i => (
                <button key={i} className={cn(
                  "w-8 h-8 rounded-xl text-xs font-bold transition-all",
                  i === 1 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:bg-white hover:text-slate-900"
                )}>
                  {i}
                </button>
              ))}
            </div>
            <button className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-900 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
