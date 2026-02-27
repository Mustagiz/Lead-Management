import React, { useState, useEffect, useCallback } from 'react';
import { Download, Search, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, Clock, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Card, Button } from '../common/UIComponents';

const UploadHistory = ({ userId, role }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [employeeQuery, setEmployeeQuery] = useState('');
    const itemsPerPage = 10;

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('upload_history')
                .select('*', { count: 'exact' });

            // Filter by user if employee
            if (role === 'employee' && userId) {
                query = query.eq('employee_id', userId);
            }

            if (searchTerm) {
                query = query.or(`file_name.ilike.%${searchTerm}%,campaign_name.ilike.%${searchTerm}%`);
            }

            if (employeeQuery) {
                query = query.ilike('employee_name', `%${employeeQuery}%`);
            }

            if (startDate) {
                query = query.gte('created_at', `${startDate}T00:00:00`);
            }
            if (endDate) {
                query = query.lte('created_at', `${endDate}T23:59:59`);
            }

            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            setHistory(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching upload history:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, role, currentPage, searchTerm, employeeQuery, startDate, endDate]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setEmployeeQuery('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const downloadRejectedLeads = (record) => {
        if (!record.rejected_leads_json || record.rejected_leads_json.length === 0) {
            alert('No rejected leads to download for this upload.');
            return;
        }

        try {
            const data = record.rejected_leads_json;
            const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));

            const csvRows = [
                headers.join(","),
                ...data.map(row => headers.map(header => {
                    const cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                    return `"${cell.replace(/"/g, '""')}"`;
                }).join(","))
            ];

            const csvContent = csvRows.join("\n");
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.style.display = 'none';
            link.href = url;
            link.setAttribute("download", `rejected_leads_${record.campaign_name || 'bulk'}_${new Date(record.created_at).getTime()}.csv`);
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error('Download error:', err);
            alert('Error generating rejected leads file');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }) + ' PT'; // Matching the user's ref image "PT"
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <Card className="overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-gray-100 dark:border-slate-800 shadow-xl">
            {/* Header / Filter Area */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="relative group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 ml-1">File or Campaign</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {role === 'admin' && (
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 ml-1">Employee Name</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search RA..."
                                    value={employeeQuery}
                                    onChange={(e) => { setEmployeeQuery(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 ml-1">From Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 ml-1">To Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => fetchHistory()} disabled={isLoading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="w-4 h-4 mr-2" />
                            Clear Filters
                        </Button>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {totalCount} Log RecordsFound
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-100/50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-gray-100 dark:border-slate-800">
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Uploaded Date</th>
                            <th className="px-6 py-4">File name</th>
                            <th className="px-6 py-4 text-center">Source</th>
                            <th className="px-6 py-4 text-center">Errors</th>
                            <th className="px-6 py-4 text-center">Submitted</th>
                            <th className="px-6 py-4 text-center">N</th>
                            <th className="px-6 py-4 text-center">A</th>
                            <th className="px-6 py-4 text-center">B</th>
                            <th className="px-6 py-4 text-center">R</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan="12" className="px-6 py-4"><div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-full"></div></td>
                                </tr>
                            ))
                        ) : history.length === 0 ? (
                            <tr>
                                <td colSpan="12" className="px-6 py-12 text-center text-slate-400">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No upload history found.</p>
                                </td>
                            </tr>
                        ) : (
                            history.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                                            {record.id.split('-')[0].toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300 font-medium">
                                        {formatDate(record.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px]" title={record.file_name}>
                                                {record.file_name}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{record.campaign_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                            {record.lead_source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-rose-500">
                                        {record.errors_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                                        {record.submitted_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                                            {record.n_count}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-black">
                                            {record.a_count}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-black">
                                            {record.b_count}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-black">
                                            {record.r_count}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {record.upload_status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {record.r_count > 0 ? (
                                            <button
                                                onClick={() => downloadRejectedLeads(record)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                title="Download Rejected Leads"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-slate-300 dark:text-slate-600">No rejections</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Area */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/20">
                    <p className="text-xs text-slate-500">
                        Showing <span className="font-bold text-slate-700 dark:text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-bold text-slate-700 dark:text-slate-300">{totalCount}</span> records
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || isLoading}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center px-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || isLoading}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default UploadHistory;
