import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { formatDisplayDate } from '../../utils/dateUtils';
import { Card } from '../common/UIComponents';

const AdminBreakHistoryModal = ({ user, onClose }) => {
    const [breakData, setBreakData] = useState({ total_break_seconds: 0, breaks: [] });
    const [now, setNow] = useState(Date.now());
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchBreaks = async () => {
            const { data, error } = await supabase
                .from('breaks_monitoring')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle();
            if (!error && data) {
                setBreakData(data);
            }
        };
        fetchBreaks();
    }, [user.id, today]);

    const formatTime = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(hrs > 0 ? 2 : 1, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const currentBreakSecs = breakData.current_break_start ? Math.floor((now - new Date(breakData.current_break_start).getTime()) / 1000) : 0;
    const totalSecs = (breakData.total_break_seconds || 0) + currentBreakSecs;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}'s Break History</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Today: {formatDisplayDate(today)}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Card className="p-4 bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/20">
                            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Total Break Time</p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatTime(totalSecs)}</p>
                        </Card>
                        <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/20">
                            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Break Count</p>
                            <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{breakData.breaks.length + (breakData.current_break_start ? 1 : 0)}</p>
                        </Card>
                    </div>

                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">#</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Start</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">End</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                            {breakData.breaks.map((b, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{i + 1}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{new Date(b.startTime).toLocaleTimeString()}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{new Date(b.endTime).toLocaleTimeString()}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-purple-600 dark:text-purple-400">
                                        {formatTime(b.durationSeconds || b.duration * 60)}
                                    </td>
                                </tr>
                            ))}
                            {breakData.current_break_start && (
                                <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{breakData.breaks.length + 1}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{new Date(breakData.current_break_start).toLocaleTimeString()}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">In Progress</td>
                                    <td className="px-4 py-3 text-sm font-medium text-purple-600 dark:text-purple-400 animate-pulse">
                                        {formatTime(currentBreakSecs)}
                                    </td>
                                </tr>
                            )}
                            {breakData.breaks.length === 0 && !breakData.current_break_start && (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No breaks taken today.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminBreakHistoryModal;
