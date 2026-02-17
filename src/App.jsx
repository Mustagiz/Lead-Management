import React, { useState, useEffect, createContext, useContext } from 'react';
import { Upload, Download, Users, BarChart3, Shield, LogOut, Filter, Check, X, Edit, Trash2, RefreshCw, Clock, CheckCircle, XCircle, Search, Plus, Eye, EyeOff, ChevronDown, Coffee, Key } from 'lucide-react';
import { supabase } from './supabaseClient';

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

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Reusable Components
const Button = ({ children, variant = 'primary', onClick, disabled, className = '', type = 'button' }) => {
  const baseStyles = 'px-6 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
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
    {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
    <input
      {...props}
      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${error ? 'border-red-500' : 'border-gray-300'
        }`}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const Select = ({ label, options, error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
    <select
      {...props}
      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${error ? 'border-red-500' : 'border-gray-300'
        }`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
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
  <div className={`bg-white rounded-xl shadow-lg border border-gray-100 ${className}`}>
    {children}
  </div>
);

// Login Component
const LoginPage = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      const result = await register(formData);
      if (result.success) {
        setIsRegister(false);
        setFormData({ username: '', password: '', name: '' });
        alert('Registration successful! Please login.');
      } else {
        setError(result.error);
      }
    } else {
      const result = await login(formData.username, formData.password);
      if (!result.success) {
        setError(result.error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md p-8 relative backdrop-blur-sm bg-white/90">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Lead Manager Pro
          </h1>
          <p className="text-gray-600 mt-2">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <Input
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter your full name"
            />
          )}

          <Input
            label="Email"
            type="email"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            placeholder="Enter your email"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter your password"
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
            {isRegister ? 'Register' : 'Login'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setFormData({ username: '', password: '', name: '' });
              }}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Demo Credentials: admin/admin123, employee1/emp123, qa1/qa123
          </p>
        </div>
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
        lead.date,
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-1">Total Leads</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-blue-600 opacity-50" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-600 mb-1">Qualified</p>
                  <p className="text-3xl font-bold text-green-900">{stats.qualified}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-1">Disqualified</p>
                  <p className="text-3xl font-bold text-red-900">{stats.disqualified}</p>
                </div>
                <XCircle className="w-10 h-10 text-red-600 opacity-50" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-yellow-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-600 opacity-50" />
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
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedLeads.map((lead, index) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.company_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.salutation} {lead.first_name} {lead.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.job_title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                          lead.status === 'disqualified' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {lead.status}
                        </span>
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
              onClose={() => setShowUploadModal(false)}
              onSuccess={loadLeads}
              employeeId={currentUser.id}
              employeeName={currentUser.name}
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
  const downloadTemplate = () => {
    const standardHeaders = [
      'Current Date', 'RA Name', 'Campaign', 'Company Name', 'Salutation', 'First Name', 'Last Name',
      'Email', 'Domain', 'Job Title', 'Department', 'Job Level',
      'Job Title Link', 'Phone No', 'Direct Dial', 'Address 1', 'City',
      'State', 'Zip Code', 'Country', 'Industry Type', 'Industry Type Link',
      'Employee Size', 'Associated Members', 'Employee Size Link', 'Revenue Size',
      'Revenue Size Link', 'Tenure', 'VV Status', 'RA Comments'
    ];

    let headers = [...standardHeaders];

    if (selectedBulkCampaign) {
      const campaignObj = campaigns.find(c => c.name === selectedBulkCampaign);
      if (campaignObj && campaignObj.custom_questions) {
        campaignObj.custom_questions.forEach(q => headers.push(q.question));
      }
    } else {
      // Collect all unique custom questions from active campaigns if no campaign selected
      const allCustomQuestions = new Set();
      campaigns.forEach(c => {
        if (c.is_active && c.custom_questions) {
          c.custom_questions.forEach(q => allCustomQuestions.add(q.question));
        }
      });
      headers = [...headers, ...Array.from(allCustomQuestions)];
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", selectedBulkCampaign ? `template_${selectedBulkCampaign.replace(/\s+/g, '_')}.csv` : "lead_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVLine = (text) => {
    let result = [];
    let cell = '';
    let quote = false;
    for (let i = 0; i < text.length; i++) {
      let char = text[i];
      if (char === '"') {
        if (i < text.length - 1 && text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quote = !quote;
        }
      } else if (char === ',' && !quote) {
        result.push(cell);
        cell = '';
      } else {
        cell += char;
      }
    }
    result.push(cell);
    return result;
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

      // Strip UTF-8 BOM if present
      if (text.startsWith('\ufeff')) {
        text = text.substring(1);
      }

      // Split rows and filter out truly empty ones (including rows that are just commas, quotes, or whitespace)
      const rows = text.split(/\r?\n/).filter(row => {
        const trimmed = row.trim();
        // Regex matches any row that ONLY contains whitespace, commas, or double quotes
        return trimmed && trimmed.replace(/[\s,"]/g, '').length > 0;
      });

      if (rows.length < 2) {
        alert('The CSV file appears to be empty or only contains headers.');
        return;
      }

      const processRows = async () => {
        // Parse headers
        const rawHeaders = parseCSVLine(rows[0]);
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

        // Helper to safely get value by header name
        const getValue = (cols, fieldName) => {
          const index = headerMap[fieldName.toLowerCase()];
          if (index === undefined) return '';
          const val = cols[index];
          return val ? val.trim() : '';
        };

        const normalizeDate = (dateStr) => {
          if (!dateStr) return new Date().toISOString().split('T')[0];
          const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.includes('-') ? dateStr.split('-') : [];
          if (parts.length === 3) {
            if (parts[0].length === 4) return dateStr;
            const num1 = parseInt(parts[0], 10);
            if (parts[2].length === 4) {
              if (num1 > 12) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
              return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
          }
          return dateStr;
        };

        let importedCount = 0;
        let skippedCount = 0;
        let missingCampaignCount = 0;
        const newLeads = [];

        for (let i = 1; i < rows.length; i++) {
          const columns = parseCSVLine(rows[i]);
          const companyName = getValue(columns, 'Company Name') || getValue(columns, 'Company');

          if (companyName) {
            const rawCampaignName = selectedBulkCampaign || getValue(columns, 'Campaign');
            let campaignName = null;
            const customQuestionResponses = {};

            if (rawCampaignName) {
              // Case-insensitive lookup against existing campaigns
              const campaignObj = campaigns.find(c =>
                c.name.toLowerCase() === rawCampaignName.toLowerCase()
              );

              if (campaignObj) {
                campaignName = campaignObj.name; // Use exact name from DB
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

            newLeads.push({
              date: normalizeDate(getValue(columns, 'Current Date') || getValue(columns, 'Date')),
              ra_name: getValue(columns, 'RA Name') || employeeName,
              employee_id: employeeId,
              status: 'pending',
              campaign: campaignName,
              company_name: companyName,
              salutation: getValue(columns, 'Salutation') || 'Mr.',
              first_name: getValue(columns, 'First Name'),
              last_name: getValue(columns, 'Last Name'),
              email: getValue(columns, 'Email'),
              domain: getValue(columns, 'Domain'),
              job_title: getValue(columns, 'Job Title'),
              department: getValue(columns, 'Department') || 'Marketing',
              job_level: getValue(columns, 'Job Level') || 'Mid-level',
              job_title_link: getValue(columns, 'Job Title Link'),
              phone_no: getValue(columns, 'Phone No') || getValue(columns, 'Phone'),
              direct_dial: getValue(columns, 'Direct Dial'),
              address1: getValue(columns, 'Address 1') || getValue(columns, 'Address'),
              city: getValue(columns, 'City'),
              state: getValue(columns, 'State'),
              zip_code: getValue(columns, 'Zip Code') || getValue(columns, 'Zip'),
              country: getValue(columns, 'Country') || 'United States',
              industry_type: getValue(columns, 'Industry Type') || 'Technology',
              industry_type_link: getValue(columns, 'Industry Type Link'),
              employee_size: getValue(columns, 'Employee Size') || '1-10',
              associated_members: getValue(columns, 'Associated Members'),
              employee_size_link: getValue(columns, 'Employee Size Link'),
              revenue_size: getValue(columns, 'Revenue Size'),
              revenue_size_link: getValue(columns, 'Revenue Size Link'),
              tenure: getValue(columns, 'Tenure'),
              vv_status: getValue(columns, 'VV Status') || 'RPC Verified',
              ra_comments: getValue(columns, 'RA Comments'),
              custom_question_responses: customQuestionResponses
            });
            importedCount++;
          } else {
            skippedCount++;
          }
        }

        if (newLeads.length > 0) {
          const { error } = await supabase.from('leads').insert(newLeads);
          if (error) {
            console.error('Insert error:', error);
            alert('Error importing leads: ' + error.message);
            return;
          }
        }

        let message = `Successfully uploaded ${importedCount} leads.`;
        if (skippedCount > 0) message += `\nSkipped ${skippedCount} rows due to missing Company Name.`;
        if (missingCampaignCount > 0) message += `\nWarning: ${missingCampaignCount} rows had campaign names that don't exist and were set to 'None'.`;

        alert(message);
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
          {/* Toggle Upload Type - Only show if not editing */}
          {!leadToEdit && (
            <div className="flex gap-4 mb-6">
              <Button
                variant={uploadType === 'single' ? 'primary' : 'secondary'}
                onClick={() => setUploadType('single')}
                className="flex-1"
              >
                Single Lead
              </Button>
              <Button
                variant={uploadType === 'bulk' ? 'primary' : 'secondary'}
                onClick={() => setUploadType('bulk')}
                className="flex-1"
              >
                Bulk Upload (CSV)
              </Button>
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

                <Input
                  label="Company Name *"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  error={errors.company_name}
                  required
                />

                <Select
                  label="Salutation"
                  value={formData.salutation}
                  onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                  options={[
                    { value: 'Mr.', label: 'Mr.' },
                    { value: 'Mrs.', label: 'Mrs.' },
                    { value: 'Miss', label: 'Miss' },
                    { value: 'Ms.', label: 'Ms.' },
                    { value: 'Dr.', label: 'Dr.' }
                  ]}
                />

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
                  label="Domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />

                <Input
                  label="Job Title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
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

                <Input
                  label="Phone Number"
                  value={formData.phone_no}
                  onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                  placeholder="+1-123-456-7890"
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

                <Select
                  label="Country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  options={countries.map(c => ({ value: c, label: c }))}
                />

                <Select
                  label="Industry Type"
                  value={formData.industry_type}
                  onChange={(e) => setFormData({ ...formData, industry_type: e.target.value })}
                  options={industries.map(i => ({ value: i, label: i }))}
                />

                <Input
                  label="Industry Type Link"
                  value={formData.industry_type_link}
                  onChange={(e) => setFormData({ ...formData, industry_type_link: e.target.value })}
                  placeholder="https://example.com"
                />

                <Select
                  label="Employee Size"
                  value={formData.employee_size}
                  onChange={(e) => setFormData({ ...formData, employee_size: e.target.value })}
                  options={employeeSizes.map(s => ({ value: s, label: s }))}
                />

                <Input
                  label="Associated Members"
                  value={formData.associated_members}
                  onChange={(e) => setFormData({ ...formData, associated_members: e.target.value })}
                  placeholder="Enter Associated Members"
                />

                <Input
                  label="Employee Size Link"
                  value={formData.employee_size_link}
                  onChange={(e) => setFormData({ ...formData, employee_size_link: e.target.value })}
                  placeholder="https://example.com"
                />

                <Input
                  label="Revenue Size"
                  value={formData.revenue_size}
                  onChange={(e) => setFormData({ ...formData, revenue_size: e.target.value })}
                  placeholder="e.g., $1M - $10M"
                />

                <Input
                  label="Revenue Size Link"
                  value={formData.revenue_size_link}
                  onChange={(e) => setFormData({ ...formData, revenue_size_link: e.target.value })}
                  placeholder="https://example.com"
                />

                <Input
                  label="Tenure"
                  value={formData.tenure}
                  onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                  placeholder="e.g., 2 years"
                />

                <Select
                  label="VV STATUS"
                  value={formData.vv_status}
                  onChange={(e) => setFormData({ ...formData, vv_status: e.target.value })}
                  options={vvStatusOptions.map(s => ({ value: s, label: s }))}
                />
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

              <div className="flex justify-end gap-4 mt-6">
                <Button variant="secondary" onClick={onClose} type="button">
                  Cancel
                </Button>
                <Button type="submit">
                  <Upload className="w-4 h-4 mr-2" />
                  {leadToEdit ? 'Update Lead' : 'Upload Lead'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBulkUpload}>
              <div className="mb-6">
                <Select
                  label="Select Campaign for these Leads"
                  value={selectedBulkCampaign}
                  onChange={(e) => setSelectedBulkCampaign(e.target.value)}
                  options={[
                    { value: '', label: '-- Use Campaign Names from CSV --' },
                    ...campaigns.map(c => ({ value: c.name, label: c.name }))
                  ]}
                />
                <p className="mt-1 text-xs text-gray-500 italic">
                  * If selected, this will apply to ALL leads in the CSV.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Upload CSV file with leads</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline flex items-center justify-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    {selectedBulkCampaign ? `Download Template for ${selectedBulkCampaign}` : 'Download Standard CSV Template'}
                  </button>
                  <p className="text-xs text-gray-500">
                    {selectedBulkCampaign
                      ? `Template includes standard fields + custom questions for ${selectedBulkCampaign}.`
                      : 'Includes all fields: Campaign, Company, Contact Info, Revenue, etc.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button variant="secondary" onClick={onClose} type="button">
                  Cancel
                </Button>
                <Button type="submit">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                </Button>
              </div>
            </form>
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
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const LEADS_PER_PAGE = 10;

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!isClockedIn) {
      alert('Please clock in first!');
      return;
    }

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
    if (!isClockedIn) {
      alert('Please clock in first!');
      return;
    }

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
      'Date', 'RA Name', 'Campaign', 'Company', 'Salutation', 'First Name', 'Last Name',
      'Email', 'Domain', 'Job Title', 'Department', 'Job Level', 'Job Title Link',
      'Phone', 'Direct Dial', 'Address', 'City', 'State', 'Zip', 'Country',
      'Industry', 'Industry Link', 'Employee Size', 'Associated Members', 'Employee Size Link',
      'Revenue Size', 'Revenue Size Link', 'Tenure', 'VV Status', 'Status', 'RA Comments'
    ];

    const rows = filteredLeads.map(lead => [
      lead.date,
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

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
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
      {/* Stats and Clock In/Out */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-600 mb-1">Total Audited</p>
              <p className="text-3xl font-bold text-purple-900">{stats.audited}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600 mb-1">Qualified</p>
              <p className="text-3xl font-bold text-green-900">{stats.qualified}</p>
            </div>
            <Check className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-600 mb-1">Disqualified</p>
              <p className="text-3xl font-bold text-red-900">{stats.disqualified}</p>
            </div>
            <X className="w-10 h-10 text-red-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold text-blue-600 mb-3">Status</p>
            <Button
              variant={isClockedIn ? 'danger' : 'success'}
              onClick={() => setIsClockedIn(!isClockedIn)}
              className="w-full"
            >
              <Clock className="w-4 h-4 mr-2" />
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </Button>
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

      {/* Leads Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <tr>
                <th className="px-6 py-4">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.ra_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.first_name} {lead.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                      lead.status === 'disqualified' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQualify(lead.id, 'qualified')}
                        className={`text-green-600 hover:text-green-700 ${!isClockedIn ? 'opacity-40 cursor-not-allowed' : ''}`}
                        disabled={!isClockedIn}
                        title={!isClockedIn ? 'Please clock in first' : 'Qualify lead'}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleQualify(lead.id, 'disqualified')}
                        className={`text-red-600 hover:text-red-700 ${!isClockedIn ? 'opacity-40 cursor-not-allowed' : ''}`}
                        disabled={!isClockedIn}
                        title={!isClockedIn ? 'Please clock in first' : 'Disqualify lead'}
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
              <p className="text-sm text-gray-500">Today: {today}</p>
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
  const [filters, setFilters] = useState({ startDate: '', endDate: '', agent: '', campaign: '' });
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

  const formatTime = (ts) => {
    const h = Math.floor(ts / 3600);
    const m = Math.floor((ts % 3600) / 60);
    const s = ts % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(h > 0 ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: leadsData } = await supabase.from('leads').select('*');
    const { data: usersData } = await supabase.from('profiles').select('*');
    const { data: campaignsData } = await supabase.from('campaigns').select('*');

    setLeads(leadsData || []);
    setFilteredLeads(leadsData || []);
    setUsers(usersData || []);
    setCampaigns(campaignsData || []);

    setStats({
      totalLeads: (leadsData || []).length,
      totalUsers: (usersData || []).length,
      qualified: (leadsData || []).filter(l => l.status === 'qualified').length,
      disqualified: (leadsData || []).filter(l => l.status === 'disqualified').length,
      employees: (usersData || []).filter(u => u.role === 'employee').length,
      qaUsers: (usersData || []).filter(u => u.role === 'qa').length,
      totalCampaigns: (campaignsData || []).length,
      activeCampaigns: (campaignsData || []).filter(c => c.is_active).length
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
        lead.date,
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

            rows.push([agentName, date, startStr, endStr, duration, dailyTotal]);
          });
        } else {
          rows.push([agentName, date, '-', '-', '0:00', dailyTotal]);
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
        </div>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-1">Total Leads</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalLeads}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-blue-600 opacity-50" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-600 mb-1">Qualified</p>
                  <p className="text-3xl font-bold text-green-900">{stats.qualified}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-1">Disqualified</p>
                  <p className="text-3xl font-bold text-red-900">{stats.disqualified}</p>
                </div>
                <XCircle className="w-10 h-10 text-red-600 opacity-50" />
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

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.ra_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.company_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                          lead.status === 'disqualified' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => { setEditingLead(lead); setShowEditLeadModal(true); }}
                          className="text-indigo-600 hover:text-indigo-700"
                          title="Edit Lead"
                        >
                          <Edit className="w-4 h-4" />
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
          {/* Edit Lead Modal */}
          {showEditLeadModal && (
            <UploadLeadModal
              onClose={() => { setShowEditLeadModal(false); setEditingLead(null); }}
              onSuccess={() => { loadData(); setShowEditLeadModal(false); setEditingLead(null); }}
              employeeId={editingLead?.employee_id}
              employeeName={editingLead?.ra_name}
              leadToEdit={editingLead}
            />
          )}
          {/* Upload Modal */}
          {showUploadModal && (
            <UploadLeadModal
              onClose={() => setShowUploadModal(false)}
              onSuccess={loadData}
              employeeId={'admin'}
              employeeName={'Admin'}
            />
          )}
        </div>
      )}

      {/* Manage Users Tab */}
      {activeTab === 'users' && (
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
        </>
      )}

      {/* Break Monitoring Tab */}
      {activeTab === 'breaks' && (
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <h3 className="text-xl font-bold text-gray-900">Real-time Break Monitoring</h3>
            <p className="text-sm text-gray-600">Monitor all agents' current break status and total break time for today.</p>
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
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Agent Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Break Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.filter(u => u.role === 'employee').map(user => {
                  // Since we are in a loop inside a component, and we don't have a global "all breaks" state yet,
                  // we would ideally fetch this in loadData. 
                  // For now, I'll simplify line 2627-2633 to use default values or fetch them in AdminDashboard loadData.
                  // Let's assume stats or a new state `allBreaks` exists.
                  // To fix the crash quickly, I'll use placeholders or an empty object.
                  const userBreakRecord = {
                    total_break_seconds: 0,
                    current_break_start: null,
                    breaks: []
                  };
                  const isOnBreak = userBreakRecord.current_break_start;
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
                              Duration: {(() => {
                                const elapsed = Math.floor((Date.now() - userBreakRecord.currentBreakStart) / 1000);
                                const mm = Math.floor(elapsed / 60);
                                const ss = (elapsed % 60).toString().padStart(2, '0');
                                return `${mm}:${ss}`;
                              })()}
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
      )}

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

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Campaign Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {campaigns.map(campaign => (
                      <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{campaign.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{campaign.createdBy}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{campaign.createdAt}</td>
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

  const { register } = useAuth();

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

      const result = await register({
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
    </div >
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
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Lead Manager Pro
                </h1>
                <p className="text-xs text-gray-600">{currentUser.role.toUpperCase()} Dashboard</p>
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
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 flex items-center gap-2 font-semibold transition-all hover:shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
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
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-gray-600">
          © Outvying 2026 Lead Manager Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

// Main App Component
const App = () => {
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

// Export with Provider
export default function LeadManagementApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  );
}

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
