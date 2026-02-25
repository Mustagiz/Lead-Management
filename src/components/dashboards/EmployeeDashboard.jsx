import React, { useState, useEffect, useCallback } from 'react';
import { Coffee, BarChart3, CheckCircle, XCircle, Clock, Filter, Search, RefreshCw, Download, Upload, Eye } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import { Button, Input, SearchableSelect, Card } from '../common/UIComponents';
import UploadLeadModal from '../modals/UploadLeadModal';

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

    const loadLeads = useCallback(async () => {
        const { data: userLeads, error } = await supabase
            .from('leads')
            .select('*')
            .eq('employee_id', currentUser.id)
            .order('created_at', { ascending: false });

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
    }, [currentUser.id]);

    const loadBreakData = useCallback(async () => {
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
    }, [currentUser.id]);

    useEffect(() => {
        if (currentUser) {
            loadLeads();
            loadBreakData();
        }
    }, [currentUser, loadLeads, loadBreakData]);

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

    const handleBreakToggle = async () => {
        const today = new Date().toISOString().split('T')[0];

        if (onBreak) {
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
            <div className="flex gap-4 border-b border-gray-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('leads')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'leads'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    My Leads
                </button>
                <button
                    onClick={() => setActiveTab('breaks')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'breaks'
                        ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <Coffee className="w-4 h-4 inline mr-2" />
                    Break Management
                </button>
            </div>

            {activeTab === 'leads' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card className="p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Total Leads</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
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
                            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-50 dark:bg-yellow-900/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Pending</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-none">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Filter className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
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
                                <Button onClick={applyFilters} className="flex-1">
                                    <Search className="w-4 h-4 mr-2" />
                                    Apply
                                </Button>
                                <Button variant="secondary" onClick={handleClearFilters} className="px-3">
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                                <Button variant="secondary" onClick={downloadLeads} className="px-3">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={() => setShowUploadModal(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Leads
                        </Button>
                    </div>

                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {paginatedLeads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatDisplayDate(lead.date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{lead.campaign || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{lead.company_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {lead.salutation} {lead.first_name} {lead.last_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{lead.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1.5 inline-flex text-[11px] leading-4 font-bold rounded-xl border ${lead.status === 'qualified' ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/20' :
                                                    lead.status === 'disqualified' ? 'bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/20' :
                                                        'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/20'
                                                    } uppercase`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => {
                                                        setSelectedLead(lead);
                                                        setShowUploadModal(true);
                                                    }}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-white transition-colors"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-400">
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

            {activeTab === 'breaks' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-800/30">
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Active Break Status</p>
                                <Coffee className={`w-6 h-6 ${onBreak ? 'text-purple-600 animate-pulse' : 'text-gray-400'}`} />
                            </div>
                            <p className="text-4xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                                {onBreak ? formatTime(currentBreakDuration) : "00:00"}
                            </p>
                            <p className="text-sm text-purple-600 dark:text-purple-300 mb-6">
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

                    <Card className="p-6 md:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Today's Summary</h3>
                            <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">Total Break Time</p>
                                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatTime(totalBreakTime)}</p>
                            </div>
                        </div>

                        {breakHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Start</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">End</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {breakHistory.map((breakItem, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                    {new Date(breakItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                    {new Date(breakItem.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-purple-600 dark:text-purple-400">
                                                    {formatTime(breakItem.durationSeconds || breakItem.duration * 60)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Coffee className="w-8 h-8 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No break records for today.</p>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;
