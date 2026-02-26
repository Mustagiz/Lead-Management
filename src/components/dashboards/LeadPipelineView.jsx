import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle, XCircle, Clock, PhoneCall, MinusCircle, ShieldOff, TrendingUp } from 'lucide-react';
import { Card } from '../common/UIComponents';

const STATUS_CONFIG = [
    { key: 'pending', label: 'Pending', icon: Clock, color: '#f59e0b', bg: 'bg-amber-50  dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800/30', text: 'text-amber-700 dark:text-amber-300' },
    { key: 'callback', label: 'Callback', icon: PhoneCall, color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-200 dark:border-indigo-800/30', text: 'text-indigo-700 dark:text-indigo-300' },
    { key: 'not interested', label: 'Not Interested', icon: MinusCircle, color: '#64748b', bg: 'bg-slate-50  dark:bg-slate-900/20', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400' },
    { key: 'dnc', label: 'DNC', icon: ShieldOff, color: '#ef4444', bg: 'bg-rose-50   dark:bg-rose-900/10', border: 'border-rose-200 dark:border-rose-800/30', text: 'text-rose-700 dark:text-rose-300' },
    { key: 'qualified', label: 'Qualified', icon: CheckCircle, color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800/30', text: 'text-emerald-700 dark:text-emerald-300' },
    { key: 'disqualified', label: 'Disqualified', icon: XCircle, color: '#f43f5e', bg: 'bg-rose-50   dark:bg-rose-900/10', border: 'border-rose-200 dark:border-rose-800/30', text: 'text-rose-700 dark:text-rose-300' },
];

const LeadPipelineView = ({ leads, users }) => {

    // Status counts
    const statusCounts = useMemo(() =>
        STATUS_CONFIG.reduce((acc, s) => {
            acc[s.key] = leads.filter(l => (l.status || '').toLowerCase() === s.key).length;
            return acc;
        }, {}),
        [leads]);

    const total = leads.length;

    // Daily trend for the last 14 days
    const trendData = useMemo(() => {
        const days = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLeads = leads.filter(l => l.date === dateStr);
            days.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                qualified: dayLeads.filter(l => l.status === 'qualified').length,
                pending: dayLeads.filter(l => l.status === 'pending').length,
                disqualified: dayLeads.filter(l => l.status === 'disqualified').length,
                total: dayLeads.length,
            });
        }
        return days;
    }, [leads]);

    // Per-agent breakdown
    const agentBreakdown = useMemo(() => {
        const employees = users.filter(u => u.role === 'employee');
        return employees.map(u => {
            const agentLeads = leads.filter(l => l.employee_id === u.id);
            return {
                name: u.name,
                total: agentLeads.length,
                qualified: agentLeads.filter(l => l.status === 'qualified').length,
                pending: agentLeads.filter(l => l.status === 'pending').length,
                disqualified: agentLeads.filter(l => l.status === 'disqualified').length,
                rate: agentLeads.length > 0 ? ((agentLeads.filter(l => l.status === 'qualified').length / agentLeads.length) * 100).toFixed(1) : '0.0',
            };
        }).sort((a, b) => b.total - a.total);
    }, [leads, users]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Funnel Cards */}
            <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Lead Status Funnel
                    <span className="ml-auto text-sm font-semibold text-slate-400">{total} total leads</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {STATUS_CONFIG.map(s => {
                        const count = statusCounts[s.key] || 0;
                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                        const Icon = s.icon;
                        return (
                            <div key={s.key} className={`relative rounded-2xl border p-4 ${s.bg} ${s.border} flex flex-col items-center text-center group hover:scale-105 transition-transform duration-200`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2`} style={{ background: `${s.color}20` }}>
                                    <Icon className="w-5 h-5" style={{ color: s.color }} />
                                </div>
                                <div className={`text-3xl font-black mb-0.5 ${s.text}`}>{count}</div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight">{s.label}</div>
                                <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: s.color }} />
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Trend Chart */}
            <Card className="p-6">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-6">14-Day Lead Volume Trend</h3>
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                        <Line type="monotone" dataKey="total" name="Total" stroke="#6366f1" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="qualified" name="Qualified" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="disqualified" name="Disqualified" stroke="#f43f5e" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* Agent Breakdown */}
            <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Agent Performance Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                {['Agent', 'Total', 'Qualified', 'Pending', 'Disqualified', 'Conv. Rate'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {agentBreakdown.length === 0 ? (
                                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">No agent data</td></tr>
                            ) : agentBreakdown.map(a => (
                                <tr key={a.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-black text-indigo-700 dark:text-indigo-300">
                                                {a.name?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{a.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300">{a.total}</td>
                                    <td className="px-5 py-3 text-sm font-bold text-emerald-600">{a.qualified}</td>
                                    <td className="px-5 py-3 text-sm font-bold text-amber-600">{a.pending}</td>
                                    <td className="px-5 py-3 text-sm font-bold text-rose-500">{a.disqualified}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 w-16">
                                                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(parseFloat(a.rate), 100)}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{a.rate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default LeadPipelineView;
