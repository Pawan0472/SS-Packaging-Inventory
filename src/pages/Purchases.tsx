import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Trash2,
  X,
  Calendar,
  FileText,
  Truck,
  Eye,
  Receipt
} from 'lucide-react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface Purchase {
  id: number;
  invoice_number: string;
  date: string;
  supplier_name: string;
  total_amount: number;
  transport_cost: number;
}

const Purchases: React.FC = () => {
  const { user } = useAuth();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [search, setSearch] = useState('');

  // ================= FETCH DATA =================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await db.purchases.getAll();
      setPurchases(data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= VIEW DETAILS =================
  const viewDetails = async (id: number) => {
    try {
      const data = await db.purchases.getById(id);
      setSelectedPurchase(data);
      setIsViewOpen(true);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  // ================= SOFT DELETE =================
  const handleDelete = async (id: number) => {
    if (!confirm('This will reverse stock and hide this purchase. Continue?')) return;

    try {
      await db.purchases.softDelete(id, user?.email ?? '');
      toast.success('Purchase deleted');
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const filtered = purchases.filter(p =>
    p.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Purchases</h2>
          <p className="text-slate-500 text-sm">Track procurement invoices</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input
          className="pl-10 pr-4 py-2 border rounded-lg w-full"
          placeholder="Search by invoice or supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Invoice</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Supplier</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400">
                  No purchases found
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{p.invoice_number}</td>
                  <td className="p-3">{format(new Date(p.date), 'dd MMM yyyy')}</td>
                  <td className="p-3">{p.supplier_name}</td>
                  <td className="p-3 text-emerald-600 font-bold">
                    ₹{p.total_amount.toLocaleString()}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => viewDetails(p.id)}
                      className="p-2 hover:bg-indigo-50 rounded"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 hover:bg-rose-50 text-rose-600 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      {isViewOpen && selectedPurchase && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[600px] rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">
                Invoice: {selectedPurchase.invoice_number}
              </h3>
              <button onClick={() => setIsViewOpen(false)}>
                <X />
              </button>
            </div>

            <p><strong>Supplier:</strong> {selectedPurchase.supplier_name}</p>
            <p><strong>Date:</strong> {format(new Date(selectedPurchase.date), 'dd MMM yyyy')}</p>

            <table className="w-full mt-4 border">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedPurchase.items.map((item: any) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">{item.product_name}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">₹{item.rate}</td>
                    <td className="p-2 text-right font-bold">
                      ₹{item.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right font-bold text-lg mt-4">
              Grand Total: ₹{selectedPurchase.total_amount.toLocaleString()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Purchases;