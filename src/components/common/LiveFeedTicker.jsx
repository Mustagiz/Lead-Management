import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Target, TrendingUp, Clock } from 'lucide-react';

const LiveFeedTicker = () => {
    const [updates, setUpdates] = useState([]);

    useEffect(() => {
        // Subscribe to new leads
        const channel = supabase
            .channel('public:leads')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
                const newLead = {
                    id: payload.new.id,
                    company: payload.new.company_name,
                    agent: payload.new.ra_name,
                    campaign: payload.new.campaign,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setUpdates(prev => [newLead, ...prev].slice(0, 5));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (updates.length === 0) return null;

    return (
        <div className="bg-indigo-600 dark:bg-indigo-900/40 text-white overflow-hidden py-2 px-4 shadow-inner relative z-10">
            <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
                {updates.map((update, index) => (
                    <div key={`${update.id}-${index}`} className="flex items-center gap-2 text-sm font-medium">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="opacity-70 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {update.timestamp}
                        </span>
                        <span className="font-bold flex items-center gap-1">
                            <Target className="w-3 h-3" /> {update.agent}
                        </span>
                        <span>added</span>
                        <span className="font-bold underline decoration-indigo-300 underline-offset-4">{update.company}</span>
                        <span className="opacity-70">to</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded-lg text-xs uppercase tracking-tighter flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> {update.campaign}
                        </span>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .animate-marquee {
                    display: inline-flex;
                    animation: marquee 30s linear infinite;
                }
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

export default LiveFeedTicker;
