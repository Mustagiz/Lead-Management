import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { X, CheckCircle, XCircle, Clock, Edit, AlertCircle } from 'lucide-react';
import { Card } from './UIComponents';

const ACTION_META = {
    qualified: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/20', label: 'Qualified' },
    disqualified: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/20', label: 'Disqualified' },
    tbd: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/20', label: 'Marked TBD' },
    updated: { icon: Edit, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20', label: 'Updated' },
    default: { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Changed' },
};

const LeadTimeline = ({ lead, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('audit_log')
                .select('*')
                .eq('lead_id', lead.id)
                .order('created_at', { ascending: false });

            if (!error && data) setLogs(data);
            setLoading(false);
        };
        fetchLogs();
    }, [lead.id]);

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <Card className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-none max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Audit History</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {lead.first_name} {lead.last_name} — {lead.company_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Timeline */}
                <div className="p-5 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No audit history found</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Actions on this lead will appear here</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-slate-800" />
                            <div className="space-y-5">
                                {logs.map((log, idx) => {
                                    const meta = ACTION_META[log.action] || ACTION_META.default;
                                    const Icon = meta.icon;
                                    return (
                                        <div key={log.id || idx} className="flex gap-4 relative">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${meta.bg} flex items-center justify-center z-10 ring-4 ring-white dark:ring-slate-900`}>
                                                <Icon className={`w-5 h-5 ${meta.color}`} />
                                            </div>
                                            <div className="flex-1 pb-2">
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {meta.label}
                                                    <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">by {log.qa_name || 'System'}</span>
                                                </p>
                                                {log.details && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{log.details}</p>
                                                )}
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(log.created_at)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default LeadTimeline;
