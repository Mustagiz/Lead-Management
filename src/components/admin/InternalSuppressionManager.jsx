import React, { useState, useEffect } from 'react';
import { Search, Download, Shield, RefreshCw, Globe } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Button, Card, StatCard } from '../common/UIComponents';

const InternalSuppressionManager = () => {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalRecords: 0,
        campaignsCovered: 0
    });
    const [syncing, setSyncing] = useState(false);

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

    const syncHistoricalLeads = async () => {
        setSyncing(true);
        try {
            // 1. Fetch all leads
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select('campaign, first_name, last_name, email, company_name, ra_name, created_at');

            if (leadsError) throw leadsError;

            // 2. Fetch existing suppression emails to avoid duplicates
            const { data: existing, error: existingError } = await supabase
                .from('internal_suppression_list')
                .select('email');

            if (existingError) throw existingError;

            const existingEmails = new Set((existing || []).map(e => e.email.toLowerCase()));

            // 3. Filter leads that aren't suppressed yet (unique by email)
            const seenInBatch = new Set();
            const toInsert = (leads || [])
                .filter(l => l.email && !existingEmails.has(l.email.toLowerCase()) && !seenInBatch.has(l.email.toLowerCase()))
                .map(l => {
                    seenInBatch.add(l.email.toLowerCase());
                    return {
                        campaign_name: l.campaign || 'Historical Data',
                        first_name: l.first_name,
                        last_name: l.last_name,
                        email: l.email,
                        company: l.company_name,
                        added_by: l.ra_name || 'System Backfill',
                        added_at: l.created_at
                    };
                });

            if (toInsert.length === 0) {
                alert('No new leads to sync. Suppression list is already up to date.');
                setSyncing(false);
                return;
            }

            // 4. Batch insert (Supabase handles up to a few thousand well)
            // If there's a lot, we might need chunks, but for now we'll try one batch or simple loop
            const { error: insertError } = await supabase
                .from('internal_suppression_list')
                .insert(toInsert);

            if (insertError) throw insertError;

            alert(`Successfully synced ${toInsert.length} historical leads to the suppression list!`);
            loadRecords();
        } catch (err) {
            console.error('Sync failed:', err);
            alert('Failed to sync leads: ' + err.message);
        } finally {
            setSyncing(false);
        }
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
                        <Button
                            variant="secondary"
                            onClick={syncHistoricalLeads}
                            disabled={syncing}
                            isLoading={syncing}
                            icon={RefreshCw}
                            className="flex-1 md:flex-none border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                        >
                            Sync Historical Leads
                        </Button>
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
