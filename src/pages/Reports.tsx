import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'profit'>('stock');
  const [stockData, setStockData] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');

  const { token, isDemo } = useAuth();

  const fetchStockReport = async () => {
    if (isDemo) {
      setStockData([
        { id: 1, name: '500ml PET Bottle', category: 'Bottle', min_stock_level: 5000, current_stock: 12500, is_low_stock: false },
        { id: 2, name: '1L PET Preform', category: 'Preform', min_stock_level: 10000, current_stock: 4200, is_low_stock: true },
        { id: 3, name: '2L PET Bottle', category: 'Bottle', min_stock_level: 2000, current_stock: 8900, is_low_stock: false },
        { id: 4, name: '18g Preform Blue', category: 'Preform', min_stock_level: 5000, current_stock: 15000, is_low_stock: false },
        { id: 5, name: '24g Preform Clear', category: 'Preform', min_stock_level: 5000, current_stock: 2100, is_low_stock: true },
      ]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/reports/stock', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStockData(await res.json());
    } catch (error) {
      toast.error('Failed to load stock report');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfitReport = async () => {
    if (isDemo) {
      setProfitData({
        summary: {
          totalGrossProfit: 245000,
          totalTransportCost: 12500,
          totalNetProfit: 232500
        },
        items: [
          { date: '2024-03-22', product_name: '500ml PET Bottle', rate: 4.50, last_purchase_rate: 3.20, gross_profit: 6500, net_profit: 6200 },
          { date: '2024-03-23', product_name: '1L PET Preform', rate: 8.20, last_purchase_rate: 6.50, gross_profit: 12000, net_profit: 11500 },
          { date: '2024-03-24', product_name: '2L PET Bottle', rate: 12.00, last_purchase_rate: 9.80, gross_profit: 8500, net_profit: 8100 },
        ]
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const query = new URLSearchParams({ startDate, endDate }).toString();
      const res = await fetch(`/api/reports/profit-loss?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProfitData(await res.json());
    } catch (error) {
      toast.error('Failed to load profit report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stock') fetchStockReport();
    else fetchProfitReport();
  }, [activeTab, token, startDate, endDate, isDemo]);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h2>
          <p className="text-slate-500 mt-1">Deep dive into your business performance and inventory health.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('stock')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === 'stock' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Stock
            </button>
            <button
              onClick={() => setActiveTab('profit')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === 'profit' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Profit & Loss
            </button>
          </div>
          <button
            onClick={() => exportToCSV(activeTab === 'stock' ? stockData : profitData?.items || [], activeTab)}
            className="bg-white border border-slate-200 p-2.5 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            title="Export to CSV"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          {activeTab === 'profit' ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">to</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search products in stock report..."
                className="w-full pl-12 pr-6 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2">
            <Filter size={16} />
            <span>Advanced Filters</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <div className="bg-white rounded-[40px] border border-slate-200 p-32 text-center shadow-sm">
              <Loader2 className="animate-spin mx-auto text-indigo-600" size={48} />
              <h3 className="mt-6 text-xl font-bold text-slate-900">Generating Report</h3>
              <p className="text-slate-500 mt-2 font-medium">Crunching the latest data for you...</p>
            </div>
          ) : activeTab === 'stock' ? (
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Min Stock</th>
                      <th>Current Stock</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockData.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((p) => (
                      <tr key={p.id} className="group">
                        <td>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                              p.is_low_stock ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                            )}>
                              <PieChart size={20} />
                            </div>
                            <span className="font-bold text-slate-900">{p.name}</span>
                          </div>
                        </td>
                        <td className="text-slate-500 font-bold text-xs uppercase tracking-widest">{p.category}</td>
                        <td className="text-slate-600 font-medium data-value">{p.min_stock_level.toLocaleString()}</td>
                        <td className="font-bold text-slate-900 data-value">{p.current_stock.toLocaleString()}</td>
                        <td className="text-right">
                          {p.is_low_stock ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider border border-rose-100">
                              <AlertCircle size={12} />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                              Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Profit Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
                      <TrendingUp size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Gross Profit</p>
                    <p className="text-4xl font-bold text-slate-900 data-value">₹{profitData?.summary.totalGrossProfit.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                      <ArrowUpRight size={14} />
                      <span>Before transport</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-6">
                      <TrendingDown size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Transport Costs</p>
                    <p className="text-4xl font-bold text-slate-900 data-value">₹{profitData?.summary.totalTransportCost.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-xs">
                      <ArrowDownRight size={14} />
                      <span>Logistics expense</span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-600 p-8 rounded-[40px] shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-6">
                      <Activity size={24} />
                    </div>
                    <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest mb-2">Net Profit</p>
                    <p className="text-4xl font-bold text-white data-value">₹{profitData?.summary.totalNetProfit.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2 text-indigo-100 font-bold text-xs">
                      <TrendingUp size={14} />
                      <span>Final earnings</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Table */}
              <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <h3 className="text-lg font-bold text-slate-900">Transaction Breakdown</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profitable</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Sale Rate</th>
                        <th>Purchase Rate</th>
                        <th>Gross</th>
                        <th className="text-right">Net Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitData?.items.map((item: any, idx: number) => (
                        <tr key={idx} className="group">
                          <td className="text-slate-500 font-medium text-sm">{format(new Date(item.date), 'dd MMM')}</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                <FileText size={16} />
                              </div>
                              <span className="font-bold text-slate-900">{item.product_name || 'Product'}</span>
                            </div>
                          </td>
                          <td className="text-slate-600 font-bold data-value">₹{item.rate}</td>
                          <td className="text-slate-400 font-medium data-value">₹{item.last_purchase_rate}</td>
                          <td className="text-emerald-600 font-bold data-value">₹{item.gross_profit.toLocaleString()}</td>
                          <td className="text-right">
                            <span className="px-4 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm data-value">
                              ₹{item.net_profit.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Reports;
