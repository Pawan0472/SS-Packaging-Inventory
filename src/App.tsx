import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Factory,
  BarChart3,
  Database,
  Bell
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils/cn';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Customers = lazy(() => import('./pages/Customers'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Sales = lazy(() => import('./pages/Sales'));
const Production = lazy(() => import('./pages/Production'));
const Reports = lazy(() => import('./pages/Reports'));
const DataManagement = lazy(() => import('./pages/DataManagement'));
const Login = lazy(() => import('./pages/Login'));

const SidebarItem = ({ to, icon: Icon, label, active }: any) => (
  <Link to={to}>
    <motion.div
      whileHover={{ x: 4 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon size={20} className={cn(active ? "text-white" : "text-slate-400")} />
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
        />
      )}
    </motion.div>
  </Link>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout, isDemo } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/production', icon: Factory, label: 'Production' },
    { to: '/purchases', icon: ShoppingCart, label: 'Purchases' },
    { to: '/sales', icon: TrendingUp, label: 'Sales' },
    { to: '/suppliers', icon: Users, label: 'Suppliers' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/data', icon: Database, label: 'Data Management' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Factory size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight">SS Packaging</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ERP PRO v2.0</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 -mr-2">
          {navItems.map((item) => {
            const { to, icon, label } = item;
            return (
              <SidebarItem 
                key={to} 
                to={to}
                icon={icon}
                label={label}
                active={location.pathname === to} 
              />
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.username}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30">
          <button 
            className="lg:hidden p-2 text-slate-500"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            {isDemo && (
              <div className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Demo Mode
              </div>
            )}
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.username}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                {user?.username?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-10">
          <Suspense fallback={
            <div className="flex items-center justify-center h-[60vh]">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 p-6 flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <Factory size={20} />
                  </div>
                  <h1 className="font-bold text-slate-900">SS Packaging</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const { to, icon, label } = item;
                  return (
                    <SidebarItem 
                      key={to} 
                      to={to}
                      icon={icon}
                      label={label}
                      active={location.pathname === to} 
                    />
                  );
                })}
              </nav>
              <button 
                onClick={logout}
                className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  
  return <Layout>{children}</Layout>;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <Suspense fallback={null}>
          <Login />
        </Suspense>
      } />
      
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
      <Route path="/suppliers" element={<PrivateRoute><Suppliers /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
      <Route path="/purchases" element={<PrivateRoute><Purchases /></PrivateRoute>} />
      <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
      <Route path="/production" element={<PrivateRoute><Production /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/data" element={<PrivateRoute><DataManagement /></PrivateRoute>} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
