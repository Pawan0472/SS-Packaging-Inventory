import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Factory, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface Stats {
  totalProducts: number;
  totalPurchases: number;
  totalSales: number;
  totalProduction: number;
  todaySales: number;
  todayPurchases: number;
  lowStockCount: number;
  totalStockValue: number;
  monthlyProfit: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          fetch('/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/dashboard/charts', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!statsRes.ok || !chartRes.ok) throw new Error('Failed to fetch dashboard data');

        const statsData = await statsRes.json();
        const chartData = await chartRes.json();

        setStats(statsData);
        setChartData(chartData);
      } catch (error) {
        toast.error('Error loading dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  const statCards = [
    { name: 'Total Products', value: stats?.totalProducts, icon: Package, color: 'bg-blue-500' },
    { name: 'Purchase Invoices', value: stats?.totalPurchases, icon: ShoppingCart, color: 'bg-emerald-500' },
    { name: 'Sales Invoices', value: stats?.totalSales, icon: TrendingUp, color: 'bg-indigo-500' },
    { name: 'Production Entries', value: stats?.totalProduction, icon: Factory, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`${card.color} p-3 rounded-xl text-white`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.name}</p>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Today's Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg text-white">
                    <ArrowUpRight size={20} />
                  </div>
                  <span className="font-medium text-emerald-900 text-sm">Today's Sales</span>
                </div>
                <span className="text-lg font-bold text-emerald-700">₹{stats?.todaySales.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 rounded-lg text-white">
                    <ArrowDownRight size={20} />
                  </div>
                  <span className="font-medium text-amber-900 text-sm">Today's Purchases</span>
                </div>
                <span className="text-lg font-bold text-amber-700">₹{stats?.todayPurchases.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-lg text-white">
                    <AlertTriangle size={20} />
                  </div>
                  <span className="font-medium text-red-900 text-sm">Low Stock Alerts</span>
                </div>
                <span className="text-lg font-bold text-red-700">{stats?.lowStockCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-600/20 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-indigo-100 text-sm font-medium mb-1">Total Stock Value</h3>
              <p className="text-3xl font-bold">₹{stats?.totalStockValue.toLocaleString()}</p>
              <div className="mt-4 flex items-center gap-2 text-indigo-200 text-xs">
                <TrendingUp size={14} />
                <span>Monthly Profit: ₹{stats?.monthlyProfit.toLocaleString()}</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Sales & Purchases Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Sales vs Purchases</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-slate-500">Sales</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-500">Purchases</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="purchases" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
