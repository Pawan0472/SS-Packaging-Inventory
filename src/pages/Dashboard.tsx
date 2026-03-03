import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Factory
} from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../services/db';
import { toast } from 'react-hot-toast';

const Dashboard = () => {

  const [stats, setStats] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalProducts: 0,
    totalProduction: 0
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [sales, purchases, products, production] = await Promise.all([
        db.sales.getAll(),
        db.purchases.getAll(),
        db.products.getAll(),
        db.production.getAll()
      ]);

      setStats({
        totalSales: sales.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0),
        totalPurchases: purchases.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0),
        totalProducts: products.length,
        totalProduction: production.length
      });

    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">Overview of SS Packaging ERP</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <StatCard
          label="Total Sales"
          value={`₹${stats.totalSales.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-emerald-600"
        />

        <StatCard
          label="Total Purchases"
          value={`₹${stats.totalPurchases.toLocaleString()}`}
          icon={ShoppingCart}
          color="bg-indigo-600"
        />

        <StatCard
          label="Products"
          value={stats.totalProducts}
          icon={Package}
          color="bg-orange-600"
        />

        <StatCard
          label="Production Entries"
          value={stats.totalProduction}
          icon={Factory}
          color="bg-rose-600"
        />

      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white rounded-2xl border p-6 shadow-sm"
  >
    <div className="flex justify-between items-center">
      <div className={`${color} p-3 rounded-xl text-white`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="mt-4">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
  </motion.div>
);

export default Dashboard;