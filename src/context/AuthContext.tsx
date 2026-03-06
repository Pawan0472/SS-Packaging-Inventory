import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { User } from '../types';

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
    if (user.role === 'superadmin') return true;
    if (!user.permissions) return true; // Default to all if not set (legacy)
    return user.permissions.includes(moduleName);
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
          if (session) {
            setToken(session.access_token);
            setUser({
              id: session.user.id,
              username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              role: (session.user.user_metadata?.role as any) || 'staff'
            });
            setIsDemo(false);
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
              setToken(session.access_token);
              setUser({
                id: session.user.id,
                username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                role: (session.user.user_metadata?.role as any) || 'staff'
              });
              setIsDemo(false);
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
