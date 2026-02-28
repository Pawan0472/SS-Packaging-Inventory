import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string | number;
  username: string;
  role: 'admin' | 'manager' | 'staff';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('erp_token');
    const savedUser = localStorage.getItem('erp_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsDemo(savedToken === 'demo-token');
    }
    setIsLoading(false);
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
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isDemo }}>
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
