import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { LogIn, UserPlus, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'staff']).optional(),
});

type FormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: 'admin' }
  });

  useEffect(() => {
    fetch('/api/auth/setup-status')
      .then(res => res.json())
      .then(data => setIsInitialized(data.initialized))
      .catch(() => toast.error('Failed to connect to server'));
  }, []);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const endpoint = isInitialized ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Authentication failed');
      }

      if (isInitialized) {
        login(result.token, result.user);
        toast.success('Welcome back!');
      } else {
        toast.success('Admin account created! Please login.');
        setIsInitialized(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialized === null) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="p-8 bg-indigo-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            {isInitialized ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
          <h1 className="text-2xl font-bold">SS Packaging ERP</h1>
          <p className="text-indigo-100 mt-2">
            {isInitialized ? 'Sign in to your account' : 'System Setup: Create Admin Account'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              {...register('username')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Enter your username"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {!isInitialized && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                {...register('role')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isInitialized ? <LogIn size={20} /> : <ShieldCheck size={20} />}
                <span>{isInitialized ? 'Sign In' : 'Complete Setup'}</span>
              </>
            )}
          </button>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
          &copy; 2024 SS Packaging. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
