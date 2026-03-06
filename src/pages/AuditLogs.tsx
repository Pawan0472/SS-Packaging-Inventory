import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User as UserIcon,
  Activity,
  Database
} from 'lucide-react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isDemo } = useAuth();

  const fetchLogs = async () => {
    if (isDemo) {
      setLogs([
        { id: 1, user_email: 'admin@example.com', action: 'CREATE', module: 'products', record_id: '101', timestamp: new Date().toISOString() },
        { id: 2, user_email: 'manager@example.com', action: 'UPDATE', module: 'suppliers', record_id: '45', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, user_email: 'admin@example.com', action: 'DELETE', module: 'sales', record_id: '2001', timestamp: new Date(Date.now() - 86400000).toISOString() },
      ]);
      setLoading(false);
      return;
    }

    try {
      const data = await db.auditLogs.getAll();
      setLogs(data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [isDemo]);

  const filteredLogs = logs.filter(log => 
    log.user_email.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.module.toLowerCase().includes(search.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10';
      case 'UPDATE': return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10';
      case 'DELETE': return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10';
      default: return 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Audit Logs</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track all system activities and data modifications.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search by user, action or module..." 
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Record ID</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="py-8 px-6 bg-slate-50/20 dark:bg-slate-800/20"></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
                      <History size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No logs found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">System activity will appear here once actions are performed.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="group">
                    <td>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-sm font-medium">{format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm:ss')}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600">
                          <UserIcon size={14} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{log.user_email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        getActionColor(log.action)
                      )}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-slate-400 dark:text-slate-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{log.module}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Database size={14} className="text-slate-400 dark:text-slate-500" />
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">#{log.record_id}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Showing {filteredLogs.length} logs</p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50">
              <ChevronLeft size={18} />
            </button>
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
