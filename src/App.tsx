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
  History,
  Factory,
  BarChart3,
  Database,
  Bell
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils/cn';
import { seedDemoData, setDemoMode } from './services/db';

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
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Login = lazy(() => import('./pages/Login'));

// CRM Pages
const Leads = lazy(() => import('./pages/Leads'));
const Opportunities = lazy(() => import('./pages/Opportunities'));
const Tasks = lazy(() => import('./pages/Tasks'));

// Inventory Pages
const StockAdjustment = lazy(() => import('./pages/StockAdjustment'));

const SidebarItem = ({ to, icon: Icon, label, active }: any) => (
  <Link to={to}>
    <motion.div
      whileHover={{ x: 4 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
      )}
    >
      <Icon size={20} className={cn(active ? "text-white" : "text-slate-400 dark:text-slate-500")} />
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
  const { user, logout, isDemo, hasPermission } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navSections = [
    {
      title: 'General',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
      ]
    },
    {
      title: 'Inventory & Production',
      items: [
        { to: '/products', icon: Package, label: 'Products', id: 'products' },
        { to: '/stock-adjustment', icon: Database, label: 'Stock Adjustment', id: 'stock-adjustment' },
        { to: '/production', icon: Factory, label: 'Production', id: 'production' },
        { to: '/purchases', icon: ShoppingCart, label: 'Purchases', id: 'purchases' },
        { to: '/sales', icon: TrendingUp, label: 'Sales', id: 'sales' },
      ]
    },
    {
      title: 'CRM',
      items: [
        { to: '/leads', icon: Bell, label: 'Leads', id: 'crm' },
        { to: '/opportunities', icon: TrendingUp, label: 'Opportunities', id: 'crm' },
        { to: '/tasks', icon: History, label: 'Tasks', id: 'crm' },
        { to: '/customers', icon: Users, label: 'Customers', id: 'customers' },
      ]
    },
    {
      title: 'Partners',
      items: [
        { to: '/suppliers', icon: Users, label: 'Suppliers', id: 'suppliers' },
      ]
    },
    {
      title: 'System',
      items: [
        { to: '/reports', icon: BarChart3, label: 'Reports', id: 'reports' },
        { to: '/audit-logs', icon: History, label: 'Audit Logs', id: 'audit-logs' },
        { to: '/data', icon: Database, label: 'Data Management', id: 'superadmin' },
        { to: '/users', icon: Users, label: 'User Management', id: 'superadmin' },
      ]
    }
  ].map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.id === 'superadmin') return user?.role === 'superadmin';
      return hasPermission(item.id);
    })
  })).filter(section => section.items.length > 0);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 sticky top-0 h-screen transition-colors duration-300">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Factory size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white tracking-tight">SS Packaging</h1>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">ERP PRO v2.0</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto pr-2 -mr-2">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem 
                    key={item.to} 
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    active={location.pathname === item.to} 
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 font-bold">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.username}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
          <button 
            className="lg:hidden p-2 text-slate-500 dark:text-slate-400"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            {isDemo && (
              <div className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Demo Mode
              </div>
            )}
            <ThemeToggle />
            <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.username}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-500 font-bold border border-indigo-100 dark:border-indigo-500/20">
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
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 z-50 p-6 flex flex-col lg:hidden transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <Factory size={20} />
                  </div>
                  <h1 className="font-bold text-slate-900 dark:text-white">SS Packaging</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 dark:text-slate-500">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 space-y-6">
                {navSections.map((section) => (
                  <div key={section.title}>
                    <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">{section.title}</p>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <SidebarItem 
                          key={item.to} 
                          to={item.to}
                          icon={item.icon}
                          label={item.label}
                          active={location.pathname === item.to} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
              <button 
                onClick={logout}
                className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
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

const PrivateRoute = ({ children, moduleId }: { children: React.ReactNode, moduleId?: string }) => {
  const { user, isLoading, hasPermission } = useAuth();
  
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  
  if (moduleId && !hasPermission(moduleId)) {
    return <Navigate to="/" />;
  }
  
  return <Layout>{children}</Layout>;
};

// Seed demo data on load
seedDemoData();

const App = () => {
  const { isDemo } = useAuth();

  React.useEffect(() => {
    setDemoMode(isDemo);
  }, [isDemo]);

  return (
    <Routes>
      <Route path="/login" element={
        <Suspense fallback={null}>
          <Login />
        </Suspense>
      } />
      
      <Route path="/" element={<PrivateRoute moduleId="dashboard"><Dashboard /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute moduleId="products"><Products /></PrivateRoute>} />
      <Route path="/stock-adjustment" element={<PrivateRoute moduleId="stock-adjustment"><StockAdjustment /></PrivateRoute>} />
      <Route path="/suppliers" element={<PrivateRoute moduleId="suppliers"><Suppliers /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute moduleId="customers"><Customers /></PrivateRoute>} />
      <Route path="/purchases" element={<PrivateRoute moduleId="purchases"><Purchases /></PrivateRoute>} />
      <Route path="/sales" element={<PrivateRoute moduleId="sales"><Sales /></PrivateRoute>} />
      <Route path="/production" element={<PrivateRoute moduleId="production"><Production /></PrivateRoute>} />
      
      {/* CRM Routes */}
      <Route path="/leads" element={<PrivateRoute moduleId="crm"><Leads /></PrivateRoute>} />
      <Route path="/opportunities" element={<PrivateRoute moduleId="crm"><Opportunities /></PrivateRoute>} />
      <Route path="/tasks" element={<PrivateRoute moduleId="crm"><Tasks /></PrivateRoute>} />
      
      <Route path="/reports" element={<PrivateRoute moduleId="reports"><Reports /></PrivateRoute>} />
      <Route path="/audit-logs" element={<PrivateRoute moduleId="audit-logs"><AuditLogs /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute moduleId="superadmin"><UserManagement /></PrivateRoute>} />
      <Route path="/data" element={<PrivateRoute moduleId="superadmin"><DataManagement /></PrivateRoute>} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
