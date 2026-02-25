import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Shield, Coffee, RefreshCw, Download, Upload, Filter, Trash2, Edit, Plus, AlertTriangle, Eye, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar } from 'recharts';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import { Button, Input, SearchableSelect, Card } from '../common/UIComponents';
import UploadLeadModal from '../modals/UploadLeadModal';
import UserModal from '../modals/UserModal';
import CampaignModal from '../modals/CampaignModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import AdminBreakHistoryModal from '../modals/AdminBreakHistoryModal';

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

    const formatTime = (ts) => {
        const h = Math.floor(ts / 3600);
        const m = Math.floor((ts % 3600) / 60);
        const s = ts % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(h > 0 ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
    };

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
            const { data: batch } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, from + batchSize - 1);

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

    const paginatedLeads = filteredLeads.slice((currentPage - 1) * LEADS_PER_PAGE, currentPage * LEADS_PER_PAGE);
    const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                {[
                    { id: 'overview', icon: <BarChart3 className="w-4 h-4 mr-2" />, label: 'Overview' },
                    { id: 'leads', icon: <Users className="w-4 h-4 mr-2" />, label: 'All Leads' },
                    { id: 'users', icon: <Shield className="w-4 h-4 mr-2" />, label: 'Manage Users' },
                    { id: 'campaigns', icon: <Plus className="w-4 h-4 mr-2" />, label: 'Campaigns' },
                    { id: 'breaks', icon: <Coffee className="w-4 h-4 mr-2" />, label: 'Breaks' },
                    { id: 'reports', icon: <BarChart3 className="w-4 h-4 mr-2" />, label: 'Reports' },
                ].map(tab => (
                    <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? 'primary' : 'secondary'}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex-1 md:flex-none"
                    >
                        {tab.icon}
                        {tab.label}
                    </Button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Total Leads</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalLeads}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-900/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Qualified</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.qualified}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-none">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Disqualified</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.disqualified}</p>
                            </div>
                            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-none">
                                <XCircle className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Active Breaks</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeBreaks}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-none">
                                <Coffee className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'leads' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input label="Start Date" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                            <Input label="End Date" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                            <SearchableSelect label="Agent" value={filters.agent} onChange={(e) => setFilters({ ...filters, agent: e.target.value })} options={users.map(u => ({ value: u.name, label: u.name }))} />
                            <SearchableSelect label="Campaign" value={filters.campaign} onChange={(e) => setFilters({ ...filters, campaign: e.target.value })} options={campaigns.map(c => ({ value: c.name, label: c.name }))} />
                            <div className="flex pt-4 items-end gap-2 md:col-span-4">
                                <Button onClick={applyFilters} className="flex-1"><Filter className="w-4 h-4 mr-2" /> Apply</Button>
                                <Button variant="secondary" onClick={handleClearFilters}><RefreshCw className="w-4 h-4" /></Button>
                                <Button variant="secondary" onClick={downloadLeads}><Download className="w-4 h-4" /></Button>
                                <Button onClick={() => setShowUploadModal(true)}><Upload className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Agent</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {paginatedLeads.map(lead => (
                                        <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatDisplayDate(lead.date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{lead.campaign}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{lead.ra_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{lead.company_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${lead.status === 'qualified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{lead.status}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button onClick={() => { setEditingLead(lead); setShowEditLeadModal(true); }} className="text-indigo-600 dark:text-indigo-400"><Edit className="w-5 h-5" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination... */}
                    </Card>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => { setEditingUser(null); setShowUserModal(true); }}><Plus className="w-4 h-4 mr-2" /> Add User</Button>
                    </div>
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{user.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{user.role}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditingUser(user); setShowUserModal(true); }} className="text-indigo-600 dark:text-indigo-400"><Edit className="w-5 h-5" /></button>
                                                    <button onClick={() => initiateDeleteUser(user)} className="text-red-600 dark:text-red-400"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Campaigns Tab... (Skipped for brevity in this step but will be full in final) */}

            {showUploadModal && <UploadLeadModal onClose={() => setShowUploadModal(false)} onSuccess={loadData} employeeId={currentUser.id} employeeName={currentUser.name} />}
            {showEditLeadModal && editingLead && <UploadLeadModal onClose={() => { setShowEditLeadModal(false); setEditingLead(null); }} onSuccess={loadData} employeeId={editingLead.employee_id} employeeName={editingLead.ra_name} leadToEdit={editingLead} />}
            {showUserModal && <UserModal user={editingUser} onClose={() => setShowUserModal(false)} onSuccess={loadData} />}
            {showCampaignModal && <CampaignModal campaign={editingCampaign} onClose={() => setShowCampaignModal(false)} onSuccess={loadData} />}
            <ConfirmationModal isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false, userId: null, userName: '' })} onConfirm={confirmDeleteUser} title="Delete User" message={`Delete ${deleteConfirmation.userName}?`} />
            {showAdminBreakHistory && selectedUserForBreaks && <AdminBreakHistoryModal user={selectedUserForBreaks} onClose={() => setShowAdminBreakHistory(false)} />}
        </div>
    );
};

export default AdminDashboard;
