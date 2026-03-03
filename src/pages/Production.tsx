import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const Production = () => {
  const { user } = useAuth();
  const [production, setProduction] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await db.production.getAll();
      setProduction(data);
    } catch {
      toast.error("Failed to load production");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this production entry?")) return;

    try {
      await db.production.softDelete(id, user?.email ?? '');
      toast.success("Production deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-8">

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Production</h2>
          <p className="text-slate-500 text-sm">Manage production entries</p>
        </div>

        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={16} />
          Add Production
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Preform</th>
              <th className="p-3 text-left">Bottle</th>
              <th className="p-3 text-left">Quantity</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">Loading...</td>
              </tr>
            ) : production.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{format(new Date(p.date), 'dd MMM yyyy')}</td>
                <td className="p-3">{p.preform_name}</td>
                <td className="p-3">{p.bottle_name}</td>
                <td className="p-3">{p.quantity}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleDelete(p.id)}
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

export default Production;