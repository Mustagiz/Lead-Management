import React, { useEffect, useState } from 'react';
import { X, Edit, User, Building2, Phone, MapPin, Tag, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Badge, Button } from '../common/UIComponents';
import { formatDisplayDate } from '../../utils/dateUtils';

const Field = ({ label, value, href }) => {
    if (!value) return null;
    return (
        <div className="py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
            {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1">
                    {value} <ExternalLink className="w-3 h-3" />
                </a>
            ) : (
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            )}
        </div>
    );
};

const Section = ({ title, icon: Icon, children }) => (
    <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</h4>
        </div>
        <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 px-4">
            {children}
        </div>
    </div>
);

const statusConfig = {
    qualified: { color: 'success', label: 'Qualified' },
    disqualified: { color: 'danger', label: 'Disqualified' },
    pending: { color: 'warning', label: 'Pending' },
    callback: { color: 'info', label: 'Callback' },
    'not interested': { color: 'info', label: 'Not Interested' },
    dnc: { color: 'danger', label: 'DNC' },
};

const LeadDetailDrawer = ({ lead, onClose, onEdit }) => {
    const [auditHistory, setAuditHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        if (!lead) return;
        const fetchHistory = async () => {
            setLoadingHistory(true);
            const { data } = await supabase
                .from('lead_audit_history')
                .select('*')
                .eq('lead_id', lead.id)
                .order('changed_at', { ascending: false });
            setAuditHistory(data || []);
            setLoadingHistory(false);
        };
        fetchHistory();
    }, [lead]);

    if (!lead) return null;

    const statusConf = statusConfig[lead.status] || { color: 'info', label: lead.status };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-slate-50 dark:bg-slate-950 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">
                            {lead.company_name || 'Lead Details'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={statusConf.color}>{statusConf.label}</Badge>
                            <span className="text-xs text-slate-400 font-medium">{lead.campaign}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={onEdit} className="text-xs px-3 py-1.5" icon={Edit}>
                            Edit
                        </Button>
                        <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">

                    {/* Basic Info */}
                    <Section title="Basic Info" icon={User}>
                        <Field label="Full Name" value={`${lead.salutation || ''} ${lead.first_name || ''} ${lead.last_name || ''}`.trim()} />
                        <Field label="Job Title" value={lead.job_title} />
                        <Field label="Department" value={lead.department} />
                        <Field label="Job Level" value={lead.job_level} />
                        <Field label="Tenure" value={lead.tenure} />
                    </Section>

                    {/* Contact */}
                    <Section title="Contact" icon={Phone}>
                        <Field label="Email" value={lead.email} href={lead.email ? `mailto:${lead.email}` : null} />
                        <Field label="Phone" value={lead.phone_no} />
                        <Field label="Direct Dial" value={lead.direct_dial} />
                        <Field label="Job Title Link" value={lead.job_title_link} href={lead.job_title_link} />
                    </Section>

                    {/* Company */}
                    <Section title="Company" icon={Building2}>
                        <Field label="Company" value={lead.company_name} />
                        <Field label="Industry" value={lead.industry_type} href={lead.industry_type_link} />
                        <Field label="Employee Size" value={lead.employee_size} href={lead.employee_size_link} />
                        <Field label="Associated Members" value={lead.associated_members} />
                        <Field label="Revenue Size" value={lead.revenue_size} href={lead.revenue_size_link} />
                        <Field label="Domain" value={lead.domain} />
                    </Section>

                    {/* Location */}
                    <Section title="Location" icon={MapPin}>
                        <Field label="Address" value={lead.address1} />
                        <Field label="City" value={lead.city} />
                        <Field label="State" value={lead.state} />
                        <Field label="Zip" value={lead.zip_code} />
                        <Field label="Country" value={lead.country} />
                    </Section>

                    {/* Status & Notes */}
                    <Section title="Status & Notes" icon={Tag}>
                        <Field label="Status" value={lead.status} />
                        <Field label="VV Status" value={lead.vv_status} />
                        <Field label="Agent" value={lead.ra_name} />
                        <Field label="Campaign" value={lead.campaign} />
                        <Field label="Date" value={formatDisplayDate(lead.date)} />
                        {lead.ra_comments && (
                            <div className="py-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Agent Comments</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 whitespace-pre-wrap">{lead.ra_comments}</p>
                            </div>
                        )}
                    </Section>

                    {/* Audit History */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Audit History</h4>
                        </div>
                        {loadingHistory ? (
                            <div className="text-center py-6 text-slate-400 text-sm">Loading history...</div>
                        ) : auditHistory.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-sm bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                No audit history recorded
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                                <div className="space-y-3">
                                    {auditHistory.map((entry, i) => (
                                        <div key={i} className="flex gap-3 items-start pl-2">
                                            <div className="w-[22px] h-[22px] rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center z-10">
                                                <ChevronRight className="w-3 h-3 text-white" />
                                            </div>
                                            <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 p-3 flex-1 text-xs">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-slate-900 dark:text-white capitalize">
                                                        {entry.field_changed || 'Status'} changed
                                                    </span>
                                                    <span className="text-slate-400 font-medium">
                                                        {new Date(entry.changed_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                {entry.old_value && (
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <span className="line-through">{entry.old_value}</span>
                                                        <ChevronRight className="w-3 h-3" />
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{entry.new_value}</span>
                                                    </div>
                                                )}
                                                {entry.changed_by_name && (
                                                    <p className="text-slate-400 mt-1">by {entry.changed_by_name}</p>
                                                )}
                                                {entry.notes && (
                                                    <p className="text-slate-500 mt-1 italic">{entry.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LeadDetailDrawer;
