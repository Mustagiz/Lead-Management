import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, Upload, X, Search, Download, ShieldCheck, Edit } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Button, Input, Card, SearchableSelect } from '../common/UIComponents';

const AccountListManager = ({ campaigns, currentUser }) => {
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [list, setList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEntry, setNewEntry] = useState({ name: '', domain: '', accountId: '' });
    const [editingId, setEditingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [bulkEditData, setBulkEditData] = useState({ name: '', domain: '', accountId: '' });
    const ITEMS_PER_PAGE = 10;

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

        if (!error) {
            setList(data || []);
            setCurrentPage(1);
            setSelectedIds([]);
        }
        setIsLoading(false);
    }, [selectedCampaignId]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if ((!newEntry.name && !newEntry.domain && !newEntry.accountId) || !selectedCampaignId) return;

        if (editingId) {
            const { error } = await supabase
                .from('campaign_account_list')
                .update({
                    account_name: newEntry.name,
                    account_domain: newEntry.domain,
                    account_id: newEntry.accountId
                })
                .eq('id', editingId);

            if (error) {
                alert('Error updating account: ' + error.message);
            } else {
                setNewEntry({ name: '', domain: '', accountId: '' });
                setEditingId(null);
                setShowAddModal(false);
                fetchList();
            }
        } else {
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
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this account?')) return;
        const { error } = await supabase.from('campaign_account_list').delete().eq('id', id);
        if (!error) fetchList();
        else alert('Error deleting: ' + error.message);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} accounts?`)) return;
        const { error } = await supabase
            .from('campaign_account_list')
            .delete()
            .in('id', selectedIds);

        if (!error) {
            fetchList();
            setSelectedIds([]);
        } else {
            alert('Error in bulk delete: ' + error.message);
        }
    };

    const handleBulkEdit = async () => {
        const updateData = {};
        if (bulkEditData.name) updateData.account_name = bulkEditData.name;
        if (bulkEditData.domain) updateData.account_domain = bulkEditData.domain;
        if (bulkEditData.accountId) updateData.account_id = bulkEditData.accountId;

        if (Object.keys(updateData).length === 0) {
            alert('Please fill at least one field to update');
            return;
        }

        const { error } = await supabase
            .from('campaign_account_list')
            .update(updateData)
            .in('id', selectedIds);

        if (!error) {
            setShowBulkEditModal(false);
            setSelectedIds([]);
            fetchList();
            setBulkEditData({ name: '', domain: '', accountId: '' });
        } else {
            alert('Error in bulk edit: ' + error.message);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedList.length && paginatedList.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedList.map(item => item.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleDeleteAll = async () => {
        if (!window.confirm(`WARNING: This will delete ALL ${list.length} accounts for this campaign. This action cannot be undone. Are you sure?`)) return;

        const { error } = await supabase
            .from('campaign_account_list')
            .delete()
            .eq('campaign_id', selectedCampaignId);

        if (!error) {
            fetchList();
            setSelectedIds([]);
        } else {
            alert('Error deleting all accounts: ' + error.message);
        }
    };

    const handleBulkUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !selectedCampaignId) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const text = evt.target.result;
            const rows = text.split('\n').map(r => r.trim()).filter(Boolean);
            if (rows.length < 2) {
                alert('CSV must contain at least a header and one data row');
                return;
            }

            // Enhanced parsing: identify columns by header names
            const headers = rows[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const colIndex = {
                name: headers.indexOf('account_name') !== -1 ? headers.indexOf('account_name') : headers.indexOf('name'),
                domain: headers.indexOf('account_domain') !== -1 ? headers.indexOf('account_domain') : headers.indexOf('domain'),
                id: headers.indexOf('account_id') !== -1 ? headers.indexOf('account_id') : headers.indexOf('id')
            };

            // Fallback for ID if not found (sometimes labeled as 'external_id' etc)
            if (colIndex.id === -1) colIndex.id = headers.findIndex(h => h.includes('id'));
            if (colIndex.name === -1) colIndex.name = 0; // Default to first col
            if (colIndex.domain === -1) colIndex.domain = 1; // Default to second col

            const entries = rows.slice(1).map((row, index) => {
                const parts = row.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                const entry = {
                    campaign_id: selectedCampaignId,
                    account_name: colIndex.name !== -1 ? (parts[colIndex.name] || null) : null,
                    account_domain: colIndex.domain !== -1 ? (parts[colIndex.domain] || null) : null,
                    account_id: colIndex.id !== -1 ? (parts[colIndex.id] || null) : null,
                    is_active: true
                };
                return entry;
            }).filter(en => en.account_name || en.account_domain || en.account_id);

            if (entries.length === 0) {
                alert('No valid entries (with name, domain, or ID) found in CSV');
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

    const paginatedList = filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
    }, [searchTerm]);

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
                        <Button onClick={() => { setEditingId(null); setNewEntry({ name: '', domain: '', accountId: '' }); setShowAddModal(true); }} variant="primary" icon={Plus}>
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

                    {selectedIds.length > 0 && (
                        <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-800/20 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{selectedIds.length} selected</span>
                                <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-800/30" />
                                <div className="flex gap-2">
                                    <button onClick={() => setShowBulkEditModal(true)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline">Bulk Edit</button>
                                    <button onClick={handleBulkDelete} className="text-xs font-bold text-rose-600 hover:text-rose-700 underline">Delete Selected</button>
                                </div>
                            </div>
                            <button onClick={handleDeleteAll} className="text-xs font-bold text-rose-600 hover:text-rose-700 underline">Delete All Records</button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === paginatedList.length && paginatedList.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Account Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Domain</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Account ID</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">Loading accounts...</td></tr>
                                ) : (
                                    paginatedList.map(item => (
                                        <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors ${selectedIds.includes(item.id) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => toggleSelect(item.id)}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {item.account_name || <span className="text-gray-400 italic">No name</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {item.account_domain || <span className="text-gray-400 italic">No domain</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {item.account_id || <span className="text-gray-400 italic">No ID</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setNewEntry({ name: item.account_name || '', domain: item.account_domain || '', accountId: item.account_id || '' });
                                                        setEditingId(item.id);
                                                        setShowAddModal(true);
                                                    }}
                                                    className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
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
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/10">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="py-1 px-4 text-xs font-bold">Prev</Button>
                                <Button variant="secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="py-1 px-4 text-xs font-bold">Next</Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {showBulkEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <Card className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Bulk Edit Accounts</h3>
                            <button onClick={() => setShowBulkEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <Input
                                label="Update Company Name"
                                placeholder="Leave blank to keep original"
                                value={bulkEditData.name}
                                onChange={(e) => setBulkEditData({ ...bulkEditData, name: e.target.value })}
                            />
                            <Input
                                label="Update Domain"
                                placeholder="Leave blank to keep original"
                                value={bulkEditData.domain}
                                onChange={(e) => setBulkEditData({ ...bulkEditData, domain: e.target.value })}
                            />
                            <Input
                                label="Update Account ID"
                                placeholder="Leave blank to keep original"
                                value={bulkEditData.accountId}
                                onChange={(e) => setBulkEditData({ ...bulkEditData, accountId: e.target.value })}
                            />
                            <div className="flex justify-end gap-3 mt-8">
                                <Button variant="secondary" onClick={() => setShowBulkEditModal(false)}>Cancel</Button>
                                <Button onClick={handleBulkEdit}>Apply to {selectedIds.length} accounts</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <Card className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Whitelist Account' : 'Add Whitelist Account'}</h3>
                            <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
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
                                <Button variant="secondary" onClick={() => { setShowAddModal(false); setEditingId(null); }}>Cancel</Button>
                                <Button type="submit">{editingId ? 'Save Changes' : 'Add to Whitelist'}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AccountListManager;
