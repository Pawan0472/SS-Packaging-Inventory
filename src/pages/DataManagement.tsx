import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload as UploadIcon, 
  FileSpreadsheet, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

const DataManagement: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { token } = useAuth();

  const handleExport = async (type: string) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Data Management</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Export Data</h3>
              <p className="text-sm text-slate-500">Download your data in CSV format</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleExport('products')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-slate-400 group-hover:text-indigo-600" size={20} />
                <span className="font-medium text-slate-700 dark:text-slate-300">Products List</span>
              </div>
              <Download size={18} className="text-slate-400" />
            </button>

            <button
              onClick={() => handleExport('suppliers')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-slate-400 group-hover:text-indigo-600" size={20} />
                <span className="font-medium text-slate-700 dark:text-slate-300">Suppliers List</span>
              </div>
              <Download size={18} className="text-slate-400" />
            </button>

            <button
              onClick={() => handleExport('customers')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-slate-400 group-hover:text-indigo-600" size={20} />
                <span className="font-medium text-slate-700 dark:text-slate-300">Customers List</span>
              </div>
              <Download size={18} className="text-slate-400" />
            </button>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/data/backup', {
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `erp_backup_${new Date().toISOString().split('T')[0]}.db`;
                    a.click();
                  } catch (error) {
                    toast.error('Backup failed');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all"
              >
                <Database size={18} />
                <span className="text-sm font-medium">Download Full Database Backup (.db)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
              <UploadIcon size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Import from Tally</h3>
              <p className="text-sm text-slate-500">Upload CSV files exported from Tally</p>
            </div>
          </div>

          <form onSubmit={handleImport} className="space-y-4">
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
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all mb-4"
            >
              <Download size={18} />
              <span className="text-sm font-medium">Download Import Template</span>
            </button>

            <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                  <FileSpreadsheet className="text-slate-400" size={32} />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {selectedFile ? selectedFile.name : 'Click to select CSV file'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Supports Tally standard CSV exports</p>
              </label>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <div className="flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  <p className="font-bold mb-1">Important Note:</p>
                  <p>Ensure your CSV has headers like "Item Name", "Category", "Weight", and "Min Stock". The system will automatically map these to the ERP fields.</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isImporting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
            >
              {isImporting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>Start Import</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
