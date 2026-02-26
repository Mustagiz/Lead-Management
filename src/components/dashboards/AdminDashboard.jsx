import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Shield, Coffee, RefreshCw, Download, Upload, Filter, Trash2, Edit, Plus, AlertTriangle, Eye, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar } from 'recharts';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import { Button, Input, SearchableSelect, Card, Badge, StatCard } from '../common/UIComponents';
import UploadLeadModal from '../modals/UploadLeadModal';
import UserModal from '../modals/UserModal';
import CampaignModal from '../modals/CampaignModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import AdminBreakHistoryModal from '../modals/AdminBreakHistoryModal';
import LiveFeedTicker from '../common/LiveFeedTicker';

const AdminDashboard = () => {
    const { currentUser } = useAuth();

    const [activeTab, setActiveTab] = useState('overview');
    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        agent: '',
        campaign: '',
        status: '',
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
        endDate: new Date().toISOString().split('T')[0],
        agentName: ''
    });
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [showBulkDeleteLeadsConfirm, setShowBulkDeleteLeadsConfirm] = useState(false);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [bulkEditForm, setBulkEditForm] = useState({ status: '', campaign: '' });
    const [allBreaks, setAllBreaks] = useState([]);
    const [campaignPage, setCampaignPage] = useState(1);
    const CAMPAIGNS_PER_PAGE = 10;
    const [usersPage, setUsersPage] = useState(1);
    const USERS_PER_PAGE = 10;
    const [reportsPage, setReportsPage] = useState(1);
    const REPORTS_PER_PAGE = 10;
    const [now, setNow] = useState(Date.now());

    const formatTime = (ts) => {
        const h = Math.floor(ts / 3600);
        const m = Math.floor((ts % 3600) / 60);
        const s = ts % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(h > 0 ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        loadData();

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
        let allLeads = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: batch, error: leadsError } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, from + batchSize - 1);

            if (leadsError) {
                console.error('Error fetching leads:', leadsError);
                hasMore = false;
                continue;
            }

            if (batch && batch.length > 0) {
                allLeads = [...allLeads, ...batch];
                from += batchSize;
                hasMore = batch.length === batchSize;
            } else {
                hasMore = false;
            }
        }

        const { data: usersData } = await supabase.from('profiles').select('*');
        const { data: campaignsData } = await supabase.from('campaigns').select('*');

        const today = new Date().toISOString().split('T')[0];
        const { data: breaksData } = await supabase
            .from('breaks_monitoring')
            .select('*')
            .eq('date', today);

        setLeads(allLeads);
        setFilteredLeads(allLeads);
        setUsers(usersData || []);
        setCampaigns(campaignsData || []);
        setAllBreaks(breaksData || []);

        setStats({
            totalLeads: allLeads.length,
            totalUsers: (usersData || []).length,
            qualified: allLeads.filter(l => l.status === 'qualified').length,
            disqualified: allLeads.filter(l => l.status === 'disqualified').length,
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
            alert('Error deleting user: ' + error.message);
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
        if (filters.status) {
            filtered = filtered.filter(lead => (lead.status || '').toLowerCase() === filters.status.toLowerCase());
        }
        if (filters.onlyStale) {
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            filtered = filtered.filter(lead => new Date(lead.updated_at) < fortyEightHoursAgo);
        }

        setFilteredLeads(filtered);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', agent: '', campaign: '', status: '', onlyStale: false });
        setFilteredLeads(leads);
        setCurrentPage(1);
    };

    const downloadLeads = () => {
        const headers = [
            'id', 'Date', 'RA Name', 'Campaign', 'Company', 'Salutation', 'First Name', 'Last Name',
            'Email', 'Domain', 'Job Title', 'Department', 'Job Level', 'Job Title Link',
            'Phone', 'Direct Dial', 'Address', 'City', 'State', 'Zip', 'Country',
            'Industry', 'Industry Link', 'Employee Size', 'Associated Members', 'Employee Size Link',
            'Revenue Size', 'Revenue Size Link', 'Tenure', 'VV Status', 'Status', 'RA Comments',
            'Additional Details'
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
            lead.industry_type_link || '',
            lead.employee_size,
            lead.associated_members || '',
            lead.employee_size_link || '',
            lead.revenue_size || '',
            lead.revenue_size_link || '',
            lead.tenure || '',
            lead.vv_status || '',
            lead.status,
            lead.ra_comments,
            ''
        ]);

        const csvContent = [headers.join(','), ...rows.map(e => e.map(item => `"${(item || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                alert('No break data found');
                return;
            }

            const rows = [['Agent Name', 'Date', 'Start Time', 'End Time', 'Duration', 'Daily Total']];
            data.forEach(record => {
                const agentName = record.profiles?.name || 'Unknown';
                const dailyTotal = formatTime(record.total_break_seconds);
                if (record.breaks?.length > 0) {
                    record.breaks.forEach(b => {
                        rows.push([agentName, record.date, new Date(b.startTime).toLocaleTimeString(), b.endTime ? new Date(b.endTime).toLocaleTimeString() : 'In Progress', formatTime(b.durationSeconds || 0), dailyTotal]);
                    });
                }
            });

            const csvContent = rows.map(r => r.join(',')).join('\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `break_report_${breakFilters.startDate}_to_${breakFilters.endDate}.csv`;
            a.click();
        } catch (err) {
            alert('Failed: ' + err.message);
        }
    };

    const handleBulkUpdateLeads = async () => {
        if (!bulkEditForm.status && !bulkEditForm.campaign) return;
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

    const handleSelectLead = (id) => {
        setSelectedLeads(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAllLeads = () => {
        if (selectedLeads.length === paginatedLeads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(paginatedLeads.map(l => l.id));
        }
    };

    const handleSelectUser = (id) => {
        setSelectedUsers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAllUsers = () => {
        const deletableUsers = users.filter(u => u.role !== 'admin').map(u => u.id);
        if (selectedUsers.length === deletableUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(deletableUsers);
        }
    };

    const resetPassword = async (userId) => {
        const user = users.find(u => u.id === userId);
        if (window.confirm(`Are you sure you want to send a password reset email to ${user.username}?`)) {
            const { error } = await supabase.auth.resetPasswordForEmail(user.username, {
                redirectTo: window.location.origin
            });
            if (error) alert('Error: ' + error.message);
            else alert('Password reset email sent!');
        }
    };

    const paginatedLeads = filteredLeads.slice((currentPage - 1) * LEADS_PER_PAGE, currentPage * LEADS_PER_PAGE);
    const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);

    return (
        <div className="space-y-6">
            <LiveFeedTicker />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap gap-2 p-1.5 glass rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 flex-1">
                    {[
                        { id: 'overview', icon: BarChart3, label: 'Overview' },
                        { id: 'leads', icon: Users, label: 'All Leads' },
                        { id: 'users', icon: Shield, label: 'Manage Users' },
                        { id: 'campaigns', icon: Plus, label: 'Campaigns' },
                        { id: 'breaks', icon: Coffee, label: 'Breaks' },
                        { id: 'reports', icon: BarChart3, label: 'Reports' },
                    ].map(tab => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? 'primary' : 'ghost'}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 md:flex-none py-2 rounded-xl text-sm ${activeTab === tab.id ? 'shadow-lg shadow-indigo-500/20' : ''}`}
                            icon={tab.icon}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>
                <Button onClick={() => setShowUploadModal(true)} variant="primary" className="w-full md:w-auto px-6 shadow-indigo-500/20" icon={Upload}>
                    Bulk Import Leads
                </Button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <StatCard
                        label="Total Leads"
                        value={stats.totalLeads || 0}
                        icon={BarChart3}
                        color="indigo"
                    />
                    <StatCard
                        label="Qualified"
                        value={stats.qualified || 0}
                        icon={CheckCircle}
                        color="emerald"
                        trend="up"
                        trendValue="12"
                    />
                    <StatCard
                        label="Disqualified"
                        value={stats.disqualified || 0}
                        icon={XCircle}
                        color="rose"
                    />
                    <StatCard
                        label="Active Breaks"
                        value={stats.activeBreaks || 0}
                        icon={Coffee}
                        color="amber"
                    />
                </div>
            )}

            {activeTab === 'leads' && (
                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 dark:shadow-indigo-900/20">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">Advanced Filters</h3>
                                <p className="text-sm text-slate-500 font-medium">Refine your lead view by various criteria</p>
                            </div>
                            <Button variant="ghost" onClick={handleClearFilters} className="text-indigo-600 dark:text-indigo-400 font-bold" icon={RefreshCw}>
                                Reset
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <Input label="Start Date" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                            <Input label="End Date" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                            <SearchableSelect label="Agent" value={filters.agent} onChange={(e) => setFilters({ ...filters, agent: e.target.value })} options={users.filter(u => u.name).map(u => ({ value: u.name, label: u.name }))} placeholder="Search agents..." />
                            <SearchableSelect label="Campaign" value={filters.campaign} onChange={(e) => setFilters({ ...filters, campaign: e.target.value })} options={campaigns.filter(c => c.name).map(c => ({ value: c.name, label: c.name }))} placeholder="Search campaigns..." />
                            <SearchableSelect
                                label="Status"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                placeholder="All Statuses"
                                options={[
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'qualified', label: 'Qualified' },
                                    { value: 'disqualified', label: 'Disqualified' },
                                    { value: 'callback', label: 'Callback' },
                                    { value: 'not interested', label: 'Not Interested' },
                                    { value: 'dnc', label: 'DNC' }
                                ]}
                            />
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex gap-3">
                                <Button
                                    variant={filters.onlyStale ? 'primary' : 'secondary'}
                                    onClick={() => setFilters({ ...filters, onlyStale: !filters.onlyStale })}
                                    className="px-4 py-2"
                                    icon={AlertTriangle}
                                >
                                    Stale Leads
                                </Button>
                                <Button variant="secondary" onClick={downloadLeads} className="px-4 py-2" icon={Download}>
                                    Export CSV
                                </Button>
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={applyFilters} className="px-8 shadow-indigo-500/20" icon={Filter}>
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {selectedLeads.length > 0 && (
                        <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/20 flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
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

                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAllLeads}
                                                checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Agent</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {paginatedLeads.map(lead => {
                                        const isStale = lead.updated_at && new Date(lead.updated_at) < new Date(Date.now() - 48 * 60 * 60 * 1000);
                                        return (
                                            <tr key={lead.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${isStale ? 'bg-red-50/10' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLeads.includes(lead.id)}
                                                        onChange={() => handleSelectLead(lead.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDisplayDate(lead.date)}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium dark:text-slate-400">{lead.campaign}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium dark:text-slate-400">{lead.ra_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{lead.company_name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant={
                                                        lead.status === 'qualified' ? 'success' :
                                                            lead.status === 'disqualified' ? 'danger' :
                                                                lead.status === 'pending' ? 'warning' : 'info'
                                                    }>
                                                        {lead.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-3">
                                                        {isStale && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" title="Stale lead" />}
                                                        <button onClick={() => { setEditingLead(lead); setShowEditLeadModal(true); }} className="text-indigo-600 dark:text-indigo-400"><Edit className="w-5 h-5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-400">
                                    Showing {((currentPage - 1) * LEADS_PER_PAGE) + 1} to {Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} leads
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                                    <Button variant="secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex justify-end gap-2">
                        {selectedUsers.length > 0 && (
                            <Button variant="danger" onClick={() => setShowBulkDeleteConfirm(true)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Selected ({selectedUsers.length})
                            </Button>
                        )}
                        <Button onClick={() => { setEditingUser(null); setShowUserModal(true); }}><Plus className="w-4 h-4 mr-2" /> Add User</Button>
                    </div>
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAllUsers}
                                                checked={users.some(u => u.role !== 'admin') && selectedUsers.length === users.filter(u => u.role !== 'admin').length}
                                                disabled={!users.some(u => u.role !== 'admin')}
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {users.slice((usersPage - 1) * USERS_PER_PAGE, usersPage * USERS_PER_PAGE).map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => handleSelectUser(user.id)}
                                                    disabled={user.role === 'admin'}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'qa' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditingUser(user); setShowUserModal(true); }} className="text-indigo-600 dark:text-indigo-400" title="Edit User"><Edit className="w-5 h-5" /></button>
                                                    <button onClick={() => resetPassword(user.id)} className="text-yellow-600 dark:text-yellow-400" title="Reset Password"><RefreshCw className="w-5 h-5" /></button>
                                                    <button onClick={() => initiateDeleteUser(user)} className="text-red-600 dark:text-red-400" disabled={user.role === 'admin'} title="Delete User"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {Math.ceil(users.length / USERS_PER_PAGE) > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-400">
                                    Showing {((usersPage - 1) * USERS_PER_PAGE) + 1} to {Math.min(usersPage * USERS_PER_PAGE, users.length)} of {users.length} users
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1}>Previous</Button>
                                    <Button variant="secondary" onClick={() => setUsersPage(p => Math.min(Math.ceil(users.length / USERS_PER_PAGE), p + 1))} disabled={usersPage === Math.ceil(users.length / USERS_PER_PAGE)}>Next</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'campaigns' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={() => { setEditingCampaign(null); setShowCampaignModal(true); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Campaign
                        </Button>
                    </div>

                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Campaign Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Created By</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {campaigns.slice((campaignPage - 1) * CAMPAIGNS_PER_PAGE, campaignPage * CAMPAIGNS_PER_PAGE).map(campaign => (
                                        <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{campaign.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{campaign.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{campaign.created_by}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleCampaignStatus(campaign.id)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${campaign.is_active ? 'bg-green-500' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`${campaign.is_active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditingCampaign(campaign); setShowCampaignModal(true); }} className="text-indigo-600 dark:text-indigo-400"><Edit className="w-5 h-5" /></button>
                                                    <button onClick={() => deleteCampaign(campaign.id)} className="text-red-600 dark:text-red-400"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {Math.ceil(campaigns.length / CAMPAIGNS_PER_PAGE) > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-400">
                                    Showing {((campaignPage - 1) * CAMPAIGNS_PER_PAGE) + 1} to {Math.min(campaignPage * CAMPAIGNS_PER_PAGE, campaigns.length)} of {campaigns.length} campaigns
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => setCampaignPage(p => Math.max(1, p - 1))} disabled={campaignPage === 1}>Previous</Button>
                                    <Button variant="secondary" onClick={() => setCampaignPage(p => Math.min(Math.ceil(campaigns.length / CAMPAIGNS_PER_PAGE), p + 1))} disabled={campaignPage === Math.ceil(campaigns.length / CAMPAIGNS_PER_PAGE)}>Next</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'breaks' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Break Monitoring</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input label="Start Date" type="date" value={breakFilters.startDate} onChange={(e) => setBreakFilters({ ...breakFilters, startDate: e.target.value })} />
                            <Input label="End Date" type="date" value={breakFilters.endDate} onChange={(e) => setBreakFilters({ ...breakFilters, endDate: e.target.value })} />
                            <SearchableSelect label="Agent" value={breakFilters.agentName} onChange={(e) => setBreakFilters({ ...breakFilters, agentName: e.target.value })} options={users.filter(u => u.role === 'employee').map(u => ({ value: u.name, label: u.name }))} />
                            <div className="flex pt-4 items-end">
                                <Button onClick={downloadBreakReport} className="w-full"><Download className="w-4 h-4 mr-2" /> Download Report</Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Agent Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Total Break Time</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {users.filter(u => u.role === 'employee')
                                        .filter(u => !breakFilters.agentName || u.name.toLowerCase().includes(breakFilters.agentName.toLowerCase()))
                                        .map(user => {
                                            const userBreak = allBreaks.find(b => b.user_id === user.id) || { total_break_seconds: 0, current_break_start: null };
                                            return (
                                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {userBreak.current_break_start ? (
                                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 animate-pulse">On Break</span>
                                                        ) : (
                                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Available</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                                        {formatTime(userBreak.current_break_start
                                                            ? userBreak.total_break_seconds + Math.floor((now - new Date(userBreak.current_break_start).getTime()) / 1000)
                                                            : userBreak.total_break_seconds
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <button onClick={() => { setSelectedUserForBreaks(user); setShowAdminBreakHistory(true); }} className="text-indigo-600 dark:text-indigo-400 flex items-center font-medium"><Eye className="w-4 h-4 mr-1" /> View History</button>
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

            {activeTab === 'reports' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 h-[500px]">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                                Campaign Conversion Rates (%)
                            </h3>
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart
                                    data={campaigns
                                        .map(c => {
                                            const cLeads = leads.filter(l => l.campaign === c.name);
                                            const qualified = cLeads.filter(l => l.status === 'qualified').length;
                                            return {
                                                name: c.name,
                                                rate: cLeads.length > 0 ? parseFloat(((qualified / cLeads.length) * 100).toFixed(1)) : 0
                                            };
                                        })
                                        .sort((a, b) => b.rate - a.rate)
                                        .slice(0, 10)}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 160 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        angle={-60}
                                        textAnchor="end"
                                        interval={0}
                                        height={160}
                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                                        tickFormatter={(value) => value && value.length > 12 ? `${value.substring(0, 12)}...` : value}
                                    />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
                                    <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>

                        <Card className="p-6 h-[500px]">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                                Leads Volume by Campaign
                            </h3>
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart
                                    data={campaigns
                                        .map(c => ({
                                            name: c.name,
                                            total: leads.filter(l => l.campaign === c.name).length
                                        }))
                                        .sort((a, b) => b.total - a.total)
                                        .slice(0, 10)}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 160 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        angle={-60}
                                        textAnchor="end"
                                        interval={0}
                                        height={160}
                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                                        tickFormatter={(value) => value && value.length > 12 ? `${value.substring(0, 12)}...` : value}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>

                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detailed Performance Stats</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 text-left">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Campaign</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Total Leads</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Qualified</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Disqualified</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Conversion %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {campaigns
                                        .slice((reportsPage - 1) * REPORTS_PER_PAGE, reportsPage * REPORTS_PER_PAGE)
                                        .map(c => {
                                            const cLeads = leads.filter(l => l.campaign === c.name);
                                            const qCount = cLeads.filter(l => l.status === 'qualified').length;
                                            const dCount = cLeads.filter(l => l.status === 'disqualified').length;
                                            const rate = cLeads.length > 0 ? ((qCount / cLeads.length) * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={c.id}>
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.name}</td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{cLeads.length}</td>
                                                    <td className="px-6 py-4 text-green-600 font-semibold">{qCount}</td>
                                                    <td className="px-6 py-4 text-red-600">{dCount}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-24 bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                                                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${rate}%` }}></div>
                                                            </div>
                                                            <span className="text-sm font-bold dark:text-white">{rate}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                        {Math.ceil(campaigns.length / REPORTS_PER_PAGE) > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-400">
                                    Showing {((reportsPage - 1) * REPORTS_PER_PAGE) + 1} to {Math.min(reportsPage * REPORTS_PER_PAGE, campaigns.length)} of {campaigns.length} campaigns
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => setReportsPage(p => Math.max(1, p - 1))} disabled={reportsPage === 1}>Previous</Button>
                                    <Button variant="secondary" onClick={() => setReportsPage(p => Math.min(Math.ceil(campaigns.length / REPORTS_PER_PAGE), p + 1))} disabled={reportsPage === Math.ceil(campaigns.length / REPORTS_PER_PAGE)}>Next</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {showUploadModal && <UploadLeadModal onClose={() => setShowUploadModal(false)} onSuccess={loadData} employeeId={currentUser.id} employeeName={currentUser.name} />}
            {showEditLeadModal && editingLead && <UploadLeadModal onClose={() => { setShowEditLeadModal(false); setEditingLead(null); }} onSuccess={loadData} employeeId={editingLead.employee_id} employeeName={editingLead.ra_name} leadToEdit={editingLead} />}
            {showUserModal && <UserModal user={editingUser} onClose={() => setShowUserModal(false)} onSuccess={loadData} />}
            {showCampaignModal && <CampaignModal campaign={editingCampaign} onClose={() => setShowCampaignModal(false)} onSuccess={loadData} />}

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, userId: null, userName: '' })}
                onConfirm={confirmDeleteUser}
                title="Delete User"
                message={`Are you sure you want to delete ${deleteConfirmation.userName}? This action cannot be undone.`}
            />

            <ConfirmationModal
                isOpen={showBulkDeleteLeadsConfirm}
                onClose={() => setShowBulkDeleteLeadsConfirm(false)}
                onConfirm={confirmBulkDeleteLeads}
                title="Bulk Delete Leads"
                message={`Are you sure you want to delete ${selectedLeads.length} selected leads? This action cannot be undone.`}
            />

            <ConfirmationModal
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={confirmBulkDeleteUsers}
                title="Bulk Delete Users"
                message={`Are you sure you want to delete ${selectedUsers.length} selected users? This action cannot be undone.`}
            />

            {showBulkEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Bulk Edit Leads ({selectedLeads.length})</h2>
                        <div className="space-y-4">
                            <SearchableSelect
                                label="Update Status"
                                value={bulkEditForm.status}
                                onChange={(e) => setBulkEditForm({ ...bulkEditForm, status: e.target.value })}
                                options={[
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'qualified', label: 'Qualified' },
                                    { value: 'disqualified', label: 'Disqualified' },
                                    { value: 'callback', label: 'Callback' },
                                    { value: 'not interested', label: 'Not Interested' },
                                    { value: 'dnc', label: 'DNC' }
                                ]}
                            />
                            <SearchableSelect
                                label="Update Campaign"
                                value={bulkEditForm.campaign}
                                onChange={(e) => setBulkEditForm({ ...bulkEditForm, campaign: e.target.value })}
                                options={campaigns.filter(c => c.name).map(c => ({ value: c.name, label: c.name }))}
                            />
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="secondary" onClick={() => setShowBulkEditModal(false)}>Cancel</Button>
                                <Button onClick={handleBulkUpdateLeads}>Apply Changes</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {showAdminBreakHistory && selectedUserForBreaks && <AdminBreakHistoryModal user={selectedUserForBreaks} onClose={() => setShowAdminBreakHistory(false)} />}
        </div>
    );
};

export default AdminDashboard;
