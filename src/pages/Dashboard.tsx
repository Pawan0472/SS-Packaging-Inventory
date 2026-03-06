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
  Factory,
  Share2,
  Download,
  Bell
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
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const StatCard = ({ label, value, trend, trendValue, icon: Icon, color }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bento-card flex flex-col justify-between dark:bg-slate-900 border-slate-200 dark:border-slate-800"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-3 rounded-xl shadow-lg", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          trend === 'up' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
        )}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="label-caps dark:text-slate-500">{label}</p>
      <h3 className="stat-value mt-1 dark:text-white">{value}</h3>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { isDemo } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sData, cData, sales, purchases, production, products] = await Promise.all([
          db.dashboard.getStats(),
          db.dashboard.getCharts(),
          db.sales.getAll(),
          db.purchases.getAll(),
          db.production.getAll(),
          db.products.getAll()
        ]);
        
        setStats(sData);
        setCharts(cData);

        // Process Recent Activity
        const activity = [
          ...sales.map((s: any) => ({ ...s, type: 'sale', title: `Invoice #${s.invoice_number}`, subtitle: s.customer_name, amount: `+₹${s.total_amount.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' })),
          ...purchases.map((p: any) => ({ ...p, type: 'purchase', title: `PO #${p.invoice_number}`, subtitle: p.supplier_name, amount: `-₹${p.total_amount.toLocaleString()}`, icon: ShoppingCart, color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' })),
          ...production.map((pr: any) => ({ ...pr, type: 'production', title: `Batch #${pr.id}`, subtitle: pr.bottle_name, amount: `${pr.quantity.toLocaleString()} units`, icon: Factory, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' }))
        ].sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime())
         .slice(0, 5);
        
        setRecentActivity(activity);

        // Process Inventory Alerts
        const alerts = products
          .filter((p: any) => p.stock <= p.min_stock_level)
          .map((p: any) => ({
            product: p.name,
            status: p.stock === 0 ? 'Critical' : 'Low Stock',
            stock: p.stock.toLocaleString(),
            min: p.min_stock_level.toLocaleString(),
            color: p.stock === 0 ? 'bg-rose-500 dark:bg-rose-400' : 'bg-amber-500 dark:bg-amber-400'
          }))
          .slice(0, 5);
        
        setInventoryAlerts(alerts);

      } catch (error) {
        console.error('Failed to load dashboard data', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isDemo]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SS Packaging ERP Report',
          text: 'Check out the latest performance metrics for SS Packaging.',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Report link copied to clipboard');
    }
  };

  const handleExport = () => {
    if (!stats) return;
    
    const csvContent = [
      ['Metric', 'Value', 'Trend'],
      ['Total Sales', stats.totalSales, stats.salesTrendVal],
      ['Total Purchases', stats.totalPurchases, stats.purchaseTrendVal],
      ['Production Output', stats.totalProduction, stats.productionTrendVal],
      ['Active Customers', stats.activeCustomers, stats.customerTrendVal],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `SS_Packaging_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported as CSV');
  };

  if (loading || !stats || !charts) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time performance metrics for SS Packaging.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <img src={`https://picsum.photos/seed/${i+10}/32/32`} alt="user" referrerPolicy="no-referrer" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
              +12
            </div>
          </div>
          <button 
            onClick={handleShare}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Share2 size={16} />
            <span>Share Report</span>
          </button>
          <button 
            onClick={handleExport}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Download size={16} />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
          label="Production" 
          value={stats.totalProduction} 
          trend={stats.productionTrend} 
          trendValue={stats.productionTrendVal}
          icon={Box}
          color="bg-emerald-600"
        />
        <StatCard 
          label="Customers" 
          value={stats.activeCustomers} 
          trend={stats.customerTrend} 
          trendValue={stats.customerTrendVal}
          icon={Users}
          color="bg-amber-600"
        />
        <StatCard 
          label="New Leads" 
          value={stats.totalLeads} 
          trend={stats.leadsTrend} 
          trendValue={stats.leadsTrendVal}
          icon={Bell}
          color="bg-rose-600"
        />
        <StatCard 
          label="Pipeline" 
          value={stats.pipelineValue} 
          trend="up" 
          trendValue="+5%"
          icon={TrendingUp}
          color="bg-sky-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bento-card dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Revenue vs Expenditure</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium uppercase tracking-wider">Last 7 Months Performance</p>
            </div>
            <select className="bg-slate-50 dark:bg-slate-800 border-none text-xs font-bold text-slate-500 dark:text-slate-400 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
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
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                    borderRadius: '12px', 
                    border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#6366f1' }}
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
        <div className="bento-card dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 dark:text-white">Top Products</h3>
            <Activity size={18} className="text-slate-400 dark:text-slate-600" />
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
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
                    borderRadius: '12px', 
                    border: theme === 'dark' ? '1px solid #1e293b' : 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }}
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
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{item.value} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bento-card dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-center py-8 text-slate-400 dark:text-slate-600 font-medium">No recent activity</p>
            ) : (
              recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.color)}>
                      <item.icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-bold", item.type === 'sale' ? "text-emerald-600 dark:text-emerald-400" : item.type === 'purchase' ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white")}>
                      {item.amount}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{item.date ? format(new Date(item.date), 'dd MMM') : 'Just now'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bento-card dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Inventory Alerts</h3>
            <AlertCircle size={18} className="text-rose-500 dark:text-rose-400" />
          </div>
          <div className="space-y-4">
            {inventoryAlerts.length === 0 ? (
              <p className="text-center py-8 text-slate-400 dark:text-slate-600 font-medium">All stock levels are healthy</p>
            ) : (
              inventoryAlerts.map((item, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{item.product}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider", item.color)}>
                      {item.status}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (parseInt(item.stock.replace(',','')) / Math.max(1, parseInt(item.min.replace(',','')))) * 100)}%` }}
                      className={cn("h-full", item.color)}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stock: {item.stock}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Min: {item.min}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
