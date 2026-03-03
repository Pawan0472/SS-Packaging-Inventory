import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Production = () => {
  const { user } = useAuth();
  const [production, setProduction] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const data = await db.production.getAll();
      setProduction(data);
    } catch {
      toast.error("Failed to load production");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete production entry?")) return;

    try {
      await db.production.softDelete(id, user.email);
      toast.success("Production deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Production</h2>
      <table className="w-full border">
        <thead>
          <tr>
            <th>ID</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {production.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.quantity}</td>
              <td>
                <button onClick={() => handleDelete(p.id)}>
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

export default Production;