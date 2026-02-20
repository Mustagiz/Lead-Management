import React, { useState, useEffect, createContext, useContext } from 'react';
import { Upload, Download, Users, BarChart3, Shield, LogOut, Filter, Check, X, Edit, Trash2, RefreshCw, Clock, CheckCircle, XCircle, Search, Plus, Eye, EyeOff, ChevronDown, Coffee, Key, AlertTriangle, CheckCircle2, AlertCircle, Target, Building2, Globe, ClipboardCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from './supabaseClient';

import { createClient } from '@supabase/supabase-js';

// Context for Authentication
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const getProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('getProfile crash:', err);
    return null;
  }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-200">
            <h2 className="text-xl font-bold text-red-700 mb-4">Application Crash</h2>
            <p className="text-gray-700 mb-4">The application encountered a runtime error.</p>
            <div className="bg-gray-100 p-3 rounded font-mono text-xs mb-4 overflow-auto max-h-40">
              {this.state.error && this.state.error.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Authentication Provider
const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const profile = await getProfile(userId);
    if (profile) {
      setCurrentUser(profile);
    }
    setIsLoading(false);
  };

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const register = async (userData) => {
    const { error } = await supabase.auth.signUp({
      email: userData.username, // Using email as username
      password: userData.password,
      options: {
        data: {
          full_name: userData.name,
          role: userData.role || 'employee'
        }
      }
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  // Create user without signing in (for Admin use)
  const createUser = async (userData) => {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Supabase configuration missing' };
    }

    // Create a temporary client to avoid overwriting the current session
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    const { error } = await tempClient.auth.signUp({
      email: userData.username,
      password: userData.password,
      options: {
        data: {
          full_name: userData.name,
          role: userData.role || 'employee'
        }
      }
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, register, createUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper to format date for display (DD/MM/YYYY)
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr !== 'string') return dateStr;

  // Pattern: YYYY-MM-DD (ISO)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d}/${m}/${y}`;
  }

  // General fallback for other string formats
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    // For non-ISO strings, new Date() is safer but still check for shifts
    // Use Intl.DateTimeFormat for consistent formatting if possible
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  } catch (e) {
    return dateStr;
  }
};

// Reusable Components
const Button = ({ children, variant = 'primary', onClick, disabled, className = '', type = 'button' }) => {
  const baseStyles = 'px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm';
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 hover:shadow-indigo-200 hover:shadow-lg',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md',
    danger: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 hover:shadow-rose-100 hover:shadow-xl',
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-100 hover:shadow-xl',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 shadow-none'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-0.5">{label}</label>}
    <input
      {...props}
      className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-gray-400 outline-none shadow-sm ${error ? 'border-rose-300 ring-2 ring-rose-50' : 'border-gray-200'}`}
    />
    {error && <p className="mt-1.5 text-xs font-medium text-rose-500 ml-0.5 animate-in fade-in slide-in-from-top-1">{error}</p>}
  </div>
);

const Select = ({ label, options, error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-0.5">{label}</label>}
    <select
      {...props}
      className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none shadow-sm appearance-none cursor-pointer ${error ? 'border-rose-300 ring-2 ring-rose-50' : 'border-gray-200'}`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="mt-1.5 text-xs font-medium text-rose-500 ml-0.5 animate-in fade-in slide-in-from-top-1">{error}</p>}
  </div>
);

