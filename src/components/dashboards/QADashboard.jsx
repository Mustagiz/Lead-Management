import React, { useState, useEffect, useCallback } from 'react';
import { Coffee, CheckCircle, Check, X, Filter, RefreshCw, Download, Upload, Edit, LogOut, Clock } from 'lucide-react';
import LiveFeedTicker from '../common/LiveFeedTicker';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import { Button, Input, SearchableSelect, Card } from '../common/UIComponents';
import UploadLeadModal from '../modals/UploadLeadModal';

const QADashboard = () => {
    const { currentUser } = useAuth();
    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', agent: '', campaign: '', status: '' });
    const [activeCampaigns, setActiveCampaigns] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [stats, setStats] = useState({ audited: 0, qualified: 0, disqualified: 0, tbd: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [activeTab, setActiveTab] = useState('leads');
    const [editingLead, setEditingLead] = useState(null);

    const [onBreak, setOnBreak] = useState(false);
    const [breakStartTime, setBreakStartTime] = useState(null);
    const [totalBreakTime, setTotalBreakTime] = useState(0);
    const [currentBreakDuration, setCurrentBreakDuration] = useState(0);
    const [breakHistory, setBreakHistory] = useState([]);

    const LEADS_PER_PAGE = 10;


    const loadLeads = useCallback(async () => {
        let allLeads = [];
        let from = 0;
        let to = 999;
        let finishedLeads = false;

        while (!finishedLeads) {
            const { data: leadsData, error: leadsError } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (leadsError || !leadsData || leadsData.length === 0) {
                finishedLeads = true;
            } else {
                allLeads = [...allLeads, ...leadsData];
                if (leadsData.length < 1000) {
                    finishedLeads = true;
                } else {
                    from += 1000;
                    to += 1000;
                }
            }
        }

        setLeads(allLeads);
        setFilteredLeads(allLeads);

        const { data: campaignsData } = await supabase
            .from('campaigns')
            .select('*')
            .eq('is_active', true);

        setActiveCampaigns(campaignsData || []);

        let allAuditLogs = [];
        let auditFrom = 0;
        let auditTo = 999;
        let finishedAudit = false;

        while (!finishedAudit) {
            const { data: auditLog, error: auditError } = await supabase
                .from('audit_log')
                .select('*')
                .eq('qa_id', currentUser.id)
                .range(auditFrom, auditTo);

            if (auditError || !auditLog || auditLog.length === 0) {
                finishedAudit = true;
            } else {
                allAuditLogs = [...allAuditLogs, ...auditLog];
                if (auditLog.length < 1000) {
                    finishedAudit = true;
                } else {
                    auditFrom += 1000;
                    auditTo += 1000;
                }
            }
        }

        const auditLog = allAuditLogs;

        setStats({
            audited: auditLog.length,
            qualified: auditLog.filter(l => l.action === 'qualified').length,
            disqualified: auditLog.filter(l => l.action === 'disqualified').length,
            tbd: auditLog.filter(l => l.action === 'tbd').length
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
        loadLeads();
        loadBreakData();
    }, [loadLeads, loadBreakData]);

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

        setFilteredLeads(filtered);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', agent: '', campaign: '', status: '' });
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
            'Revenue Size', 'Revenue Size Link', 'Tenure', 'VV Status', 'Status', 'RA Comments', 'Additional Details'
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

    return (
        <div className="space-y-6">
            <LiveFeedTicker />
            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('leads')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'leads'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Leads Management
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Total Audited</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.audited}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-none">
                                    <CheckCircle className="w-6 h-6 text-white" />
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
                                    <Check className="w-6 h-6 text-white" />
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
                                    <X className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">TBD Audited</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.tbd}</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-none">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                                label="Agent Name"
                                value={filters.agent}
                                onChange={(e) => setFilters({ ...filters, agent: e.target.value })}
                                placeholder="Select agent..."
                                options={[...new Set(leads.map(l => l.ra_name).filter(Boolean))].sort().map(name => ({ value: name, label: name }))}
                            />
                            <SearchableSelect
                                label="Campaign Name"
                                value={filters.campaign}
                                onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
                                placeholder="Search campaign..."
                                options={activeCampaigns.map(c => ({ value: c.name, label: c.name }))}
                            />
                            <SearchableSelect
                                label="Status"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                placeholder="Select status..."
                                options={[
                                    { value: 'qualified', label: 'Qualified' },
                                    { value: 'disqualified', label: 'Disqualified' },
                                    { value: 'tbd', label: 'TBD' }
                                ]}
                            />
                            <div className="flex flex-col mb-4">
                                <label className="block text-sm font-semibold opacity-0 mb-1.5 ml-0.5 select-none text-transparent border-none">Spacer</label>
                                <div className="flex items-center gap-2">
                                    <Button onClick={applyFilters} className="h-[46px] flex-1">
                                        <Filter className="w-4 h-4 mr-2" />
                                        Apply
                                    </Button>
                                    <Button variant="secondary" onClick={handleClearFilters} className="h-[46px] px-3">
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                    <Button variant="secondary" onClick={downloadLeads} className="h-[46px] px-3">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {selectedLeads.length > 0 && (
                        <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/20">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                                    {selectedLeads.length} lead(s) selected
                                </p>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleBulkAudit('qualified')}>Qualify All</Button>
                                    <Button variant="secondary" onClick={() => handleBulkAudit('tbd')}>TBD All</Button>
                                    <Button variant="danger" onClick={() => handleBulkAudit('disqualified')}>Disqualify All</Button>
                                </div>
                            </div>
                        </Card>
                    )}

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
                                        <th className="px-6 py-5">
                                            <input
                                                type="checkbox"
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedLeads(paginatedLeads.map(l => l.id));
                                                    else setSelectedLeads([]);
                                                }}
                                                checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Agent</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {paginatedLeads.map(lead => (
                                        <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLeads.includes(lead.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedLeads([...selectedLeads, lead.id]);
                                                        else setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatDisplayDate(lead.date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{lead.campaign || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{lead.ra_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{lead.company_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{lead.first_name} {lead.last_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1.5 inline-flex text-[11px] leading-4 font-bold rounded-xl border ${lead.status === 'qualified' ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/20' :
                                                    lead.status === 'disqualified' ? 'bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/20' :
                                                        lead.status === 'tbd' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/20' :
                                                            'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/20'
                                                    } uppercase`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditingLead(lead); setShowUploadModal(true); }} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 transition-colors"><Edit className="w-5 h-5" /></button>
                                                    <button onClick={() => handleQualify(lead.id, 'qualified')} title="Qualify" className="text-green-600 dark:text-green-400 hover:text-green-900 transition-colors"><Check className="w-5 h-5" /></button>
                                                    <button onClick={() => handleQualify(lead.id, 'tbd')} title="Mark TBD" className="text-amber-600 dark:text-amber-400 hover:text-amber-900 transition-colors"><Clock className="w-5 h-5" /></button>
                                                    <button onClick={() => handleQualify(lead.id, 'disqualified')} title="Disqualify" className="text-red-600 dark:text-red-400 hover:text-red-900 transition-colors"><X className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Showing <span className="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * LEADS_PER_PAGE + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{filteredLeads.length}</span> leads
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredLeads.length / LEADS_PER_PAGE), prev + 1))}
                                    disabled={currentPage >= Math.ceil(filteredLeads.length / LEADS_PER_PAGE)}
                                    className="px-4 py-2"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {showUploadModal && (
                        <UploadLeadModal
                            onClose={() => { setShowUploadModal(false); setEditingLead(null); }}
                            onSuccess={loadLeads}
                            employeeId={currentUser.id}
                            employeeName={currentUser.name}
                            leadToEdit={editingLead}
                        />
                    )}
                </>
            )}

            {activeTab === 'breaks' && (
                <Card className="max-w-4xl mx-auto overflow-hidden">
                    {/* Break management content... */}
                    <div className="p-8 border-b border-gray-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 text-center">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <Coffee className={`w-10 h-10 ${onBreak ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : 'text-gray-400'}`} />
                        </div>
                        <h2 className="text-3xl font-bold dark:text-white">Break Management</h2>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="text-center p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Current Session</p>
                                <p className="text-5xl font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatTime(currentBreakDuration)}</p>
                            </div>
                            <div className="text-center p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Total Today</p>
                                <p className="text-5xl font-mono font-bold text-gray-800 dark:text-white">{formatTime(totalBreakTime + (onBreak ? currentBreakDuration : 0))}</p>
                            </div>
                        </div>
                        <div className="flex justify-center mb-12">
                            <Button onClick={handleBreakToggle} variant={onBreak ? 'danger' : 'primary'} className="px-12 py-4 text-xl rounded-full">
                                {onBreak ? <><LogOut className="w-6 h-6 mr-2" /> End Break</> : <><Coffee className="w-6 h-6 mr-2" /> Start Break</>}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default QADashboard;
