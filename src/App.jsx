import React, { useState, useEffect } from 'react';
import { BarChart3, Key, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import EmployeeDashboard from './components/dashboards/EmployeeDashboard';
import QADashboard from './components/dashboards/QADashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import { Button, Card } from './components/common/UIComponents';
import LoginPage from './components/auth/LoginPage'; // I should also extract LoginPage if I haven't

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
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <Card className="max-w-md p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform duration-300">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  Lead Manager Pro
                </h1>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentUser.role} NODE ACTIVE</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentUser.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{currentUser.username}</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Dark Mode"
              >
                {darkMode ? '🌞' : '🌙'}
              </button>
              <Button variant="secondary" onClick={() => setShowChangePassword(true)} className="px-3">
                <Key className="w-4 h-4" />
              </Button>
              <Button onClick={logout} className="bg-red-50 dark:bg-red-900/10 hover:bg-red-600 text-red-600 hover:text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all duration-300">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentUser.role === 'employee' && <EmployeeDashboard />}
        {currentUser.role === 'qa' && <QADashboard />}
        {currentUser.role === 'admin' && <AdminDashboard />}
      </main>

      {showChangePassword && (
        <ChangePasswordModal user={currentUser} onClose={() => setShowChangePassword(false)} />
      )}

      <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-400 text-xs font-medium">
          © 2026 Outvying Global. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

const AppContent = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // LoginPage logic is complex, should be extracted
  return currentUser ? <MainLayout /> : <LoginPage />;
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes blob {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
      }
      .animate-blob { animation: blob 7s infinite; }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
