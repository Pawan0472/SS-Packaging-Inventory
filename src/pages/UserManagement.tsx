import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Shield, 
  Mail, 
  User as UserIcon,
  X,
  Check,
  Lock,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { db, MODULES } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { User, UserRole } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
    permissions: MODULES.map(m => m.id)
  });

  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await db.users.getAll();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      return toast.error('Please fill all required fields');
    }

    try {
      await db.users.create(formData);
      toast.success('User created successfully');
      setIsModalOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'staff',
        permissions: MODULES.map(m => m.id)
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const togglePermission = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(moduleId)
        ? prev.permissions.filter(id => id !== moduleId)
        : [...prev.permissions, moduleId]
    }));
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) return toast.error('You cannot delete yourself');
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await db.users.delete(id);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">User Management</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage system access and module permissions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Permissions</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="py-8 px-6 bg-slate-50/20 dark:bg-slate-800/20"></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
                      <Users size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No users found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Create your first team member to see them here.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="group">
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.username}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        u.role === 'superadmin' ? "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" :
                        u.role === 'admin' ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" :
                        u.role === 'manager' ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
                        "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {u.role === 'superadmin' ? (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Access</span>
                        ) : (
                          u.permissions?.slice(0, 3).map(p => (
                            <span key={p} className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                              {p}
                            </span>
                          ))
                        )}
                        {u.role !== 'superadmin' && (u.permissions?.length || 0) > 3 && (
                          <span className="text-[9px] font-bold text-slate-400">+{u.permissions!.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-slate-400 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New User Modal */}
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
              className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Create New User</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">Configure system access</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                      <input
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                      <input
                        required
                        type="email"
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-12 pr-12 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps ml-1">System Role</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                      <select
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                      >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                {formData.role !== 'superadmin' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Module Permissions</h4>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, permissions: MODULES.map(m => m.id)})}
                          className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                          Select All
                        </button>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, permissions: []})}
                          className="text-[10px] font-bold text-rose-600 uppercase tracking-widest hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {MODULES.map(module => (
                        <button
                          key={module.id}
                          type="button"
                          onClick={() => togglePermission(module.id)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                            formData.permissions.includes(module.id)
                              ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                          )}
                        >
                          <span className="text-xs font-bold">{module.name}</span>
                          {formData.permissions.includes(module.id) ? (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                              <Check size={12} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-200 dark:border-slate-700" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.role === 'superadmin' && (
                  <div className="p-6 bg-purple-50 dark:bg-purple-500/5 rounded-2xl border border-purple-100 dark:border-purple-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Shield size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-purple-900 dark:text-purple-300">Super Admin Privileges</p>
                      <p className="text-xs text-purple-700 dark:text-purple-400 opacity-80 mt-0.5">Super admins have full access to all modules and system settings.</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-4 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
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
                    Create User
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

export default UserManagement;