const SearchableSelect = ({ label, value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes((value || '').toLowerCase())
  );

  const handleSelect = (selectedValue) => {
    onChange({ target: { value: selectedValue } });
    setIsOpen(false);
  };

  return (
    <div className="mb-4 relative">
      {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-10"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map(opt => (
            <div
              key={opt.value}
              className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-gray-700 text-sm"
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
    {children}
  </div>
);

// Login Page Component
const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Enforce @ovmkr.site domain if not present
    let finalEmail = formData.username.trim();
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail}@ovmkr.site`;
    }

    const result = await login(finalEmail, formData.password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
        <div className="text-center p-8 border-b border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 transform -rotate-6 transition-transform hover:rotate-0">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Lead Manager Pro
          </h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <Input
            label="Email or Username"
            type="text"
            placeholder="username@ovmkr.site"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full mb-4">
            Login
          </Button>
        </form>
      </Card>
    </div>
  );
};

// Employee Dashboard
const EmployeeDashboard = () => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', campaign: '' });
  const [campaigns, setCampaigns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [stats, setStats] = useState({ total: 0, qualified: 0, disqualified: 0, pending: 0 });
  const [onBreak, setOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [currentBreakDuration, setCurrentBreakDuration] = useState(0);
  const [breakHistory, setBreakHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('leads');

  const LEADS_PER_PAGE = 10;

  useEffect(() => {
    loadLeads();
    loadBreakData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    let interval;
    if (onBreak && breakStartTime) {
      interval = setInterval(() => {
        const durationSeconds = Math.floor((Date.now() - breakStartTime) / 1000);
        setCurrentBreakDuration(durationSeconds);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [onBreak, breakStartTime]);

  const loadLeads = async () => {
    const { data: userLeads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('employee_id', currentUser.id);

    if (error) {
      console.error('Error loading leads:', error);
      return;
    }

    setLeads(userLeads);
    setFilteredLeads(userLeads);

    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_active', true);
    setCampaigns(campaignsData || []);

    const qualified = userLeads.filter(l => l.status === 'qualified').length;
    const disqualified = userLeads.filter(l => l.status === 'disqualified').length;
    const pending = userLeads.filter(l => l.status === 'pending').length;

    setStats({
      total: userLeads.length,
      qualified,
      disqualified,
      pending
    });
  };

  const applyFilters = () => {
    let filtered = [...leads];

    if (filters.startDate) {
      filtered = filtered.filter(lead => lead.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(lead => lead.date <= filters.endDate);
    }
    if (filters.campaign) {
      filtered = filtered.filter(lead => (lead.campaign || '').toLowerCase().includes(filters.campaign.toLowerCase()));
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ startDate: '', endDate: '', campaign: '' });
    setFilteredLeads(leads);
    setCurrentPage(1);
  };

  const downloadLeads = () => {
    const leadsToDownload = filteredLeads;

    if (leadsToDownload.length === 0) {
      alert('No leads to download.');
      return;
    }

    const headers = [
      'Date', 'RA Name', 'Campaign', 'Company', 'Salutation', 'First Name', 'Last Name',
      'Email', 'Domain', 'Job Title', 'Department', 'Job Level', 'Job Title Link',
      'Phone', 'Direct Dial', 'Address', 'City', 'State', 'Zip', 'Country',
      'Industry', 'Industry Link', 'Employee Size', 'Associated Members', 'Employee Size Link',
      'Revenue Size', 'Revenue Size Link', 'Tenure', 'VV Status', 'Status', 'RA Comments',
      'Additional Details'
    ];

    const rows = leadsToDownload.map(lead => {
      let customDetails = '';
      if (lead.campaign && lead.custom_question_responses) {
        const campaignObj = campaigns.find(c => c.name === lead.campaign);
        if (campaignObj && campaignObj.custom_questions) {
          customDetails = campaignObj.custom_questions
            .map(q => {
              const answer = lead.custom_question_responses[q.id];
              return answer ? `${q.question}: ${answer}` : null;
            })
            .filter(Boolean)
            .join(' | ');
        }
      }

      return [
        formatDisplayDate(lead.date),
        lead.ra_name,
        lead.campaign || '',
        lead.company_name,
        lead.salutation,
        lead.first_name,
        lead.last_name,
        lead.email,
        lead.domain,
        lead.job_title,
        lead.department,
        lead.job_level,
        lead.job_title_link,
        lead.phone_no,
        lead.direct_dial,
        lead.address1,
        lead.city,
        lead.state,
        lead.zip_code,
        lead.country,
        lead.industry_type,
        lead.industry_type_link,
        lead.employee_size,
        lead.associated_members || '',
        lead.employee_size_link,
        lead.revenue_size || '',
        lead.revenue_size_link || '',
        lead.tenure || '',
        lead.vv_status || '',
        lead.status,
        lead.ra_comments,
        customDetails
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.map(item => `"${(item || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `my_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadBreakData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: userBreaks, error } = await supabase
      .from('breaks_monitoring')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      console.error('Error loading break data:', error);
      return;
    }

    if (userBreaks) {
      setTotalBreakTime(userBreaks.total_break_seconds || 0);
      setBreakHistory(userBreaks.breaks || []);
      if (userBreaks.current_break_start) {
        setOnBreak(true);
        setBreakStartTime(new Date(userBreaks.current_break_start).getTime());
      }
    } else {
      setTotalBreakTime(0);
      setBreakHistory([]);
      setOnBreak(false);
      setBreakStartTime(null);
    }
  };

  const handleBreakToggle = async () => {
    const today = new Date().toISOString().split('T')[0];

    if (onBreak) {
      // End break
      const durationSeconds = Math.floor((Date.now() - breakStartTime) / 1000);
      const newTotal = totalBreakTime + durationSeconds;
      const newBreak = {
        startTime: new Date(breakStartTime).toISOString(),
        endTime: new Date().toISOString(),
        durationSeconds: durationSeconds,
        duration: Math.floor(durationSeconds / 60)
      };

      const { error } = await supabase
        .from('breaks_monitoring')
        .update({
          total_break_seconds: newTotal,
          current_break_start: null,
          breaks: [...breakHistory, newBreak]
        })
        .eq('user_id', currentUser.id)
        .eq('date', today);

      if (!error) {
        setTotalBreakTime(newTotal);
        setBreakHistory([...breakHistory, newBreak]);
        setOnBreak(false);
        setBreakStartTime(null);
        setCurrentBreakDuration(0);
      } else {
        alert('Error saving break end: ' + error.message);
      }
    } else {
      // Start break
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('breaks_monitoring')
        .upsert({
          user_id: currentUser.id,
          date: today,
          current_break_start: now
        }, { onConflict: 'user_id,date' });

      if (!error) {
        setOnBreak(true);
        setBreakStartTime(new Date(now).getTime());
      } else {
        alert('Error starting break: ' + error.message);
      }
    }
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(hrs > 0 ? 2 : 1, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * LEADS_PER_PAGE,
    currentPage * LEADS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'leads'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          My Leads
        </button>
        <button
          onClick={() => setActiveTab('breaks')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'breaks'
            ? 'border-purple-600 text-purple-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <Coffee className="w-4 h-4 inline mr-2" />
          Break Management
        </button>
      </div>

      {/* Leads Tab */}
      {activeTab === 'leads' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-white border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Qualified</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.qualified}</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Disqualified</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.disqualified}</p>
                </div>
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-200">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-indigo-600" />
              Filter Leads
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
              <SearchableSelect
                label="Campaign Name"
                value={filters.campaign}
                onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
                placeholder="Search campaign..."
                options={campaigns.filter(c => c.is_active).map(c => ({ value: c.name, label: c.name }))}
              />
              <div className="flex items-end pb-4 gap-2">
                <Button
                  onClick={applyFilters}
                  className="flex-1 flex items-center justify-center"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Apply
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleClearFilters}
                  title="Clear Filters"
                  className="px-3"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={downloadLeads}
                  title="Download Leads"
                  className="px-3"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Leads
            </Button>
          </div>

          {/* Leads Table */}
          <Card className="overflow-hidden border-none shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedLeads.map((lead, index) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDisplayDate(lead.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.campaign || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.company_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.salutation} {lead.first_name} {lead.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.job_title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex text-[11px] leading-4 font-bold rounded-xl border ${lead.status === 'qualified' ? 'bg-green-50 text-green-700 border-green-100' :
                          lead.status === 'disqualified' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-yellow-50 text-yellow-700 border-yellow-100'
                          } uppercase`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowUploadModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * LEADS_PER_PAGE) + 1} to {Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} leads
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Upload Modal */}
          {showUploadModal && (
            <UploadLeadModal
              onClose={() => {
                setShowUploadModal(false);
                setSelectedLead(null);
              }}
              onSuccess={loadLeads}
              employeeId={currentUser.id}
              employeeName={currentUser.name}
              leadToEdit={selectedLead}
            />
          )}
        </>
      )}

      {/* Breaks Tab */}
      {activeTab === 'breaks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex flex-col justify-center">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-purple-600">Active Break Status</p>
                  <Coffee className={`w-6 h-6 ${onBreak ? 'text-purple-600 animate-pulse' : 'text-gray-400'}`} />
                </div>
                <p className="text-4xl font-bold text-purple-900 mb-2">
                  {onBreak
                    ? `${Math.floor(currentBreakDuration / 60)}:${(currentBreakDuration % 60).toString().padStart(2, '0')}`
                    : "00:00"}
                </p>
                <p className="text-sm text-purple-600 mb-6">
                  {onBreak ? "Break in progress..." : "Ready to start break"}
                </p>
                <Button
                  variant={onBreak ? 'danger' : 'primary'}
                  onClick={handleBreakToggle}
                  className="w-full py-4 text-lg"
                >
                  <Coffee className="w-5 h-5 mr-2" />
                  {onBreak ? 'End Break' : 'Start Break'}
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-white border-gray-200 md:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Today's Summary</h3>
                <div className="px-4 py-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider">Total Break Time</p>
                  <p className="text-2xl font-bold text-purple-900">{formatTime(totalBreakTime)}</p>
                </div>
              </div>

              {breakHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Start</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">End</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {breakHistory.map((breakItem, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(breakItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(breakItem.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-purple-600">
                            {breakItem.durationSeconds
                              ? `${Math.floor(breakItem.durationSeconds / 60)}:${(breakItem.durationSeconds % 60).toString().padStart(2, '0')}`
                              : `${breakItem.duration} min`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coffee className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500">No break records for today yet.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// Upload Lead Modal Component - Enhanced for Edit
const UploadLeadModal = ({ onClose, onSuccess, employeeId, employeeName, leadToEdit }) => {
  const [uploadType, setUploadType] = useState('single');
  const [formData, setFormData] = useState(
    leadToEdit ? { ...leadToEdit } : {
      campaign: '',
      company_name: '',
      salutation: 'Mr.',
      first_name: '',
      last_name: '',
      email: '',
      domain: '',
      job_title: '',
      department: 'Marketing',
      job_level: 'Mid-level',
      job_title_link: '',
      phone_no: '',
      direct_dial: '',
      address1: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'United States',
      industry_type: 'Technology',
      industry_type_link: '',
      employee_size: '1-10',
      employee_size_link: '',
      associated_members: '',
      revenue_size: '',
      revenue_size_link: '',
      tenure: '',
      vv_status: 'RPC Verified',
      ra_comments: '',
      custom_question_responses: {}
    }
  );
  const [csvFile, setCsvFile] = useState(null);
  const [selectedBulkCampaign, setSelectedBulkCampaign] = useState('');
  const [errors, setErrors] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [updateExistingLeads, setUpdateExistingLeads] = useState(false);

  const departments = ['HR', 'Finance', 'Marketing', 'Sales', 'IT', 'Operations', 'R&D', 'Customer Service', 'Legal', 'Supply Chain', 'Logistics', 'Administration', 'QA/QC', 'Engineering', 'Security', 'PMO', 'Corporate Strategy', 'PR', 'Facilities Management', 'Data Analytics'];

  const jobLevels = ['Entry-level', 'Junior', 'Mid-level', 'Senior', 'Principal', 'Executive', 'C-Suite'];

  const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'China', 'Japan', 'Brazil'];

  const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Energy', 'Transportation', 'Media'];

  const employeeSizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10,000+'];

  const vvStatusOptions = ['RPC Verified', 'RPC Voice Mail', 'Dail by Name', 'Operator Verified', 'Company Verified'];

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data: activeCampaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true);
      if (!error) {
        setCampaigns(activeCampaigns);
      }
    };
    fetchCampaigns();
  }, []);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSingleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.company_name) newErrors.company_name = 'Company name is required';
    if (!formData.first_name) newErrors.first_name = 'First name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = async () => {
      // Duplicate check (only for new leads or if email changed)
      if (!leadToEdit || leadToEdit.email !== formData.email) {
        const { data: existingLeads } = await supabase
          .from('leads')
          .select('id, company_name')
          .eq('email', formData.email);

        if (existingLeads && existingLeads.length > 0) {
          if (!window.confirm(`A lead with this email already exists in "${existingLeads[0].company_name}". Do you want to proceed and create a duplicate?`)) {
            return;
          }
        }
      }

      if (leadToEdit) {
        // Update existing lead
        const { error } = await supabase
          .from('leads')
          .update(formData)
          .eq('id', leadToEdit.id);
        if (error) {
          alert('Error updating lead: ' + error.message);
          return;
        }
      } else {
        // Create new lead
        const newLead = {
          date: new Date().toISOString().split('T')[0],
          ra_name: employeeName,
          employee_id: employeeId,
          status: 'pending',
          ...formData
        };
        const { error } = await supabase
          .from('leads')
          .insert(newLead);
        if (error) {
          alert('Error creating lead: ' + error.message);
          return;
        }
      }

      onSuccess();
      onClose();
    };

    submitData();
  };

  // Function to download CSV template
  const downloadTemplate = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      const standardHeaders = [
        'Date', 'RA Name', 'Campaign', 'Company', 'Salutation', 'First Name', 'Last Name',
        'Email', 'Domain', 'Job Title', 'Department', 'Job Level',
        'Job Title Link', 'Phone', 'Direct Dial', 'Address', 'City',
        'State', 'Zip', 'Country', 'Industry', 'Industry Link',
        'Employee Size', 'Associated Members', 'Employee Size Link', 'Revenue',
        'Revenue Link', 'Tenure', 'VV Status', 'RA Comments'
      ];

      let headers = [...standardHeaders];

      if (selectedBulkCampaign) {
        const campaignObj = campaigns.find(c => c.name === selectedBulkCampaign);
        if (campaignObj && campaignObj.custom_questions) {
          campaignObj.custom_questions.forEach(q => headers.push(q.question));
        }
      } else {
        const allCustomQuestions = new Set();
        campaigns.forEach(c => {
          if (c.is_active && c.custom_questions) {
            c.custom_questions.forEach(q => allCustomQuestions.add(q.question));
          }
        });
        headers = [...headers, ...Array.from(allCustomQuestions)];
      }

      const csvContent = headers.join(",") + "\n";
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = 'none';
      link.href = url;
      link.setAttribute("download", selectedBulkCampaign ? `template_${selectedBulkCampaign.replace(/\s+/g, '_')}.csv` : "lead_upload_template.csv");
      document.body.appendChild(link);
      link.click();

      // Cleanup with delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Template download error:', err);
      alert('Failed to generate template. Please try again.');
    }
  };

  const parseCSV = (text) => {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    // Remove BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentCell += '"';
            i++; // Skip escaped quote
          } else {
            inQuotes = false;
          }
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          currentRow.push(currentCell.trim());
          if (currentRow.some(c => c)) { // Only add non-empty rows
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = '';
          if (char === '\r') i++; // Skip \n after \r
        } else if (char === '\r') {
          // Handle \r only (old Mac style)
          currentRow.push(currentCell.trim());
          if (currentRow.some(c => c)) rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
    }

    // Handle last row if no newline at EOF
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c)) rows.push(currentRow);
    }

    return rows;
  };

  const handleBulkUpload = (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target.result;

      const rows = parseCSV(text);

      if (rows.length < 2) {
        alert('The CSV file appears to be empty or only contains headers.');
        return;
      }

      const processRows = async () => {
        // Parse headers
        const rawHeaders = rows[0];
        const headers = rawHeaders.map(h => h.trim().toLowerCase());

        const headerMap = headers.reduce((acc, curr, index) => {
          if (curr) acc[curr] = index;
          return acc;
        }, {});

        // Check for mandatory header: Company Name
        if (!headerMap['company name'] && !headerMap['company']) {
          alert(`Mandatory header 'Company Name' or 'Company' not found.\nAvailable headers: ${headers.join(', ')}`);
          return;
        }

        // Column Mappings (Aliases)
        const COL_ALIASES = {
          'company_name': ['company name', 'company', 'organization', 'business name', 'client'],
          'first_name': ['first name', 'first', 'fname', 'contact person', 'contact name', 'contact', 'name'],
          'last_name': ['last name', 'last', 'lname', 'surname'],
          'email': ['email', 'email address', 'e-mail', 'mail', 'contact email', 'email id'],
          'job_title': ['job title', 'job', 'title', 'position', 'designation', 'role', 'occupation'],
          'phone_no': ['phone no', 'phone', 'mobile', 'cell', 'contact number', 'telephone', 'phone number'],
          'address1': ['address 1', 'address', 'street', 'location', 'address line 1'],
          'zip_code': ['zip code', 'zip', 'postal code', 'pincode', 'postcode'],
          'employee_size': ['employee size', 'employees', 'staff size', 'company size', 'no of employees'],
          'revenue_size': ['revenue size', 'revenue', 'turnover', 'annual revenue', 'annual turnover'],
          'industry_type': ['industry type', 'industry', 'sector', 'domain', 'vertical'],
          'city': ['city', 'town', 'location', 'municipality'],
          'state': ['state', 'province', 'region', 'district'],
          'country': ['country', 'nation', 'region'],
          'linkedin_profile': ['linkedin', 'linkedin profile', 'linkedin url', 'profile url', 'url'],
          'id': ['id', 'lead id', 'lead_id', 'record id'],
          'status': ['status', 'state', 'lead status', 'current status']
        };

        // Helper to safely get value by header name or aliases
        const getValue = (cols, fieldKey) => {
          let index = headerMap[fieldKey.toLowerCase()];

          if (index === undefined && COL_ALIASES[fieldKey]) {
            for (const alias of COL_ALIASES[fieldKey]) {
              if (headerMap[alias] !== undefined) {
                index = headerMap[alias];
                break;
              }
            }
          }

          if (index === undefined) {
            const key = fieldKey.toLowerCase().replace(/_/g, ' ');
            index = headerMap[key];
          }

          if (index === undefined) return '';
          const val = cols[index];
          return val ? val.trim() : '';
        };

        const normalizeDate = (dateStr) => {
          if (!dateStr) return new Date().toISOString().split('T')[0];

          let cleanDateStr = dateStr.toString().trim();

          // Handle Excel serial dates
          if (/^\d{5}(\.\d+)?$/.test(cleanDateStr)) {
            const excelEpoch = new Date(1899, 11, 30);
            const days = parseFloat(cleanDateStr);
            const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
            if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
          }

          // Format YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}/.test(cleanDateStr)) return cleanDateStr.substring(0, 10);

          // Remove time/timezone if present
          cleanDateStr = cleanDateStr.split(' ')[0].split('T')[0];

          // Handle DD-MM-YYYY or MM-DD-YYYY or DD/MM/YYYY etc.
          const parts = cleanDateStr.split(/[./-]/);

          if (parts.length === 3) {
            let y, m, d;
            if (parts[0].length === 4) { // YYYY-MM-DD
              y = parts[0]; m = parts[1]; d = parts[2];
            } else if (parts[2].length === 4 || parts[2].length === 2) {
              y = parts[2].length === 2 ? (parseInt(parts[2]) > 50 ? '19' : '20') + parts[2] : parts[2];
              const p1 = parseInt(parts[0], 10);
              const p2 = parseInt(parts[1], 10);

              if (p1 > 12) { // DD-MM-YYYY
                d = parts[0]; m = parts[1];
              } else if (p2 > 12) { // MM-DD-YYYY
                m = parts[0]; d = parts[1];
              } else {
                // Ambiguous, assume DD-MM-YYYY as per user preference
                d = parts[0]; m = parts[1];
              }
            }
            if (y && m && d) return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
          }

          const timestamp = Date.parse(dateStr);
          if (!isNaN(timestamp)) {
            return new Date(timestamp).toISOString().split('T')[0];
          }

          return new Date().toISOString().split('T')[0];
        };

        let skippedCount = 0;
        let missingCampaignCount = 0;
        let internalDuplicateCount = 0;
        const newLeads = [];
        const seenEmails = new Set();

        for (let i = 1; i < rows.length; i++) {
          const columns = rows[i];
          const companyName = getValue(columns, 'company_name');
          const email = getValue(columns, 'email');

          if (!companyName) {
            skippedCount++;
            continue;
          }

          // Internal CSV Duplicate Check
          if (email) {
            if (seenEmails.has(email.toLowerCase())) {
              internalDuplicateCount++;
              continue;
            }
            seenEmails.add(email.toLowerCase());
          }

          const rawCampaignName = selectedBulkCampaign || getValue(columns, 'Campaign');
          let campaignName = null;
          const customQuestionResponses = {};

          if (rawCampaignName) {
            const campaignObj = campaigns.find(c =>
              c.name.toLowerCase() === rawCampaignName.toLowerCase()
            );

            if (campaignObj) {
              campaignName = campaignObj.name;
              if (campaignObj.custom_questions) {
                campaignObj.custom_questions.forEach(q => {
                  const answer = getValue(columns, q.question);
                  if (answer) customQuestionResponses[q.id] = answer;
                });
              }
            } else {
              missingCampaignCount++;
            }
          }

          const leadId = getValue(columns, 'id');

          const leadData = {
            date: normalizeDate(getValue(columns, 'Current Date') || getValue(columns, 'Date')),
            ra_name: getValue(columns, 'RA Name') || employeeName,
            employee_id: employeeId,
            status: getValue(columns, 'Status') || 'pending',
            campaign: campaignName,
            company_name: companyName,
            salutation: getValue(columns, 'Salutation') || 'Mr.',
            first_name: getValue(columns, 'first_name'),
            last_name: getValue(columns, 'last_name'),
            email: email,
            domain: getValue(columns, 'Domain'),
            job_title: getValue(columns, 'job_title'),
            department: getValue(columns, 'Department') || 'Marketing',
            job_level: getValue(columns, 'Job Level') || 'Mid-level',
            job_title_link: getValue(columns, 'Job Title Link'),
            phone_no: getValue(columns, 'phone_no'),
            direct_dial: getValue(columns, 'Direct Dial'),
            address1: getValue(columns, 'address1'),
            city: getValue(columns, 'city'),
            state: getValue(columns, 'state'),
            zip_code: getValue(columns, 'zip_code'),
            country: getValue(columns, 'country') || 'United States',
            industry_type: getValue(columns, 'industry_type') || 'Technology',
            industry_type_link: getValue(columns, 'Industry Type Link'),
            employee_size: getValue(columns, 'employee_size') || '1-10',
            associated_members: getValue(columns, 'Associated Members'),
            employee_size_link: getValue(columns, 'Employee Size Link'),
            revenue_size: getValue(columns, 'revenue_size'),
            revenue_size_link: getValue(columns, 'Revenue Size Link'),
            tenure: getValue(columns, 'Tenure'),
            vv_status: getValue(columns, 'VV Status') || 'RPC Verified',
            ra_comments: getValue(columns, 'RA Comments'),
            custom_question_responses: customQuestionResponses
          };

          if (leadId) {
            leadData.id = leadId;
          }

          newLeads.push(leadData);
        }

        if (newLeads.length === 0) {
          alert(`No valid leads found to import.\nRows skipped: ${skippedCount}\nInternal Duplicates: ${internalDuplicateCount}`);
          return;
        }

        // Batch Duplicate Check against Database (Only for NEW leads without IDs)
        const leadsPendingInsert = newLeads.filter(l => !l.id);
        const leadsPendingUpsert = newLeads.filter(l => l.id);

        const emailsToCheck = leadsPendingInsert.map(l => l.email).filter(Boolean);
        let finalLeadsToInsert = [...leadsPendingInsert];
        let dbDuplicateCount = 0;

        if (emailsToCheck.length > 0) {
          const batchSize = 500;
          const existingEmailMap = {}; // { email: id }
          for (let i = 0; i < emailsToCheck.length; i += batchSize) {
            const batch = emailsToCheck.slice(i, i + batchSize);
            const { data: dbLeads } = await supabase
              .from('leads')
              .select('id, email')
              .in('email', batch);
            if (dbLeads) {
              dbLeads.forEach(l => {
                existingEmailMap[l.email.toLowerCase()] = l.id;
              });
            }
          }

          const existingEmails = Object.keys(existingEmailMap);
          if (existingEmails.length > 0) {
            dbDuplicateCount = existingEmails.length;

            if (updateExistingLeads) {
              // Map existing IDs to the newLeads
              finalLeadsToInsert = leadsPendingInsert.map(nl => {
                if (nl.email && existingEmailMap[nl.email.toLowerCase()]) {
                  return { ...nl, id: existingEmailMap[nl.email.toLowerCase()] };
                }
                return nl;
              });
            } else {
              if (!window.confirm(`${dbDuplicateCount} NEW leads already exist in the database (by email). \n\nDo you want to skip these duplicates and import the remaining ${leadsPendingInsert.length - dbDuplicateCount} new leads?`)) {
                return;
              }
              finalLeadsToInsert = leadsPendingInsert.filter(nl => !nl.email || !existingEmailMap[nl.email.toLowerCase()]);
            }
          }
        }

        const finalLeads = [...leadsPendingUpsert, ...finalLeadsToInsert];

        if (finalLeads.length === 0) {
          alert('No leads to process after duplicate check.');
          onClose();
          return;
        }

        // Final Insert/Upsert in batches
        const insertBatchSize = 100;
        let successCount = 0;

        // Divide into updates (with ID) and inserts (without ID)
        const leadsToUpsert = finalLeads.filter(l => l.id);
        const leadsToInsert = finalLeads.filter(l => !l.id);

        // Process Upserts
        for (let i = 0; i < leadsToUpsert.length; i += insertBatchSize) {
          const batch = leadsToUpsert.slice(i, i + insertBatchSize);
          const { error } = await supabase.from('leads').upsert(batch);
          if (error) {
            console.error('Upsert error at batch:', i, error);
            alert(`Error updating records at row ${i + 1}: ${error.message}`);
            return;
          }
          successCount += batch.length;
        }

        // Process Inserts
        for (let i = 0; i < leadsToInsert.length; i += insertBatchSize) {
          const batch = leadsToInsert.slice(i, i + insertBatchSize);
          const { error } = await supabase.from('leads').insert(batch);
          if (error) {
            console.error('Insert error at batch:', i, error);
            alert(`Error inserting records at row ${i + 1}: ${error.message}`);
            return;
          }
          successCount += batch.length;
        }

        setUploadResult({
          successCount,
          dbDuplicateCount,
          internalDuplicateCount,
          skippedCount,
          missingCampaignCount
        });
        onSuccess();
        onClose();
      };

      processRows();
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {leadToEdit ? 'Edit Lead' : 'Upload Leads'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {uploadResult ? (
            <div className="animate-in zoom-in-95 fade-in duration-500 max-w-2xl mx-auto py-8">
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Upload Complete!</h3>
                <p className="text-gray-500 text-lg">Your data has been successfully processed.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Imported</p>
                  <p className="text-4xl font-extrabold text-emerald-900">{uploadResult.successCount}</p>
                </div>
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">DB Duplicates</p>
                  <p className="text-4xl font-extrabold text-amber-900">{uploadResult.dbDuplicateCount}</p>
                </div>
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">CSV Duplicates</p>
                  <p className="text-4xl font-extrabold text-blue-900">{uploadResult.internalDuplicateCount}</p>
                </div>
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Skipped Rows</p>
                  <p className="text-4xl font-extrabold text-slate-900">{uploadResult.skippedCount}</p>
                </div>
              </div>

              {uploadResult.missingCampaignCount > 0 && (
                <div className="p-5 bg-amber-100/50 rounded-2xl border border-amber-200 flex gap-4 mb-10">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-900 font-medium">
                    <span className="font-bold">Note:</span> {uploadResult.missingCampaignCount} rows had unknown campaign names and were set to 'None'.
                  </p>
                </div>
              )}

              <Button onClick={() => { setUploadResult(null); onClose(); }} className="w-full py-4 text-lg">
                Return to Dashboard
              </Button>
            </div>
          ) : (
            <>
              {/* Toggle Upload Type - Only show if not editing */}
              {!leadToEdit && (
                <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8 border border-gray-100">
                  <button
                    onClick={() => setUploadType('single')}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${uploadType === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Single Lead
                  </button>
                  <button
                    onClick={() => setUploadType('bulk')}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${uploadType === 'bulk' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Bulk Upload (CSV)
                  </button>
                </div>
              )}

              {uploadType === 'single' ? (
                <form onSubmit={handleSingleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Select
                        label="Campaign"
                        value={formData.campaign}
                        onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                        options={[
                          { value: '', label: '-- Select Campaign --' },
                          ...campaigns.map(c => ({ value: c.name, label: c.name }))
                        ]}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Target className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900">Contact Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Salutation"
                          value={formData.salutation}
                          onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                          options={['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'].map(s => ({ value: s, label: s }))}
                        />
                        <div className="hidden md:block"></div>
                        <Input
                          label="First Name *"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          error={errors.first_name}
                          required
                        />
                        <Input
                          label="Last Name"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        />
                        <Input
                          label="Email *"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          error={errors.email}
                          required
                        />
                        <Input
                          label="Phone Number"
                          value={formData.phone_no}
                          onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                          placeholder="+1-123-456-7890"
                        />
                        <Input
                          label="Direct Dial"
                          value={formData.direct_dial}
                          onChange={(e) => setFormData({ ...formData, direct_dial: e.target.value })}
                          placeholder="+1-123-456-7890 ext 123"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4 mt-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900">Company & Professional Info</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Company Name *"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          error={errors.company_name}
                          required
                        />
                        <Input
                          label="Domain"
                          value={formData.domain}
                          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        />
                        <Input
                          label="Job Title"
                          value={formData.job_title}
                          onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                        />
                        <Input
                          label="Job Title Link"
                          value={formData.job_title_link}
                          onChange={(e) => setFormData({ ...formData, job_title_link: e.target.value })}
                          placeholder="LinkedIn URL or similar"
                        />
                        <Select
                          label="Department"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          options={departments.map(d => ({ value: d, label: d }))}
                        />
                        <Select
                          label="Job Level"
                          value={formData.job_level}
                          onChange={(e) => setFormData({ ...formData, job_level: e.target.value })}
                          options={jobLevels.map(l => ({ value: l, label: l }))}
                        />
                        <Select
                          label="Industry Type"
                          value={formData.industry_type}
                          onChange={(e) => setFormData({ ...formData, industry_type: e.target.value })}
                          options={industries.map(i => ({ value: i, label: i }))}
                        />
                        <Input
                          label="Industry Link"
                          value={formData.industry_type_link}
                          onChange={(e) => setFormData({ ...formData, industry_type_link: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4 mt-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Globe className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900">Location & Size</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Address"
                          value={formData.address1}
                          onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                        />
                        <Input
                          label="City"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                        <Input
                          label="State"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                        <Input
                          label="Zip Code"
                          value={formData.zip_code}
                          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        />
                        <Select
                          label="Country"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          options={countries.map(c => ({ value: c, label: c }))}
                        />
                        <Input
                          label="Associated Members"
                          value={formData.associated_members}
                          onChange={(e) => setFormData({ ...formData, associated_members: e.target.value })}
                          placeholder="e.g., 5"
                        />
                        <Select
                          label="Employee Size"
                          value={formData.employee_size}
                          onChange={(e) => setFormData({ ...formData, employee_size: e.target.value })}
                          options={employeeSizes.map(s => ({ value: s, label: s }))}
                        />
                        <Input
                          label="Employee Size Link"
                          value={formData.employee_size_link}
                          onChange={(e) => setFormData({ ...formData, employee_size_link: e.target.value })}
                        />
                        <Input
                          label="Revenue Size"
                          value={formData.revenue_size}
                          onChange={(e) => setFormData({ ...formData, revenue_size: e.target.value })}
                          placeholder="e.g., $10M"
                        />
                        <Input
                          label="Revenue Link"
                          value={formData.revenue_size_link}
                          onChange={(e) => setFormData({ ...formData, revenue_size_link: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4 mt-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900">Verification & Status</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="VV STATUS"
                          value={formData.vv_status}
                          onChange={(e) => setFormData({ ...formData, vv_status: e.target.value })}
                          options={vvStatusOptions.map(s => ({ value: s, label: s }))}
                        />
                        <Input
                          label="Tenure"
                          value={formData.tenure}
                          onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                          placeholder="e.g., 2 years"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">RA Comments</label>
                    <textarea
                      value={formData.ra_comments}
                      onChange={(e) => setFormData({ ...formData, ra_comments: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      rows="3"
                      placeholder="Add any comments or notes..."
                    />
                  </div>

                  {/* Custom Questions Display */}
                  {formData.campaign && campaigns.find(c => c.name === formData.campaign)?.custom_questions?.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {campaigns.find(c => c.name === formData.campaign).custom_questions.map((q) => (
                          <div key={q.id} className="md:col-span-2">
                            <Input
                              label={q.question}
                              value={formData.custom_question_responses?.[q.id] || ''}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  custom_question_responses: {
                                    ...formData.custom_question_responses,
                                    [q.id]: e.target.value
                                  }
                                });
                              }}
                              placeholder={`Enter answer for: ${q.question}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} type="button">
                      Cancel
                    </Button>
                    <Button type="submit" className="min-w-[150px]">
                      <Upload className="w-4 h-4 mr-2" />
                      {leadToEdit ? 'Update Lead' : 'Upload Lead'}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleBulkUpload} className="animate-in fade-in duration-500">
                  <div className="mb-8">
                    <Select
                      label="Select Campaign for these Leads"
                      value={selectedBulkCampaign}
                      onChange={(e) => setSelectedBulkCampaign(e.target.value)}
                      options={[
                        { value: '', label: '-- Use Campaign Names from CSV --' },
                        ...campaigns.map(c => ({ value: c.name, label: c.name }))
                      ]}
                    />
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-indigo-50/50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-indigo-600" />
                      <p className="text-xs text-indigo-700 font-medium">
                        If selected, this will apply to ALL leads in the CSV.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-amber-50/50 rounded-lg border border-amber-100 italic">
                      <input
                        type="checkbox"
                        id="update-existing"
                        checked={updateExistingLeads}
                        onChange={(e) => setUpdateExistingLeads(e.target.checked)}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                      />
                      <label htmlFor="update-existing" className="text-xs font-bold text-amber-800 cursor-pointer">
                        Update existing leads (match by email)
                      </label>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 ml-auto" />
                    </div>
                  </div>

                  <div className="group relative border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center transition-all hover:border-indigo-300 hover:bg-gray-50/50 cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-600" />
                      </div>
                      <p className="text-gray-900 font-bold text-lg mb-1">
                        {csvFile ? csvFile.name : 'Click to upload or drag & drop'}
                      </p>
                      <p className="text-gray-500 text-sm">Supported format: .csv</p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col items-center gap-4 relative z-10">
                      <button
                        type="button"
                        onClick={downloadTemplate}
                        className="group/link text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-2 transition-colors pointer-events-auto"
                      >
                        <div className="p-2 bg-indigo-50 rounded-lg group-hover/link:bg-indigo-100 transition-colors">
                          <Download className="w-4 h-4" />
                        </div>
                        <span className="underline underline-offset-4 decoration-indigo-200">
                          {selectedBulkCampaign ? `Download Template for ${selectedBulkCampaign}` : 'Download Standard CSV Template'}
                        </span>
                      </button>
                      <p className="text-xs text-gray-400 max-w-sm">
                        {selectedBulkCampaign
                          ? `Template includes standard fields + custom questions for ${selectedBulkCampaign}.`
                          : 'Includes all fields: Campaign, Company, Contact Info, Revenue, etc.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} type="button">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!csvFile} className="min-w-[150px]">
                      <Upload className="w-4 h-4 mr-2" />
                      Process CSV
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

// QA Dashboard
const QADashboard = () => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', agent: '', campaign: '' });
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [stats, setStats] = useState({ audited: 0, qualified: 0, disqualified: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState('leads');
  const [editingLead, setEditingLead] = useState(null);

  // Break Management State
  const [onBreak, setOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [currentBreakDuration, setCurrentBreakDuration] = useState(0);
  const [breakHistory, setBreakHistory] = useState([]);

  const LEADS_PER_PAGE = 10;

  useEffect(() => {
    loadLeads();
    loadBreakData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval;
    if (onBreak && breakStartTime) {
      interval = setInterval(() => {
        const durationSeconds = Math.floor((Date.now() - breakStartTime) / 1000);
        setCurrentBreakDuration(durationSeconds);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [onBreak, breakStartTime]);

  const loadLeads = async () => {
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('*');

    if (!leadsError) {
      setLeads(leadsData);
      setFilteredLeads(leadsData);
    }

    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_active', true);
    setActiveCampaigns(campaignsData || []);

    const { data: auditLog, error: auditError } = await supabase
      .from('audit_log')
      .select('*')
      .eq('qa_id', currentUser.id);

    if (!auditError) {
      setStats({
        audited: auditLog.length,
        qualified: auditLog.filter(l => l.action === 'qualified').length,
        disqualified: auditLog.filter(l => l.action === 'disqualified').length
      });
    }
  };

  const loadBreakData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: userBreaks, error } = await supabase
      .from('breaks_monitoring')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      console.error('Error loading break data:', error);
      return;
    }

    if (userBreaks) {
      setTotalBreakTime(userBreaks.total_break_seconds || 0);
      setBreakHistory(userBreaks.breaks || []);
      if (userBreaks.current_break_start) {
        setOnBreak(true);
        setBreakStartTime(new Date(userBreaks.current_break_start).getTime());
      }
    } else {
      setTotalBreakTime(0);
      setBreakHistory([]);
      setOnBreak(false);
      setBreakStartTime(null);
    }
  };

  const handleBreakToggle = async () => {
    const today = new Date().toISOString().split('T')[0];

    if (onBreak) {
      // End break
      const durationSeconds = Math.floor((Date.now() - breakStartTime) / 1000);
      const newTotal = totalBreakTime + durationSeconds;
      const newBreak = {
        startTime: new Date(breakStartTime).toISOString(),
        endTime: new Date().toISOString(),
        durationSeconds: durationSeconds,
        duration: Math.floor(durationSeconds / 60)
      };

      const { error } = await supabase
        .from('breaks_monitoring')
        .update({
          total_break_seconds: newTotal,
          current_break_start: null,
          breaks: [...breakHistory, newBreak]
        })
        .eq('user_id', currentUser.id)
        .eq('date', today);

      if (!error) {
        setTotalBreakTime(newTotal);
        setBreakHistory([...breakHistory, newBreak]);
        setOnBreak(false);
        setBreakStartTime(null);
        setCurrentBreakDuration(0);
      } else {
        alert('Error saving break end: ' + error.message);
      }
    } else {
      // Start break
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('breaks_monitoring')
        .upsert({
          user_id: currentUser.id,
          date: today,
          current_break_start: now
        }, { onConflict: 'user_id,date' });

      if (!error) {
        setOnBreak(true);
        setBreakStartTime(new Date(now).getTime());
      } else {
        alert('Error starting break: ' + error.message);
      }
    }
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(hrs > 0 ? 2 : 1, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const applyFilters = () => {
    let filtered = [...leads];

    if (filters.startDate) {
      filtered = filtered.filter(lead => lead.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(lead => lead.date <= filters.endDate);
    }
    if (filters.agent) {
      filtered = filtered.filter(lead => (lead.ra_name || '').toLowerCase().includes(filters.agent.toLowerCase()));
    }
    if (filters.campaign) {
      filtered = filtered.filter(lead => (lead.campaign || '').toLowerCase().includes(filters.campaign.toLowerCase()));
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ startDate: '', endDate: '', agent: '', campaign: '' });
    setFilteredLeads(leads);
    setCurrentPage(1);
  };

  const handleQualify = async (leadId, status) => {
    const { error: updateError } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', leadId);

    if (!updateError) {
      await supabase.from('audit_log').insert({
        lead_id: leadId,
        qa_id: currentUser.id,
        qa_name: currentUser.name,
        action: status
      });
      loadLeads();
    } else {
      alert('Error updating lead: ' + updateError.message);
    }
  };

  const handleBulkAudit = async (status) => {
    if (selectedLeads.length === 0) {
      alert('Please select leads first!');
      return;
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({ status })
      .in('id', selectedLeads);

    if (!updateError) {
      const logs = selectedLeads.map(leadId => ({
        lead_id: leadId,
        qa_id: currentUser.id,
        qa_name: currentUser.name,
        action: status
      }));

      await supabase.from('audit_log').insert(logs);
      setSelectedLeads([]);
      loadLeads();
    } else {
      alert('Error in bulk audit: ' + updateError.message);
    }
  };

  const downloadLeads = () => {
    const headers = [
      'id', 'Date', 'RA Name', 'Campaign', 'Company', 'Salutation', 'First Name', 'Last Name',
      'Email', 'Domain', 'Job Title', 'Department', 'Job Level', 'Job Title Link',
      'Phone', 'Direct Dial', 'Address', 'City', 'State', 'Zip', 'Country',
      'Industry', 'Industry Link', 'Employee Size', 'Associated Members', 'Employee Size Link',
      'Revenue Size', 'Revenue Size Link', 'Tenure', 'VV Status', 'Status', 'RA Comments'
    ];

    const rows = filteredLeads.map(lead => [
      lead.id,
      formatDisplayDate(lead.date),
      lead.ra_name,
      lead.campaign || '',
      lead.company_name,
      lead.salutation,
      lead.first_name,
      lead.last_name,
      lead.email,
      lead.domain,
      lead.job_title,
      lead.department,
      lead.job_level,
      lead.job_title_link,
      lead.phone_no,
      lead.direct_dial,
      lead.address1,
      lead.city,
      lead.state,
      lead.zip_code,
      lead.country,
      lead.industry_type,
      lead.industry_type_link,
      lead.employee_size,
      lead.associated_members || '',
      lead.employee_size_link,
      lead.revenue_size || '',
      lead.revenue_size_link || '',
      lead.tenure || '',
      lead.vv_status || '',
      lead.status,
      lead.ra_comments
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(item => `"${(item || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * LEADS_PER_PAGE,
    currentPage * LEADS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'leads'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          Leads Management
        </button>
        <button
          onClick={() => setActiveTab('breaks')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'breaks'
            ? 'border-purple-600 text-purple-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <Coffee className="w-4 h-4 inline mr-2" />
          Break Management
        </button>
      </div>

      {activeTab === 'leads' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-white border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Total Audited</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.audited}</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Qualified</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.qualified}</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Disqualified</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.disqualified}</p>
                </div>
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                  <X className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
              <Input
                label="Agent Name"
                value={filters.agent}
                onChange={(e) => setFilters({ ...filters, agent: e.target.value })}
                placeholder="Search by agent name"
              />
              <SearchableSelect
                label="Campaign Name"
                value={filters.campaign}
                onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
                placeholder="Search campaign..."
                options={activeCampaigns.map(c => ({ value: c.name, label: c.name }))}
              />
              <div className="flex items-end gap-2 md:col-span-4 lg:col-span-1">
                <Button
                  onClick={applyFilters}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transform transition-all hover:-translate-y-0.5"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Apply
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleClearFilters}
                  title="Clear Filters"
                  className="px-3"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="secondary" onClick={downloadLeads} title="Download filtered leads">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Bulk Actions */}
          {selectedLeads.length > 0 && (
            <Card className="p-4 bg-indigo-50 border-indigo-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-indigo-900">
                  {selectedLeads.length} lead(s) selected
                </p>
                <div className="flex gap-2">
                  <Button variant="success" onClick={() => handleBulkAudit('qualified')}>
                    <Check className="w-4 h-4 mr-2" />
                    Qualify All
                  </Button>
                  <Button variant="danger" onClick={() => handleBulkAudit('disqualified')}>
                    <X className="w-4 h-4 mr-2" />
                    Disqualify All
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Leads
            </Button>
          </div>

          {/* Leads Table */}
          <Card className="overflow-hidden border-none shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads(paginatedLeads.map(l => l.id));
                          } else {
                            setSelectedLeads([]);
                          }
                        }}
                        checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads([...selectedLeads, lead.id]);
                            } else {
                              setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDisplayDate(lead.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.campaign || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.ra_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.company_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex text-[11px] leading-4 font-bold rounded-xl border ${lead.status === 'qualified' ? 'bg-green-50 text-green-700 border-green-100' :
                          lead.status === 'disqualified' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-yellow-50 text-yellow-700 border-yellow-100'
                          } uppercase`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingLead(lead);
                              setShowUploadModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit lead"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleQualify(lead.id, 'qualified')}
                            className="text-green-600 hover:text-green-700"
                            title="Qualify lead"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleQualify(lead.id, 'disqualified')}
                            className="text-red-600 hover:text-red-700"
                            title="Disqualify lead"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * LEADS_PER_PAGE) + 1} to {Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} leads
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {showUploadModal && (
            <UploadLeadModal
              onClose={() => {
                setShowUploadModal(false);
                setEditingLead(null);
              }}
              onSuccess={() => {
                loadLeads();
              }}
              activeCampaigns={activeCampaigns}
              leadToEdit={editingLead}
            />
          )}

        </>
      )}

      {activeTab === 'breaks' && (
        <Card className="max-w-4xl mx-auto overflow-hidden">
          <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Coffee className={`w-10 h-10 ${onBreak ? 'text-indigo-600 animate-pulse' : 'text-gray-400'}`} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Break Management</h2>
            <p className="text-gray-600 text-lg">
              {onBreak ? 'You are currently on break' : 'Ready to take a break?'}
            </p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Current Session</p>
                <p className="text-5xl font-mono font-bold text-indigo-600 tabular-nums">
                  {formatTime(currentBreakDuration)}
                </p>
                <p className="text-xs text-indigo-400 mt-2 font-medium">Session Duration</p>
              </div>

              <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Total Today</p>
                <p className="text-5xl font-mono font-bold text-gray-800 tabular-nums">
                  {formatTime(totalBreakTime + (onBreak ? currentBreakDuration : 0))}
                </p>
                <p className="text-xs text-gray-400 mt-2 font-medium">Accumulated Time</p>
              </div>
            </div>

            <div className="flex justify-center mb-12">
              <button
                onClick={handleBreakToggle}
                className={`
                                relative group overflow-hidden rounded-full py-4 px-12 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl
                                ${onBreak
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-red-200'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-200'
                  }
                              `}
              >
                <div className="relative z-10 flex items-center gap-3 text-xl font-bold tracking-wide">
                  {onBreak ? (
                    <>
                      <LogOut className="w-6 h-6" />
                      <span>End Break</span>
                    </>
                  ) : (
                    <>
                      <Coffee className="w-6 h-6" />
                      <span>Start Break</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-400" />
                Today's History
              </h4>
              <div className="space-y-4">
                {breakHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 italic bg-gray-50 rounded-xl border border-gray-100">
                    No breaks taken yet today.
                  </p>
                ) : (
                  breakHistory.map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="text-gray-400 mx-2">→</span>
                            {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{new Date(b.startTime).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="px-4 py-1.5 bg-gray-100 rounded-lg text-gray-700 font-mono font-medium text-sm">
                        {formatTime(b.durationSeconds)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// Admin Break History Modal
const AdminBreakHistoryModal = ({ user, onClose }) => {
  const [breakData, setBreakData] = useState({ total_break_seconds: 0, breaks: [] });
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchBreaks = async () => {
      const { data, error } = await supabase
        .from('breaks_monitoring')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      if (!error && data) {
        setBreakData(data);
      }
    };
    fetchBreaks();
  }, [user.id, today]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(hrs > 0 ? 2 : 1, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSecs = breakData.total_break_seconds || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}'s Break History</h2>
              <p className="text-sm text-gray-500">Today: {formatDisplayDate(today)}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-4 bg-purple-50 border-purple-100">
              <p className="text-sm font-semibold text-purple-600">Total Break Time</p>
              <p className="text-2xl font-bold text-purple-900">{formatTime(totalSecs)}</p>
            </Card>
            <Card className="p-4 bg-indigo-50 border-indigo-100">
              <p className="text-sm font-semibold text-indigo-600">Break Count</p>
              <p className="text-2xl font-bold text-indigo-900">{breakData.breaks.length}</p>
            </Card>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Start</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">End</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {breakData.breaks.map((b, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{i + 1}</td>
                  <td className="px-4 py-3 text-sm">{new Date(b.startTime).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 text-sm">{new Date(b.endTime).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 text-sm font-medium text-purple-600">
                    {b.durationSeconds
                      ? `${Math.floor(b.durationSeconds / 60)}:${(b.durationSeconds % 60).toString().padStart(2, '0')}`
                      : `${b.duration} min`}
                  </td>
                </tr>
              ))}
              {breakData.breaks.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No breaks taken today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    agent: '',
    campaign: '',
    onlyStale: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const LEADS_PER_PAGE = 10;
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showEditLeadModal, setShowEditLeadModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [stats, setStats] = useState({});
  const [showAdminBreakHistory, setShowAdminBreakHistory] = useState(false);
  const [selectedUserForBreaks, setSelectedUserForBreaks] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, userId: null, userName: '' });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [breakFilters, setBreakFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showBulkDeleteLeadsConfirm, setShowBulkDeleteLeadsConfirm] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({ status: '', campaign: '' });
  const [allBreaks, setAllBreaks] = useState([]);

  const formatTime = (ts) => {
    const h = Math.floor(ts / 3600);
    const m = Math.floor((ts % 3600) / 60);
    const s = ts % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(h > 0 ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates for breaks_monitoring
    const today = new Date().toISOString().split('T')[0];
    const channel = supabase
      .channel('admin_breaks_monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'breaks_monitoring',
          filter: `date=eq.${today}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAllBreaks(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setAllBreaks(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
          } else if (payload.eventType === 'DELETE') {
            setAllBreaks(prev => prev.filter(b => b.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const loadData = async () => {
    const { data: leadsData } = await supabase.from('leads').select('*');
    const { data: usersData } = await supabase.from('profiles').select('*');
    const { data: campaignsData } = await supabase.from('campaigns').select('*');

    const today = new Date().toISOString().split('T')[0];
    const { data: breaksData } = await supabase
      .from('breaks_monitoring')
      .select('*')
      .eq('date', today);

    setLeads(leadsData || []);
    setFilteredLeads(leadsData || []);
    setUsers(usersData || []);
    setCampaigns(campaignsData || []);
    setAllBreaks(breaksData || []);

    setStats({
      totalLeads: (leadsData || []).length,
      totalUsers: (usersData || []).length,
      qualified: (leadsData || []).filter(l => l.status === 'qualified').length,
      disqualified: (leadsData || []).filter(l => l.status === 'disqualified').length,
      employees: (usersData || []).filter(u => u.role === 'employee').length,
      qaUsers: (usersData || []).filter(u => u.role === 'qa').length,
      totalCampaigns: (campaignsData || []).length,
      activeCampaigns: (campaignsData || []).filter(c => c.is_active).length,
      activeBreaks: (breaksData || []).filter(b => b.current_break_start).length
    });
  };

  const initiateDeleteUser = (user) => {
    setDeleteConfirmation({ isOpen: true, userId: user.id, userName: user.name });
  };

  const confirmDeleteUser = async () => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', deleteConfirmation.userId);

    if (!error) {
      loadData();
      setDeleteConfirmation({ isOpen: false, userId: null, userName: '' });
    } else {
      alert('Error deleting user profile: ' + error.message);
    }
  };

  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      const nonAdminIds = users.filter(u => u.role !== 'admin').map(u => u.id);
      setSelectedUsers(nonAdminIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleSelectAllLeads = (e) => {
    if (e.target.checked) {
      setSelectedLeads(paginatedLeads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev =>
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const confirmBulkDeleteLeads = async () => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', selectedLeads);

    if (!error) {
      loadData();
      setSelectedLeads([]);
      setShowBulkDeleteLeadsConfirm(false);
    } else {
      alert('Error deleting leads: ' + error.message);
    }
  };

  const handleBulkUpdateLeads = async () => {
    if (!bulkEditForm.status && !bulkEditForm.campaign) {
      alert('Please select at least one property to update.');
      return;
    }

    const updates = {};
    if (bulkEditForm.status) updates.status = bulkEditForm.status;
    if (bulkEditForm.campaign) updates.campaign = bulkEditForm.campaign;

    const { error } = await supabase
      .from('leads')
      .update(updates)
      .in('id', selectedLeads);

    if (!error) {
      loadData();
      setSelectedLeads([]);
      setShowBulkEditModal(false);
      setBulkEditForm({ status: '', campaign: '' });
    } else {
      alert('Error updating leads: ' + error.message);
    }
  };

  const confirmBulkDeleteUsers = async () => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .in('id', selectedUsers);

    if (!error) {
      loadData();
      setSelectedUsers([]);
      setShowBulkDeleteConfirm(false);
    } else {
      alert('Error in bulk delete: ' + error.message);
    }
  };

  const resetPassword = (userId) => {
    alert('Password reset requires Supabase Admin privileges or an email reset flow. Please use the Supabase dashboard to reset user passwords for now.');
  };

  const deleteCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (!error) {
        loadData();
      } else {
        alert('Error deleting campaign: ' + error.message);
      }
    }
  };

  const toggleCampaignStatus = async (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    const { error } = await supabase
      .from('campaigns')
      .update({ is_active: !campaign.is_active })
      .eq('id', campaignId);

    if (!error) {
      loadData();
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    if (filters.startDate) {
      filtered = filtered.filter(lead => lead.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(lead => lead.date <= filters.endDate);
    }
    if (filters.agent) {
      filtered = filtered.filter(lead => (lead.ra_name || '').toLowerCase().includes(filters.agent.toLowerCase()));
    }
    if (filters.campaign) {
      filtered = filtered.filter(lead => (lead.campaign || '').toLowerCase().includes(filters.campaign.toLowerCase()));
    }
    if (filters.onlyStale) {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      filtered = filtered.filter(lead => new Date(lead.updated_at) < fortyEightHoursAgo);
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ startDate: '', endDate: '', agent: '', campaign: '' });
    setFilteredLeads(leads);
    setCurrentPage(1);
  };

  const downloadLeads = () => {
    const leadsToDownload = filteredLeads;

    if (leadsToDownload.length === 0) {
      alert('No leads to download.');
      return;
    }

    const headers = [
      'id', 'Date', 'RA Name', 'Campaign', 'Company', 'Salutation', 'First Name', 'Last Name',
      'Email', 'Domain', 'Job Title', 'Department', 'Job Level', 'Job Title Link',
      'Phone', 'Direct Dial', 'Address', 'City', 'State', 'Zip', 'Country',
      'Industry', 'Industry Link', 'Employee Size', 'Associated Members', 'Employee Size Link',
      'Revenue Size', 'Revenue Size Link', 'Tenure', 'VV Status', 'Status', 'RA Comments',
      'Additional Details'
    ];

    const rows = leadsToDownload.map(lead => {
      let customDetails = '';
      if (lead.campaign && lead.custom_question_responses) {
        const campaignObj = campaigns.find(c => c.name === lead.campaign);
        if (campaignObj && campaignObj.custom_questions) {
          customDetails = campaignObj.custom_questions
            .map(q => {
              const answer = lead.custom_question_responses[q.id];
              return answer ? `${q.question}: ${answer}` : null;
            })
            .filter(Boolean)
            .join(' | ');
        }
      }

      return [
        lead.id,
        formatDisplayDate(lead.date),
        lead.ra_name,
        lead.campaign || '',
        lead.company_name,
        lead.salutation,
        lead.first_name,
        lead.last_name,
        lead.email,
        lead.domain,
        lead.job_title,
        lead.department,
        lead.job_level,
        lead.job_title_link,
        lead.phone_no,
        lead.direct_dial,
        lead.address1,
        lead.city,
        lead.state,
        lead.zip_code,
        lead.country,
        lead.industry_type,
        lead.industry_type_link,
        lead.employee_size,
        lead.associated_members || '',
        lead.employee_size_link,
        lead.revenue_size || '',
        lead.revenue_size_link || '',
        lead.tenure || '',
        lead.vv_status || '',
        lead.status,
        lead.ra_comments,
        customDetails
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.map(item => `"${(item || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `admin_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadBreakReport = async () => {
    if (!breakFilters.startDate || !breakFilters.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('breaks_monitoring')
        .select(`
          date,
          total_break_seconds,
          breaks,
          user_id,
          profiles:user_id (name)
        `)
        .gte('date', breakFilters.startDate)
        .lte('date', breakFilters.endDate);

      if (error) throw error;
      if (!data || data.length === 0) {
        alert('No break data found for the selected range');
        return;
      }

      // Flatten the data: one row per break session
      const rows = [['Agent Name', 'Date', 'Start Time', 'End Time', 'Duration', 'Daily Total']];

      data.forEach(record => {
        const agentName = record.profiles?.name || 'Unknown';
        const date = record.date;
        const dailyTotal = formatTime(record.total_break_seconds);

        if (record.breaks && record.breaks.length > 0) {
          record.breaks.forEach(b => {
            const startStr = new Date(b.startTime).toLocaleTimeString();
            const endStr = b.endTime ? new Date(b.endTime).toLocaleTimeString() : 'In Progress';
            const duration = b.durationSeconds
              ? `${Math.floor(b.durationSeconds / 60)}:${(b.durationSeconds % 60).toString().padStart(2, '0')}`
              : (b.duration ? `${b.duration} min` : '-');

            rows.push([agentName, formatDisplayDate(date), startStr, endStr, duration, dailyTotal]);
          });
        } else {
          rows.push([agentName, formatDisplayDate(date), '-', '-', '0:00', dailyTotal]);
        }
      });

      const csvContent = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `break_report_${breakFilters.startDate}_to_${breakFilters.endDate}.csv`;
      a.click();
    } catch (err) {
      console.error('Error downloading break report:', err);
      alert('Failed to generate report: ' + err.message);
    }
  };

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * LEADS_PER_PAGE,
    currentPage * LEADS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card className="p-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'overview' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'leads' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('leads')}
          >
            <Users className="w-4 h-4 mr-2" />
            All Leads
          </Button>
          <Button
            variant={activeTab === 'users' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('users')}
          >
            <Shield className="w-4 h-4 mr-2" />
            Manage Users
          </Button>
          <Button
            variant={activeTab === 'campaigns' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('campaigns')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Campaigns
          </Button>
          <Button
            variant={activeTab === 'breaks' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('breaks')}
          >
            <Coffee className="w-4 h-4 mr-2" />
            Break Monitoring
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('reports')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance Reports
          </Button>
        </div>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-white border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Qualified</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.qualified}</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Disqualified</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.disqualified}</p>
                </div>
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Active Breaks</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {allBreaks.filter(b => b.current_break_start).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">User Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Users</span>
                  <span className="font-bold text-gray-900">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Employees</span>
                  <span className="font-bold text-gray-900">{stats.employees}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">QA Users</span>
                  <span className="font-bold text-gray-900">{stats.qaUsers}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-purple-600 font-semibold">Agents on Break</span>
                  <span className="font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                    {allBreaks.filter(b => b.current_break_start).length}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Lead Conversion Rate</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Qualification Rate</span>
                  <span className="font-bold text-green-600">
                    {stats.totalLeads > 0 ? ((stats.qualified / stats.totalLeads) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Disqualification Rate</span>
                  <span className="font-bold text-red-600">
                    {stats.totalLeads > 0 ? ((stats.disqualified / stats.totalLeads) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* All Leads Tab */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
              <Input
                label="Agent Name"
                value={filters.agent}
                onChange={(e) => setFilters({ ...filters, agent: e.target.value })}
                placeholder="Search by agent name"
              />
              <SearchableSelect
                label="Campaign Name"
                value={filters.campaign}
                onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
                placeholder="Search campaign..."
                options={campaigns.filter(c => c.is_active).map(c => ({ value: c.name, label: c.name }))}
              />
              <div className="flex items-end gap-2 md:col-span-4 lg:col-span-1">
                <Button
                  onClick={applyFilters}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transform transition-all hover:-translate-y-0.5 flex items-center justify-center whitespace-nowrap"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Apply
                </Button>
                <Button
                  variant={filters.onlyStale ? 'primary' : 'secondary'}
                  onClick={() => {
                    const nextStale = !filters.onlyStale;
                    setFilters({ ...filters, onlyStale: nextStale });
                  }}
                  title="Stale Leads (>48h)"
                  className={filters.onlyStale ? 'bg-red-50 text-red-600 border-red-200' : ''}
                >
                  <AlertTriangle className={`w-4 h-4 ${filters.onlyStale ? 'animate-pulse' : ''}`} />
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleClearFilters}
                  title="Clear Filters"
                  className="px-3"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="secondary" onClick={downloadLeads} title="Download filtered leads">
                  <Download className="w-4 h-4" />
                </Button>
                <Button onClick={() => setShowUploadModal(true)} title="Upload Leads" className="px-3">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Bulk Actions */}
          {selectedLeads.length > 0 && (
            <Card className="p-4 bg-indigo-50 border-indigo-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm font-semibold text-indigo-900">
                {selectedLeads.length} lead(s) selected
              </p>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => setShowBulkEditModal(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Modify Selected
                </Button>
                <Button variant="danger" onClick={() => setShowBulkDeleteLeadsConfirm(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden border-none shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5">
                      <input
                        type="checkbox"
                        onChange={handleSelectAllLeads}
                        checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedLeads.map(lead => {
                    const isStale = new Date(lead.updated_at) < new Date(Date.now() - 48 * 60 * 60 * 1000);
                    return (
                      <tr key={lead.id} className={`hover:bg-gray-50 transition-colors ${isStale ? 'bg-red-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => handleSelectLead(lead.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDisplayDate(lead.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.campaign || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.ra_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.company_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 inline-flex text-[11px] leading-4 font-bold rounded-xl border ${lead.status === 'qualified' ? 'bg-green-50 text-green-700 border-green-100' :
                            lead.status === 'disqualified' ? 'bg-red-50 text-red-700 border-red-100' :
                              'bg-yellow-50 text-yellow-700 border-yellow-100'
                            } uppercase`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3">
                            {isStale && (
                              <AlertTriangle
                                className="w-4 h-4 text-red-500 animate-pulse"
                                title="Lead hasn't been updated in >48 hours"
                              />
                            )}
                            <button
                              onClick={() => { setEditingLead(lead); setShowEditLeadModal(true); }}
                              className="text-indigo-600 hover:text-indigo-700"
                              title="Edit Lead"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * LEADS_PER_PAGE) + 1} to {Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} leads
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
          {/* Edit Lead Modal */}
          {
            showEditLeadModal && (
              <UploadLeadModal
                onClose={() => { setShowEditLeadModal(false); setEditingLead(null); }}
                onSuccess={() => { loadData(); setShowEditLeadModal(false); setEditingLead(null); }}
                employeeId={editingLead?.employee_id}
                employeeName={editingLead?.ra_name}
                leadToEdit={editingLead}
              />
            )
          }
          {/* Upload Modal */}
          {
            showUploadModal && (
              <UploadLeadModal
                onClose={() => setShowUploadModal(false)}
                onSuccess={loadData}
                employeeId={'admin'}
                employeeName={'Admin'}
              />
            )
          }
          {/* Bulk Delete Confirmation Modal */}
          {
            showBulkDeleteLeadsConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
                <Card className="w-full max-w-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Bulk Delete</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete these {selectedLeads.length} leads? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setShowBulkDeleteLeadsConfirm(false)}>
                      Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmBulkDeleteLeads}>
                      Delete Selected
                    </Button>
                  </div>
                </Card>
              </div>
            )
          }
        </div >
      )}

      {/* Manage Users Tab */}
      {
        activeTab === 'users' && (
          <>
            <div className="flex justify-end gap-2">
              {selectedUsers.length > 0 && (
                <Button variant="danger" onClick={() => setShowBulkDeleteConfirm(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedUsers.length})
                </Button>
              )}
              <Button onClick={() => { setEditingUser(null); setShowUserModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <tr>
                      <th className="px-6 py-4">
                        <input
                          type="checkbox"
                          onChange={handleSelectAllUsers}
                          checked={users.some(u => u.role !== 'admin') && selectedUsers.length === users.filter(u => u.role !== 'admin').length}
                          disabled={!users.some(u => u.role !== 'admin')}
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            disabled={user.role === 'admin'}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'qa' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setEditingUser(user); setShowUserModal(true); }}
                              className="text-indigo-600 hover:text-indigo-700"
                              title="Edit User"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => resetPassword(user.id)}
                              className="text-yellow-600 hover:text-yellow-700"
                              title="Reset Password"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => initiateDeleteUser(user)}
                              className="text-red-600 hover:text-red-700"
                              disabled={user.role === 'admin'}
                              title="Delete User"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {showUserModal && (
              <UserModal
                user={editingUser}
                onClose={() => setShowUserModal(false)}
                onSuccess={loadData}
              />
            )}

            {showAdminBreakHistory && selectedUserForBreaks && (
              <AdminBreakHistoryModal
                user={selectedUserForBreaks}
                onClose={() => setShowAdminBreakHistory(false)}
              />
            )}

            <ConfirmationModal
              isOpen={deleteConfirmation.isOpen}
              onClose={() => setDeleteConfirmation({ isOpen: false, userId: null, userName: '' })}
              onConfirm={confirmDeleteUser}
              title="Delete User"
              message={`Are you sure you want to delete user "${deleteConfirmation.userName}"? This action cannot be undone.`}
            />

            <ConfirmationModal
              isOpen={showBulkDeleteConfirm}
              onClose={() => setShowBulkDeleteConfirm(false)}
              onConfirm={confirmBulkDeleteUsers}
              title="Bulk Delete Users"
              message={`Are you sure you want to delete ${selectedUsers.length} selected users? This action cannot be undone.`}
            />

            {showBulkEditModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
                <Card className="w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Modify {selectedLeads.length} Leads</h3>
                    <button onClick={() => setShowBulkEditModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={bulkEditForm.status}
                        onChange={(e) => setBulkEditForm({ ...bulkEditForm, status: e.target.value })}
                      >
                        <option value="">No Change</option>
                        <option value="pending">Pending</option>
                        <option value="qualified">Qualified</option>
                        <option value="disqualified">Disqualified</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Campaign</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={bulkEditForm.campaign}
                        onChange={(e) => setBulkEditForm({ ...bulkEditForm, campaign: e.target.value })}
                      >
                        <option value="">No Change</option>
                        {campaigns.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <Button variant="secondary" onClick={() => setShowBulkEditModal(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleBulkUpdateLeads}>
                      Apply Changes
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </>
        )
      }

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 h-[500px]">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                Campaign Conversion Rates (%)
              </h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart
                  data={campaigns.map(c => {
                    const cLeads = leads.filter(l => l.campaign === c.name);
                    const qualified = cLeads.filter(l => l.status === 'qualified').length;
                    return {
                      name: c.name,
                      rate: cLeads.length > 0 ? parseFloat(((qualified / cLeads.length) * 100).toFixed(1)) : 0
                    };
                  })}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Conversion Rate']}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {campaigns.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 h-[500px]">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Leads Volume by Campaign
              </h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart
                  data={campaigns.map(c => ({
                    name: c.name,
                    total: leads.filter(l => l.campaign === c.name).length
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Performance Stats</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Campaign</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Total Leads</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Qualified</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Disqualified</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Conversion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map(c => {
                    const cLeads = leads.filter(l => l.campaign === c.name);
                    const qCount = cLeads.filter(l => l.status === 'qualified').length;
                    const dCount = cLeads.filter(l => l.status === 'disqualified').length;
                    const rate = cLeads.length > 0 ? ((qCount / cLeads.length) * 100).toFixed(1) : 0;
                    return (
                      <tr key={c.id}>
                        <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 text-gray-600">{cLeads.length}</td>
                        <td className="px-6 py-4 text-green-600 font-semibold">{qCount}</td>
                        <td className="px-6 py-4 text-red-600">{dCount}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-100 rounded-full h-2">
                              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${rate}%` }}></div>
                            </div>
                            <span className="text-sm font-bold">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Break Monitoring Tab */}
      {
        activeTab === 'breaks' && (
          <Card className="overflow-hidden border-none shadow-sm">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Real-time Break Monitoring</h3>
              <p className="text-sm text-gray-600">Monitor all agents' current break status and total break time for today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50/50 border-b border-gray-200">
              <Card className="p-4 bg-white border-indigo-100 flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Agents</p>
                  <p className="text-2xl font-bold text-indigo-900">{users.filter(u => u.role === 'employee').length}</p>
                </div>
              </Card>
              <Card className="p-4 bg-white border-green-100 flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Today</p>
                  <p className="text-2xl font-bold text-green-900">{allBreaks.length}</p>
                </div>
              </Card>
              <Card className="p-4 bg-white border-purple-100 flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Coffee className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">On Break Now</p>
                  <p className="text-2xl font-bold text-purple-900">{allBreaks.filter(b => b.current_break_start).length}</p>
                </div>
              </Card>
            </div>

            <div className="p-6 bg-white border-b border-gray-200">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Input
                    label="Start Date"
                    type="date"
                    value={breakFilters.startDate}
                    onChange={(e) => setBreakFilters({ ...breakFilters, startDate: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label="End Date"
                    type="date"
                    value={breakFilters.endDate}
                    onChange={(e) => setBreakFilters({ ...breakFilters, endDate: e.target.value })}
                  />
                </div>
                <Button
                  onClick={downloadBreakReport}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center mb-0.5"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Agent Name</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total Break Time</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.filter(u => u.role === 'employee').map(user => {
                    const userBreakRecord = allBreaks.find(b => b.user_id === user.id) || {
                      total_break_seconds: 0,
                      current_break_start: null,
                      breaks: []
                    };
                    const isOnBreak = !!userBreakRecord.current_break_start;
                    const totalSecs = userBreakRecord.total_break_seconds || 0;

                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOnBreak ? (
                            <div className="flex flex-col">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 animate-pulse w-fit">
                                On Break
                              </span>
                              <span className="text-[10px] text-purple-600 mt-1 font-mono">
                                Start: {new Date(userBreakRecord.current_break_start).toLocaleTimeString()}
                              </span>
                            </div>
                          ) : (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Available
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold">{formatTime(totalSecs)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => { setSelectedUserForBreaks(user); setShowAdminBreakHistory(true); }}
                            className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View History
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {showAdminBreakHistory && selectedUserForBreaks && (
              <AdminBreakHistoryModal
                user={selectedUserForBreaks}
                onClose={() => setShowAdminBreakHistory(false)}
              />
            )}
          </Card>
        )
      }

      {/* Campaigns Tab */}
      {
        activeTab === 'campaigns' && (
          <>
            <div className="flex justify-end">
              <Button onClick={() => { setEditingCampaign(null); setShowCampaignModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>

            <Card className="overflow-hidden border-none shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign Name</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created Date</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {campaigns.map(campaign => (
                      <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{campaign.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{campaign.createdBy}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDisplayDate(campaign.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleCampaignStatus(campaign.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${campaign.isActive ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            title={campaign.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <span
                              className={`${campaign.isActive ? 'translate-x-6' : 'translate-x-1'
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setEditingCampaign(campaign); setShowCampaignModal(true); }}
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => toggleCampaignStatus(campaign.id)}
                              className="text-yellow-600 hover:text-yellow-700"
                              title={campaign.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteCampaign(campaign.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {showCampaignModal && (
              <CampaignModal
                campaign={editingCampaign}
                onClose={() => setShowCampaignModal(false)}
                onSuccess={loadData}
              />
            )}
          </>
        )
      }
    </div >
  );
};

// User Modal Component
const UserModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(
    user ? { ...user } : { name: '', username: '', password: '', role: 'employee' }
  );
  const [showPassword, setShowPassword] = useState(false);

  const { createUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user) {
      // Edit existing user profile
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          role: formData.role
        })
        .eq('id', user.id);

      if (error) {
        alert('Error updating profile: ' + error.message);
        return;
      }
    } else {
      // Add new user via Auth
      // Enforce @ovmkr.site domain if not present
      let finalEmail = formData.username.trim();
      if (!finalEmail.includes('@')) {
        finalEmail = `${finalEmail}@ovmkr.site`;
      }

      // Use createUser to avoid changing the current session
      const result = await createUser({
        ...formData,
        username: finalEmail
      });
      if (!result.success) {
        alert('Error adding user: ' + result.error);
        return;
      }
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {user ? 'Edit User' : 'Add User'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            placeholder="username@ovmkr.site"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />

          {!user && (
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'employee', label: 'Employee' },
              { value: 'qa', label: 'QA' },
              { value: 'admin', label: 'Admin' }
            ]}
          />

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">
              {user ? 'Update User' : 'Add User'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end gap-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="danger" onClick={onConfirm}>Delete</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Campaign Modal Component
const CampaignModal = ({ campaign, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState(
    campaign ? { ...campaign } : { name: '', description: '', isActive: true, customQuestions: [] }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (campaign) {
      // Edit existing campaign
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: formData.name,
          description: formData.description,
          is_active: formData.isActive,
          custom_questions: formData.customQuestions
        })
        .eq('id', campaign.id);

      if (error) {
        alert('Error updating campaign: ' + error.message);
        return;
      }
    } else {
      // Add new campaign
      const { error } = await supabase
        .from('campaigns')
        .insert({
          name: formData.name,
          description: formData.description,
          is_active: formData.isActive,
          custom_questions: formData.customQuestions,
          created_by: currentUser.name
        });

      if (error) {
        alert('Error creating campaign: ' + error.message);
        return;
      }
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {campaign ? 'Edit Campaign' : 'Create Campaign'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <Input
            label="Campaign Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Enter campaign name"
          />


          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Custom Questions ({formData.customQuestions?.length || 0}/10)
              </label>
              {(formData.customQuestions?.length || 0) < 10 && (
                <button
                  type="button"
                  onClick={() => {
                    const newQuestions = [...(formData.customQuestions || [])];
                    newQuestions.push({ id: Date.now(), question: '', order: newQuestions.length + 1 });
                    setFormData({ ...formData, customQuestions: newQuestions });
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  + Add Question
                </button>
              )}
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {formData.customQuestions?.map((q, index) => (
                <div key={q.id} className="flex gap-2">
                  <Input
                    value={q.question}
                    onChange={(e) => {
                      const newQuestions = [...formData.customQuestions];
                      newQuestions[index].question = e.target.value;
                      setFormData({ ...formData, customQuestions: newQuestions });
                    }}
                    placeholder={`Question ${index + 1}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newQuestions = formData.customQuestions.filter((_, i) => i !== index);
                      setFormData({ ...formData, customQuestions: newQuestions });
                    }}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!formData.customQuestions || formData.customQuestions.length === 0) && (
                <p className="text-sm text-gray-500 italic">No custom questions added.</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm font-semibold text-gray-700">Active Campaign</span>
            </label>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">
              {campaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Change Password Modal Component
const ChangePasswordModal = ({ user, onClose }) => {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters (Supabase requirement)");
      return;
    }

    // Supabase updateUser only updates the current user's password
    const { error } = await supabase.auth.updateUser({
      password: formData.newPassword
    });

    if (error) {
      setError(error.message);
    } else {
      alert('Password changed successfully');
      onClose();
    }
  };

  const toggleShow = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="relative">
            <Input
              label="Current Password"
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => toggleShow('current')}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="New Password"
              type={showPasswords.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => toggleShow('new')}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showPasswords.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => toggleShow('confirm')}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">
              Change Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Main Layout
const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 transition-all duration-300">
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
                <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-600">{currentUser.username}</p>
              </div>
              <Button variant="secondary" onClick={() => setShowChangePassword(true)} title="Change Password" className="px-3">
                <Key className="w-4 h-4" />
              </Button>
              <Button
                onClick={logout}
                className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all duration-300 shadow-sm hover:shadow-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentUser.role === 'employee' && <EmployeeDashboard />}
        {currentUser.role === 'qa' && <QADashboard />}
        {currentUser.role === 'admin' && <AdminDashboard />}
      </main>

      {showChangePassword && (
        <ChangePasswordModal
          user={currentUser}
          onClose={() => setShowChangePassword(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Lead Manager Pro</span>
            </div>
            <p className="text-gray-400 text-xs font-medium">
              © 2026 Outvying Global. All rights reserved.
            </p>
            <div className="flex gap-6">
              <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main App Component
const AppContent = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if Supabase initialized correctly
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const isSupabaseReady = url && url.startsWith('https://');
  const isKeyValid = key && (key.startsWith('eyJ') || key.startsWith('sb_publishable_') || key.length > 40);

  if (!isSupabaseReady || !isKeyValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <Card className="max-w-md p-8 border-red-200">
          <h2 className="text-xl font-bold text-red-700 mb-4">Configuration Error</h2>
          <p className="text-gray-700 mb-4">
            {!isSupabaseReady
              ? 'The Supabase URL is missing or invalid.'
              : 'The Supabase Anon Key looks incorrect.'}
          </p>
          <div className="bg-gray-100 p-3 rounded font-mono text-xs mb-4 overflow-auto max-h-40">
            Detected URL: {url ? (url.substring(0, 15) + '...') : 'MISSING'}<br />
            Detected Key: {key ? (key.substring(0, 5) + '...') : 'MISSING'}<br />
            <br />
            Available REACT_APP_ keys:<br />
            {Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')).join(', ') || 'NONE'}
          </div>
          <p className="text-sm text-gray-500">
            Ensure you added variables to Vercel and then <strong>Redeployed</strong>.
          </p>
        </Card>
      </div>
    );
  }

  return currentUser ? <MainLayout /> : <LoginPage />;
};

const App = () => {
  // CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes blob {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
    }
    .animate-blob {
      animation: blob 7s infinite;
    }
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    .animation-delay-4000 {
      animation-delay: 4s;
    }
  `;
  document.head.appendChild(style);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

// Default export
export default App;

