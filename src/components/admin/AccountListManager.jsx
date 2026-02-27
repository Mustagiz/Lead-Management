import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, Upload, X, Search, Download, ShieldCheck } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Button, Input, Card, SearchableSelect } from '../common/UIComponents';

const AccountListManager = ({ campaigns, currentUser }) => {
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [list, setList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEntry, setNewEntry] = useState({ name: '', domain: '', accountId: '' });

    const fetchList = useCallback(async () => {
        if (!selectedCampaignId) {
            setList([]);
            return;
        }
        setIsLoading(true);
        const { data, error } = await supabase
            .from('campaign_account_list')
            .select('*')
            .eq('campaign_id', selectedCampaignId)
            .order('added_at', { ascending: false });

        if (!error) setList(data || []);
        setIsLoading(false);
    }, [selectedCampaignId]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if ((!newEntry.name && !newEntry.domain && !newEntry.accountId) || !selectedCampaignId) return;

        const { error } = await supabase
            .from('campaign_account_list')
            .insert([{
                campaign_id: selectedCampaignId,
                account_name: newEntry.name,
                account_domain: newEntry.domain,
                account_id: newEntry.accountId,
                is_active: true
            }]);

        if (error) {
            alert('Error adding account: ' + error.message);
        } else {
            setNewEntry({ name: '', domain: '', accountId: '' });
            setShowAddModal(false);
            fetchList();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this account?')) return;
        const { error } = await supabase.from('campaign_account_list').delete().eq('id', id);
        if (!error) fetchList();
        else alert('Error deleting: ' + error.message);
    };

    const handleBulkUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !selectedCampaignId) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const text = evt.target.result;
            const rows = text.split('\n').map(r => r.trim()).filter(Boolean);
            // Expected format: Name,Domain,AccountID (any can be empty but not all)
            const entries = rows.slice(1).map(row => {
                const parts = row.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                return {
                    campaign_id: selectedCampaignId,
                    account_name: parts[0] || null,
                    account_domain: parts[1] || null,
                    account_id: parts[2] || null,
                    is_active: true
                };
            }).filter(en => en.account_name || en.account_domain || en.account_id);

            if (entries.length === 0) {
                alert('No valid entries found in CSV');
                return;
            }

            const { error } = await supabase.from('campaign_account_list').insert(entries);
            if (error) alert('Error during bulk import: ' + error.message);
            else {
                alert(`Successfully imported ${entries.length} accounts`);
                fetchList();
            }
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const headers = 'account_name,account_domain,account_id\nGoogle,google.com,EXT-001\nMicrosoft,microsoft.com,EXT-002\nApple,apple.com,';
        const blob = new Blob([headers], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'account_list_template.csv';
        a.click();
    };

    const filteredList = list.filter(item =>
        (item.account_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.account_domain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.account_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-full md:w-1/3">
                    <SearchableSelect
                        label="Select Campaign"
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                        options={campaigns.map(c => ({ value: c.id, label: c.name }))}
                        placeholder="Choose a campaign to manage..."
                    />
                </div>
                {selectedCampaignId && (
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative inline-block">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleBulkUpload}
                                className="hidden"
                                id="account-upload"
                            />
                            <Button
                                as="label"
                                htmlFor="account-upload"
                                variant="secondary"
                                icon={Upload}
                                className="cursor-pointer"
                            >
                                Bulk Upload
                            </Button>
                        </div>
                        <Button onClick={() => setShowAddModal(true)} variant="primary" icon={Plus}>
                            Add Account
                        </Button>
                    </div>
                )}
            </div>

            {!selectedCampaignId ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                    <div className="bg-gray-100 dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Campaign Selected</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">Select a campaign from the dropdown above to manage its allowed accounts whitelist.</p>
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-slate-800/30">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search accounts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <button onClick={downloadTemplate} className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline">
                            <Download className="w-3 h-3" /> Download Template
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Account Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Domain</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Account ID</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">Loading accounts...</td></tr>
                                ) : filteredList.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">No accounts found matching your search.</td></tr>
                                ) : (
                                    filteredList.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {item.account_name || <span className="text-gray-400 italic">No name</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {item.account_domain || <span className="text-gray-400 italic">No domain</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {item.account_id || <span className="text-gray-400 italic">No ID</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <Card className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Whitelist Account</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <Input
                                label="Company Name"
                                placeholder="e.g. Google"
                                value={newEntry.name}
                                onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                            />
                            <Input
                                label="Domain"
                                placeholder="e.g. google.com"
                                value={newEntry.domain}
                                onChange={(e) => setNewEntry({ ...newEntry, domain: e.target.value })}
                            />
                            <Input
                                label="Account ID (External)"
                                placeholder="e.g. ACC-123"
                                value={newEntry.accountId}
                                onChange={(e) => setNewEntry({ ...newEntry, accountId: e.target.value })}
                            />
                            <p className="text-[10px] text-gray-500 italic">Note: A lead is accepted if it matches ANY of the provided fields above.</p>
                            <div className="flex justify-end gap-3 mt-8">
                                <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                <Button type="submit">Add to Whitelist</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AccountListManager;
