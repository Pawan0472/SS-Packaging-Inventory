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
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'profit'>('stock');
  const [stockData, setStockData] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');

  const { token } = useAuth();

  const fetchStockReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reports/stock', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStockData(await res.json());
    } catch (error) {
      toast.error('Failed to load stock report');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfitReport = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({ startDate, endDate }).toString();
      const res = await fetch(`/api/reports/profit-loss?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProfitData(await res.json());
    } catch (error) {
      toast.error('Failed to load profit report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stock') fetchStockReport();
    else fetchProfitReport();
  }, [activeTab, token, startDate, endDate]);

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
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('stock')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-semibold transition-all",
            activeTab === 'stock' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          )}
        >
          Stock Report
        </button>
        <button
          onClick={() => setActiveTab('profit')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-semibold transition-all",
            activeTab === 'profit' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          )}
        >
          Profit & Loss
        </button>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {activeTab === 'profit' && (
            <>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" />
                <input
                  type="date"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <span className="text-slate-400">to</span>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" />
                <input
                  type="date"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}
          {activeTab === 'stock' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>
        <button
          onClick={() => exportToCSV(activeTab === 'stock' ? stockData : profitData?.items || [], activeTab)}
          className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200 transition-all text-sm font-semibold"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center">
            <Loader2 className="animate-spin mx-auto text-indigo-600" size={40} />
            <p className="mt-4 text-slate-500">Generating report...</p>
          </div>
        ) : activeTab === 'stock' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Min Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockData.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600">{p.category}</td>
                    <td className="px-6 py-4 text-slate-600">{p.min_stock_level}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{p.current_stock}</td>
                    <td className="px-6 py-4">
                      {p.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                          <AlertCircle size={12} />
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          HEALTHY
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profit Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Gross Profit</p>
                <p className="text-3xl font-bold text-emerald-900">₹{profitData?.summary.totalGrossProfit.toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-1 text-emerald-600">
                  <TrendingUp size={16} />
                  <span className="text-xs font-medium">Before transport costs</span>
                </div>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Transport Costs</p>
                <p className="text-3xl font-bold text-amber-900">₹{profitData?.summary.totalTransportCost.toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-1 text-amber-600">
                  <TrendingDown size={16} />
                  <span className="text-xs font-medium">Proportional distribution</span>
                </div>
              </div>
              <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
                <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Net Profit</p>
                <p className="text-3xl font-bold">₹{profitData?.summary.totalNetProfit.toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-1 text-indigo-100">
                  <TrendingUp size={16} />
                  <span className="text-xs font-medium">Final earnings</span>
                </div>
              </div>
            </div>

            {/* Profit Table */}
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sale Rate</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Purchase</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Profit</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profitData?.items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-600 text-sm">{format(new Date(item.date), 'dd MMM')}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{item.product_name || 'Product'}</td>
                      <td className="px-6 py-4 text-slate-600">₹{item.rate}</td>
                      <td className="px-6 py-4 text-slate-600">₹{item.last_purchase_rate}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">₹{item.gross_profit.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-indigo-600">₹{item.net_profit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
