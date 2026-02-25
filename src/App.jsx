import React, { useState, useEffect } from 'react';
import { BarChart3, Key, LogOut, Moon, Sun, Monitor, User } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import EmployeeDashboard from './components/dashboards/EmployeeDashboard';
import QADashboard from './components/dashboards/QADashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import { Button, Card, Badge } from './components/common/UIComponents';
import LoginPage from './components/auth/LoginPage';

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error('Error:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <Card className="max-w-md p-8 text-center glass">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Monitor className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 font-display">Something went wrong</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">We encountered an unexpected error. Please try reloading the page.</p>
            <Button onClick={() => window.location.reload()} className="w-full">Reload Application</Button>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-blob"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] animate-blob delay-2000"></div>

      <header className="sticky top-0 z-40 w-full glass border-b border-white/20 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight font-display">
                  LeadManager<span className="text-slate-900 dark:text-white">Pro</span>
                </h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{currentUser.role} NODE ACTIVE</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/20 dark:border-slate-700/50">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{currentUser.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2.5 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all group shadow-sm"
                  title="Toggle Theme"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                </button>

                <button
                  onClick={() => setShowChangePassword(true)}
                  className="p-2.5 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all group shadow-sm"
                  title="Security"
                >
                  <Key className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </button>

                <Button
                  onClick={logout}
                  variant="danger"
                  className="sm:px-4 px-3 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-rose-500/10"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 animate-fade-in">
        {currentUser.role === 'employee' && <EmployeeDashboard />}
        {currentUser.role === 'qa' && <QADashboard />}
        {currentUser.role === 'admin' && <AdminDashboard />}
      </main>

      {showChangePassword && (
        <ChangePasswordModal user={currentUser} onClose={() => setShowChangePassword(false)} />
      )}

      <footer className="mt-auto py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="border-t border-slate-200 dark:border-slate-800/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-slate-900 dark:text-white">LeadManagerPro</span>
            </div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest text-center">
              © 2026 Outvying Global • Built for Performance
            </p>
            <div className="flex gap-4">
              <Badge variant="neutral">v1.2.0</Badge>
              <Badge variant="success">System Online</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const AppContent = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return currentUser ? <MainLayout /> : <LoginPage />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
