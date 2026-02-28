import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Box,
  Truck,
  AlertCircle,
  Factory
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const StatCard = ({ label, value, trend, trendValue, icon: Icon, color }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bento-card flex flex-col justify-between"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="label-caps">{label}</p>
      <h3 className="stat-value mt-1">{value}</h3>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { isDemo } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from Supabase/API
    // For now, providing beautiful mock data for immediate "wow" factor
    setTimeout(() => {
      setStats({
        totalSales: '₹12,45,600',
        totalPurchases: '₹8,12,300',
        totalProduction: '45,200',
        activeCustomers: '124',
        salesTrend: 'up',
        salesTrendVal: '+12.5%',
        purchaseTrend: 'down',
        purchaseTrendVal: '-4.2%',
        productionTrend: 'up',
        productionTrendVal: '+8.1%',
        customerTrend: 'up',
        customerTrendVal: '+2.4%',
      });

      setCharts({
        salesData: [
          { name: 'Jan', sales: 4000, purchases: 2400 },
          { name: 'Feb', sales: 3000, purchases: 1398 },
          { name: 'Mar', sales: 2000, purchases: 9800 },
          { name: 'Apr', sales: 2780, purchases: 3908 },
          { name: 'May', sales: 1890, purchases: 4800 },
          { name: 'Jun', sales: 2390, purchases: 3800 },
          { name: 'Jul', sales: 3490, purchases: 4300 },
        ],
        topProducts: [
          { name: '500ml Bottle', value: 450, color: '#6366f1' },
          { name: '1L Preform', value: 320, color: '#8b5cf6' },
          { name: '2L Bottle', value: 280, color: '#ec4899' },
          { name: 'Cap 28mm', value: 210, color: '#f43f5e' },
        ]
      });
      setLoading(false);
    }, 800);
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h2>
          <p className="text-slate-500 mt-1">Real-time performance metrics for SS Packaging.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                <img src={`https://picsum.photos/seed/${i+10}/32/32`} alt="user" referrerPolicy="no-referrer" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
              +12
            </div>
          </div>
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
            Share Report
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Sales" 
          value={stats.totalSales} 
          trend={stats.salesTrend} 
          trendValue={stats.salesTrendVal}
          icon={TrendingUp}
          color="bg-indigo-600"
        />
        <StatCard 
          label="Total Purchases" 
          value={stats.totalPurchases} 
          trend={stats.purchaseTrend} 
          trendValue={stats.purchaseTrendVal}
          icon={ShoppingCart}
          color="bg-violet-600"
        />
        <StatCard 
          label="Production Output" 
          value={stats.totalProduction} 
          trend={stats.productionTrend} 
          trendValue={stats.productionTrendVal}
          icon={Box}
          color="bg-emerald-600"
        />
        <StatCard 
          label="Active Customers" 
          value={stats.activeCustomers} 
          trend={stats.customerTrend} 
          trendValue={stats.customerTrendVal}
          icon={Users}
          color="bg-amber-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bento-card">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-900">Revenue vs Expenditure</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">Last 7 Months Performance</p>
            </div>
            <select className="bg-slate-50 border-none text-xs font-bold text-slate-500 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
              <option>Monthly</option>
              <option>Weekly</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="purchases" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPurchases)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="bento-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900">Top Products</h3>
            <Activity size={18} className="text-slate-400" />
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topProducts} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                  {charts.topProducts.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {charts.topProducts.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{item.value} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bento-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Recent Transactions</h3>
            <button className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { type: 'sale', title: 'Invoice #INV-2024-001', subtitle: 'Reliance Industries', amount: '+₹45,000', time: '2 mins ago', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
              { type: 'purchase', title: 'PO #PUR-2024-082', subtitle: 'Global Polymers', amount: '-₹1,20,000', time: '1 hour ago', icon: ShoppingCart, color: 'text-rose-600 bg-rose-50' },
              { type: 'production', title: 'Batch #PRD-991', subtitle: '1L Bottle Production', amount: '2,500 units', time: '3 hours ago', icon: Factory, color: 'text-indigo-600 bg-indigo-50' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.color)}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">{item.title}</p>
                    <p className="text-xs text-slate-400 font-medium">{item.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-bold", item.type === 'sale' ? "text-emerald-600" : item.type === 'purchase' ? "text-rose-600" : "text-slate-900")}>
                    {item.amount}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Inventory Alerts</h3>
            <AlertCircle size={18} className="text-rose-500" />
          </div>
          <div className="space-y-4">
            {[
              { product: '28mm Blue Caps', status: 'Critical', stock: '1,200', min: '5,000', color: 'bg-rose-500' },
              { product: '1L PET Preforms', status: 'Low Stock', stock: '8,500', min: '10,000', color: 'bg-amber-500' },
              { product: '500ml Clear Bottles', status: 'Reorder', stock: '4,200', min: '5,000', color: 'bg-amber-500' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900">{item.product}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider", item.color)}>
                    {item.status}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(parseInt(item.stock.replace(',','')) / parseInt(item.min.replace(',',''))) * 100}%` }}
                    className={cn("h-full", item.color)}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock: {item.stock}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Min: {item.min}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
