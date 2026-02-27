import React, { useState, useEffect, useCallback } from 'react';
import { Coffee, BarChart3, CheckCircle, XCircle, Clock, Filter, RefreshCw, Download, Eye, Users, Plus, Shield, History } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import { Button, Input, SearchableSelect, Card, Badge, StatCard } from '../common/UIComponents';
import UploadLeadModal from '../modals/UploadLeadModal';
import InternalSuppressionManager from '../admin/InternalSuppressionManager';
import UploadHistory from '../admin/UploadHistory';

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap gap-2 p-1.5 glass rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 flex-1">
                    {[
                        { id: 'leads', icon: Users, label: 'My Leads' },
                        { id: 'upload_history', icon: History, label: 'Upload History' },
                        { id: 'internal_suppression', icon: Shield, label: 'Internal Suppression' },
                        { id: 'breaks', icon: Coffee, label: 'Break Management' },
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
                <Button onClick={() => setShowUploadModal(true)} variant="primary" className="w-full md:w-auto px-8 shadow-indigo-500/20" icon={Plus}>
                    Upload New Lead
                </Button>
            </div>

            {activeTab === 'internal_suppression' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <InternalSuppressionManager />
                </div>
            )}

            {activeTab === 'upload_history' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <UploadHistory userId={currentUser.id} role="employee" />
                </div>
            )}

            {activeTab === 'leads' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard label="Total Leads" value={stats.total} icon={BarChart3} color="indigo" />
                        <StatCard label="Qualified" value={stats.qualified} icon={CheckCircle} color="emerald" trend="up" trendValue={(stats.qualified / (stats.total || 1) * 100).toFixed(0)} />
                        <StatCard label="Disqualified" value={stats.disqualified} icon={XCircle} color="rose" />
                        <StatCard label="Pending" value={stats.pending} icon={Clock} color="amber" />
                    </div>

                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 dark:shadow-indigo-900/10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">Lead Portfolio</h3>
                                <p className="text-sm text-slate-500 font-medium">Quickly locate specific leads in your records</p>
                            </div>
                            <Button variant="ghost" onClick={handleClearFilters} icon={RefreshCw}>
                                Reset
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Input label="From Date" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                            <Input label="To Date" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                            <SearchableSelect label="Campaign Name" value={filters.campaign} onChange={(e) => setFilters({ ...filters, campaign: e.target.value })} options={campaigns.map(c => ({ value: c.name, label: c.name }))} placeholder="Search campaigns..." />
                            <div className="md:pt-6 pt-0 flex gap-3">
                                <Button onClick={applyFilters} className="w-full shadow-indigo-500/20" icon={Filter}>Filter Leads</Button>
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-between items-center px-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Recent Records</h4>
                        <Button variant="ghost" onClick={downloadLeads} icon={Download}>Export CSV</Button>
                    </div>

                    <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-indigo-900/10">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Campaign</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Company</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Contact</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {paginatedLeads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDisplayDate(lead.date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{lead.campaign || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">{lead.company_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{lead.first_name} {lead.last_name}</div>
                                                <div className="text-[11px] text-slate-400">{lead.email}</div>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedLead(lead);
                                                        setShowUploadModal(true);
                                                    }}
                                                    className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    icon={Eye}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="px-6 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="py-1 px-4"
                                    >
                                        Prev
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="py-1 px-4"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'breaks' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="lg:col-span-1 p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-2xl shadow-indigo-500/20">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black font-display uppercase tracking-widest text-indigo-100">Control Panel</h3>
                            <div className={`p-2 rounded-xl bg-white/10 ${onBreak ? 'animate-pulse' : ''}`}>
                                <Coffee className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div className="text-center py-8">
                            <p className="text-sm font-bold text-indigo-100/60 uppercase tracking-[0.2em] mb-2">Duration</p>
                            <h2 className="text-6xl font-black font-display tracking-tight mb-8">
                                {onBreak ? formatTime(currentBreakDuration) : "00:00"}
                            </h2>

                            <Button
                                variant={onBreak ? 'danger' : 'glass'}
                                onClick={handleBreakToggle}
                                className={`w-full py-4 text-lg shadow-xl ${onBreak ? 'shadow-rose-500/20' : 'shadow-black/10'}`}
                                icon={Coffee}
                            >
                                {onBreak ? 'End Session' : 'Begin Break'}
                            </Button>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-widest mb-1">Daily Total</p>
                                <p className="text-xl font-bold">{formatTime(totalBreakTime)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-widest mb-1">Sessions</p>
                                <p className="text-xl font-bold">{breakHistory.length}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="lg:col-span-2 p-8 border-none shadow-xl shadow-slate-200/50 dark:shadow-indigo-900/10">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white font-display mb-8">Today's Sessions</h3>
                        {breakHistory.length > 0 ? (
                            <div className="space-y-4">
                                {breakHistory.map((b, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-indigo-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                                <Clock className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">Break {i + 1}</p>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {b.endTime ? new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="info" className="px-4">{formatTime(b.durationSeconds)}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <Coffee className="w-12 h-12 mb-4 opacity-10" />
                                <p className="text-sm font-medium">No sessions recorded today</p>
                            </div>
                        )}
                    </Card>
                </div>
            )}

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
        </div>
    );
};

export default EmployeeDashboard;
