import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, Upload, X, Search, Download, Edit } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Button, Input, Card, Badge, SearchableSelect } from '../common/UIComponents';

const SuppressionListManager = ({ campaigns, currentUser }) => {
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [list, setList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEntry, setNewEntry] = useState({ type: 'email', value: '' });
    const [editingId, setEditingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [bulkEditType, setBulkEditType] = useState('email');
    const ITEMS_PER_PAGE = 10;

    const fetchList = useCallback(async () => {
        if (!selectedCampaignId) {
            setList([]);
            return;
        }
        setIsLoading(true);
        const { data, error } = await supabase
            .from('suppression_list')
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
        if (!newEntry.value || !selectedCampaignId) return;

        if (editingId) {
            const { error } = await supabase
                .from('suppression_list')
                .update({
                    identifier_type: newEntry.type,
                    identifier_value: newEntry.value
                })
                .eq('id', editingId);

            if (error) {
                alert('Error updating identifier: ' + error.message);
            } else {
                setNewEntry({ type: 'email', value: '' });
                setEditingId(null);
                setShowAddModal(false);
                fetchList();
            }
        } else {
            const { error } = await supabase
                .from('suppression_list')
                .insert([{
                    campaign_id: selectedCampaignId,
                    identifier_type: newEntry.type,
                    identifier_value: newEntry.value,
                    added_by: currentUser.id
                }]);

            if (error) {
                alert('Error adding identifier: ' + error.message);
            } else {
                setNewEntry({ type: 'email', value: '' });
                setShowAddModal(false);
                fetchList();
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this identifier?')) return;
        const { error } = await supabase.from('suppression_list').delete().eq('id', id);
        if (!error) fetchList();
        else alert('Error deleting: ' + error.message);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;
        const { error } = await supabase
            .from('suppression_list')
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
        const { error } = await supabase
            .from('suppression_list')
            .update({ identifier_type: bulkEditType })
            .in('id', selectedIds);

        if (!error) {
            setShowBulkEditModal(false);
            setSelectedIds([]);
            fetchList();
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
        if (!window.confirm(`WARNING: This will delete ALL ${list.length} items for this campaign. This action cannot be undone. Are you sure?`)) return;

        const { error } = await supabase
            .from('suppression_list')
            .delete()
            .eq('campaign_id', selectedCampaignId);

        if (!error) {
            fetchList();
            setSelectedIds([]);
        } else {
            alert('Error deleting all items: ' + error.message);
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

            const headers = rows[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const typeIndex = headers.indexOf('identifier_type') !== -1 ? headers.indexOf('identifier_type') : headers.indexOf('type');
            const valueIndex = headers.indexOf('identifier_value') !== -1 ? headers.indexOf('identifier_value') :
                (headers.indexOf('value') !== -1 ? headers.indexOf('value') : headers.indexOf('identifier'));

            const entries = rows.slice(1).map(row => {
                const parts = row.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                let type = 'email';
                let value = '';

                if (valueIndex !== -1 && parts[valueIndex]) {
                    value = parts[valueIndex];
                    if (typeIndex !== -1 && parts[typeIndex]) {
                        type = ['email', 'phone', 'domain'].includes(parts[typeIndex].toLowerCase()) ? parts[typeIndex].toLowerCase() : 'email';
                    } else {
                        // Auto-detect type if missing
                        if (value.includes('@')) type = 'email';
                        else if (value.includes('.') && !/\d/.test(value)) type = 'domain';
                        else if (/\d/.test(value)) type = 'phone';
                    }
                } else {
                    // Positional fallback if headers didn't help
                    if (parts.length >= 2) {
                        type = ['email', 'phone', 'domain'].includes(parts[0].toLowerCase()) ? parts[0].toLowerCase() : 'email';
                        value = parts[1];
                    } else {
                        value = parts[0];
                        if (value.includes('@')) type = 'email';
                        else if (value.includes('.') && !/\d/.test(value)) type = 'domain';
                        else if (/\d/.test(value)) type = 'phone';
                    }
                }

                return {
                    campaign_id: selectedCampaignId,
                    identifier_type: type,
                    identifier_value: value,
                    added_by: currentUser.id
                };
            }).filter(en => en.identifier_value);

            if (entries.length === 0) {
                alert('No valid entries found in CSV');
                return;
            }

            const { error } = await supabase.from('suppression_list').insert(entries);
            if (error) alert('Error during bulk import: ' + error.message);
            else {
                alert(`Successfully imported ${entries.length} identifiers`);
                fetchList();
            }
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const headers = 'identifier_type,identifier_value\nemail,test@example.com\ndomain,competitor.com\nphone,+1234567890';
        const blob = new Blob([headers], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'suppression_template.csv';
        a.click();
    };

    const filteredList = list.filter(item =>
        item.identifier_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.identifier_type.toLowerCase().includes(searchTerm.toLowerCase())
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
                                id="suppression-upload"
                            />
                            <Button
                                as="label"
                                htmlFor="suppression-upload"
                                variant="secondary"
                                icon={Upload}
                                className="cursor-pointer"
                            >
                                Bulk Upload
                            </Button>
                        </div>
                        <Button onClick={() => { setEditingId(null); setNewEntry({ type: 'email', value: '' }); setShowAddModal(true); }} variant="primary" icon={Plus}>
                            Add Entry
                        </Button>
                    </div>
                )}
            </div>

            {!selectedCampaignId ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                    <div className="bg-gray-100 dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Campaign Selected</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">Select a campaign from the dropdown above to manage its suppression list identifiers.</p>
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-slate-800/30">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search list..."
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
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Identifier Value</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Added At</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">Loading identifiers...</td></tr>
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
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={item.identifier_type === 'email' ? 'info' : item.identifier_type === 'domain' ? 'warning' : 'neutral'}>
                                                    {item.identifier_type}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {item.identifier_value}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(item.added_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setNewEntry({ type: item.identifier_type, value: item.identifier_value });
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
                    <Card className="w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Bulk Edit Type</h3>
                            <button onClick={() => setShowBulkEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">New Type</label>
                                <select
                                    value={bulkEditType}
                                    onChange={(e) => setBulkEditType(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="domain">Domain</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <Button variant="secondary" onClick={() => setShowBulkEditModal(false)}>Cancel</Button>
                                <Button onClick={handleBulkEdit}>Apply to {selectedIds.length} items</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <Card className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Entry' : 'Add Entry'}</h3>
                            <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select
                                    value={newEntry.type}
                                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="domain">Domain</option>
                                </select>
                            </div>
                            <Input
                                label="Identifier Value"
                                placeholder={newEntry.type === 'email' ? 'e.g. user@competitor.com' : newEntry.type === 'domain' ? 'e.g. competitor.com' : 'e.g. +1234567890'}
                                value={newEntry.value}
                                onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })}
                                required
                            />
                            <div className="flex justify-end gap-3 mt-8">
                                <Button variant="secondary" onClick={() => { setShowAddModal(false); setEditingId(null); }}>Cancel</Button>
                                <Button type="submit">{editingId ? 'Save Changes' : 'Add to List'}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

// Re-importing missing icon
const XCircle = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" />
    </svg>
);

export default SuppressionListManager;
