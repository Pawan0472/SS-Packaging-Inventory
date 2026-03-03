import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const data = await db.sales.getAll();
      setSales(data);
    } catch {
      toast.error("Failed to load sales");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete sale?")) return;

    try {
      await db.sales.softDelete(id, user.email);
      toast.success("Sale deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sales</h2>
      <table className="w-full border">
        <thead>
          <tr>
            <th>ID</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>₹{s.total_amount}</td>
              <td>
                <button onClick={() => handleDelete(s.id)}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Sales;