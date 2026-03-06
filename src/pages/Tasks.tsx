import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  MoreVertical,
  Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { toast } from 'react-hot-toast';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';

const Tasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isDemo } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Pending',
    due_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await db.tasks.getAll();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.tasks.create(formData, user?.email || 'system');
      toast.success('Task created successfully');
      setIsModalOpen(false);
      setFormData({ 
        title: '', 
        description: '', 
        priority: 'Medium', 
        status: 'Pending', 
        due_date: new Date().toISOString().split('T')[0] 
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to save task');
    }
  };

  const handleToggleStatus = async (task: any) => {
    try {
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await db.tasks.update(task.id, { status: newStatus }, user?.email || 'system');
      toast.success(`Task marked as ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10';
      case 'Medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
      case 'Low': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Tasks</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your daily activities and follow-ups.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>Add Task</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
          ))
        ) : filteredTasks.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">All tasks completed!</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">You're all caught up with your activities.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all flex items-center gap-6 group",
                task.status === 'Completed' 
                  ? "border-slate-100 dark:border-slate-800 opacity-60" 
                  : "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
              )}
            >
              <button 
                onClick={() => handleToggleStatus(task)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                  task.status === 'Completed'
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-200 dark:border-slate-700 text-transparent hover:border-emerald-500"
                )}
              >
                <CheckCircle2 size={18} />
              </button>

              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "text-lg font-bold text-slate-900 dark:text-white transition-all",
                  task.status === 'Completed' && "line-through"
                )}>
                  {task.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{task.description}</p>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="hidden md:flex items-center gap-2 text-slate-400">
                  <Calendar size={14} />
                  <span className="text-xs font-medium">{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  getPriorityColor(task.priority)
                )}>
                  {task.priority}
                </span>
                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">New Task</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">Activity details</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="label-caps ml-1">Task Title</label>
                  <input 
                    required 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g. Follow up with Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-caps ml-1">Description</label>
                  <textarea 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white min-h-[100px] resize-none" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Details about the task..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Priority</label>
                    <select 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Due Date</label>
                    <input 
                      type="date"
                      required 
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" 
                      value={formData.due_date} 
                      onChange={e => setFormData({...formData, due_date: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;
