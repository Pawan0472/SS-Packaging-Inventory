import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { User } from '../types';
import { MODULES } from '../services/db';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isDemo: boolean;
  hasPermission: (moduleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();

  const hasPermission = (moduleName: string) => {
    if (!user) return false;
    const role = (user.role as string).toLowerCase();
    if (role === 'superadmin') return true;
    const permissions = (user as any).permissions as string[] | undefined;
    if (!permissions) return true; // Default to all if not set (legacy)
    return permissions.includes(moduleName);
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('erp_token');
      const savedUser = localStorage.getItem('erp_user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setIsDemo(savedToken === 'demo-token');
      }

      // Check Supabase session if configured
      try {
        const { supabase, isSupabaseConfigured } = await import('../lib/supabase');
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          
          const fetchUserProfile = async (session: any) => {
            if (!session) return null;
            
            // Try to fetch from public.users table
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            const role = profile?.role || (session.user.user_metadata?.role as any);
            const isInitialAdmin = session.user.email === 'pawan.kuwar.ptcgroup@gmail.com' || session.user.email === 'admin@example.com';
            
            return {
              id: session.user.id,
              username: profile?.username || session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              role: role || (isInitialAdmin ? 'superadmin' : 'staff'),
              permissions: profile?.permissions || (isInitialAdmin ? MODULES.map(m => m.id) : [])
            };
          };

          if (session) {
            const userProfile = await fetchUserProfile(session);
            if (userProfile) {
              setToken(session.access_token);
              setUser(userProfile);
              setIsDemo(false);
            }
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
              const userProfile = await fetchUserProfile(session);
              if (userProfile) {
                setToken(session.access_token);
                setUser(userProfile);
                setIsDemo(false);
              }
            } else {
              setToken(null);
              setUser(null);
              setIsDemo(false);
            }
          });
        }
      } catch (e) {
        console.error('Supabase session check failed', e);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    // Force superadmin for default admin credentials in demo mode
    if (newToken === 'demo-token' && (newUser.username === 'admin' || newUser.email === 'admin@example.com')) {
      newUser.role = 'superadmin';
      (newUser as any).permissions = MODULES.map(m => m.id);
    }

    setToken(newToken);
    setUser(newUser);
    setIsDemo(newToken === 'demo-token');
    localStorage.setItem('erp_token', newToken);
    localStorage.setItem('erp_user', JSON.stringify(newUser));
    navigate('/');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsDemo(false);
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isDemo, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
