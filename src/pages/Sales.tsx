import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await db.sales.getAll();
      setSales(data);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this sale?")) return;

    try {
      await db.sales.softDelete(id, user?.email ?? '');
      toast.success("Sale deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-8">

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sales</h2>
          <p className="text-slate-500 text-sm">Manage customer sales</p>
        </div>

        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={16} />
          Add Sale
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Invoice</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">Loading...</td>
              </tr>
            ) : sales.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{s.invoice_number}</td>
                <td className="p-3">{format(new Date(s.date), 'dd MMM yyyy')}</td>
                <td className="p-3">{s.customer_name}</td>
                <td className="p-3 text-emerald-600 font-bold">
                  ₹{s.total_amount?.toLocaleString()}
                </td>
                <td className="p-3 text-right space-x-2">
                  <button className="p-2 hover:bg-indigo-50 rounded">
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-2 hover:bg-rose-50 text-rose-600 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;