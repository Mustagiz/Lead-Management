import React, { useState, useEffect } from 'react';
import { Search, Download, Shield, Filter, RefreshCw, BarChart3, Users, Globe } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Button, Input, Card, Badge, StatCard } from '../common/UIComponents';

const InternalSuppressionManager = () => {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalRecords: 0,
        campaignsCovered: 0
    });

    const loadRecords = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('internal_suppression_list')
            .select('*')
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Error fetching internal suppression:', error);
            setLoading(false);
            return;
        }

        setRecords(data || []);
        setFilteredRecords(data || []);

        // Calculate stats
        const campaigns = new Set((data || []).map(r => r.campaign_name));
        setStats({
            totalRecords: (data || []).length,
            campaignsCovered: campaigns.size
        });
        setLoading(false);
    };

    useEffect(() => {
        loadRecords();
    }, []);

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        const filtered = records.filter(r =>
            (r.email || '').toLowerCase().includes(query) ||
            (r.campaign_name || '').toLowerCase().includes(query) ||
            (r.first_name || '').toLowerCase().includes(query) ||
            (r.last_name || '').toLowerCase().includes(query) ||
            (r.company || '').toLowerCase().includes(query)
        );
        setFilteredRecords(filtered);
    };

    const downloadCSV = () => {
        if (filteredRecords.length === 0) {
            alert('No records to download.');
            return;
        }

        const headers = ['Campaign Name', 'First Name', 'Last Name', 'Email', 'Company', 'Added By', 'Added At'];
        const rows = filteredRecords.map(r => [
            r.campaign_name,
            r.first_name,
            r.last_name,
            r.email,
            r.company,
            r.added_by,
            new Date(r.added_at).toLocaleString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `internal_suppression_list_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                    label="Total Suppression Records"
                    value={stats.totalRecords}
                    icon={Shield}
                    color="indigo"
                />
                <StatCard
                    label="Campaigns Tracked"
                    value={stats.campaignsCovered}
                    icon={Globe}
                    color="emerald"
                />
            </div>

            <Card className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by email, name, company or campaign..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="ghost" onClick={loadRecords} icon={RefreshCw} className="flex-1 md:flex-none">
                            Refresh
                        </Button>
                        <Button variant="primary" onClick={downloadCSV} icon={Download} className="flex-1 md:flex-none">
                            Download CSV
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Added By</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">Loading records...</td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No suppression records found.</td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {record.campaign_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                            {record.first_name} {record.last_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600 dark:text-indigo-400">
                                            {record.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-medium">
                                            {record.company}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {record.added_by}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(record.added_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default InternalSuppressionManager;
