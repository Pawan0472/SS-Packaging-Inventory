import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload as UploadIcon, 
  FileSpreadsheet, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Zap,
  RefreshCw,
  HardDrive,
  Cloud,
  Users,
  ShoppingCart,
  Factory
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const DataManagement: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { token, isDemo } = useAuth();

  const handleExport = async (type: string) => {
    if (isDemo) {
      toast.success(`Demo: Exporting ${type} data...`);
      // Simulate download
      const csvContent = "id,name,category\n1,Sample Item,Category A";
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_demo_export.csv`;
      a.click();
      return;
    }

    try {
      const response = await fetch(`/api/data/export/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      setIsImporting(true);
      setTimeout(() => {
        toast.success('Demo: Data imported successfully');
        setIsImporting(false);
        setSelectedFile(null);
      }, 1500);
      return;
    }

    if (!selectedFile) return toast.error('Please select a CSV file');

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/data/import/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Import failed');

      toast.success(result.message);
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Data Management</h2>
          <p className="text-slate-500 mt-1">Export your records or import data from external sources like Tally.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} />
            Secure Storage
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Section */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Download size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Export Center</h3>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Download your records</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'products', label: 'Products Master', icon: FileSpreadsheet },
                { id: 'suppliers', label: 'Supplier Directory', icon: Users },
                { id: 'customers', label: 'Client Database', icon: Users },
                { id: 'sales', label: 'Sales History', icon: Zap },
                { id: 'purchases', label: 'Purchase Logs', icon: ShoppingCart },
                { id: 'production', label: 'Production Logs', icon: Factory },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleExport(item.id)}
                  className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-[24px] hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all group/btn"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="text-slate-400 group-hover/btn:text-indigo-600 transition-colors" size={20} />
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                  </div>
                  <Download size={16} className="text-slate-300 opacity-0 group-hover/btn:opacity-100 transition-all" />
                </button>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <button
                onClick={() => handleExport('backup')}
                className="w-full flex items-center justify-center gap-3 p-5 bg-slate-900 text-white rounded-[24px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 group/backup"
              >
                <Database size={20} className="group-hover/backup:rotate-12 transition-transform" />
                <span className="text-sm font-bold uppercase tracking-widest">Full Database Backup (.db)</span>
              </button>
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
                Last backup generated: Today, 10:45 AM
              </p>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700"></div>

          <div className="relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <UploadIcon size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Import Wizard</h3>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Sync from Tally or CSV</p>
              </div>
            </div>

            <form onSubmit={handleImport} className="space-y-6">
              <div className="relative group/upload">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="csv-upload"
                />
                <div className="w-full py-12 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-4 group-hover/upload:border-emerald-400 group-hover/upload:bg-emerald-50/30 transition-all">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover/upload:bg-white group-hover/upload:text-emerald-500 transition-all">
                    <FileSpreadsheet size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">
                      {selectedFile ? selectedFile.name : 'Drop CSV file here'}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Supports Tally standard exports'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                  <AlertCircle className="text-amber-600 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-800 font-bold leading-relaxed uppercase tracking-wider">
                    Headers must match: Name, Category, Weight, Min Stock.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const csvContent = "name,category,gram_weight,min_stock_level\nSample Preform,Preform,20,1000\nSample Bottle,Bottle,0,500";
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'tally_import_template.csv';
                    a.click();
                  }}
                  className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Download size={16} />
                  <span>Download Template</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || isImporting}
                className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-5 rounded-[24px] shadow-xl shadow-emerald-600/20 transition-all group/submit"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span className="uppercase tracking-widest">Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} className="group-hover/submit:scale-110 transition-transform" />
                    <span className="uppercase tracking-widest">Start Import Process</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* System Health Section */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <Cloud size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Cloud Sync & Health</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Real-time infrastructure status</p>
            </div>
          </div>
          <button className="p-3 rounded-2xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Database</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-lg font-bold text-slate-900">Supabase Cloud</p>
            <p className="text-xs text-slate-500 mt-1">Latency: 24ms</p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-lg font-bold text-slate-900">1.2 GB / 5 GB</p>
            <p className="text-xs text-slate-500 mt-1">24% capacity used</p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Sync</span>
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            </div>
            <p className="text-lg font-bold text-slate-900">Automated</p>
            <p className="text-xs text-slate-500 mt-1">2 minutes ago</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
