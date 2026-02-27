import React, { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

export const Button = ({ children, variant = 'primary', onClick, disabled, isLoading, className = '', type = 'button', icon: Icon, as: Component = 'button', ...props }) => {
    const baseStyles = 'relative px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm overflow-hidden group';

    const variants = {
        primary: 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white hover:shadow-indigo-500/25 dark:hover:shadow-indigo-900/40 hover:shadow-xl hover:-translate-y-0.5',
        secondary: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md',
        danger: 'bg-gradient-to-br from-rose-500 to-red-600 text-white hover:shadow-rose-500/25 hover:shadow-xl hover:-translate-y-0.5',
        ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
        glass: 'glass text-slate-900 dark:text-white hover:bg-white/40 dark:hover:bg-slate-800/40 border-white/20'
    };

    return (
        <Component
            type={Component === 'button' ? type : undefined}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    {Icon && <Icon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />}
                    {children}
                </>
            )}
        </Component>
    );
};

export const Input = ({ label, error, icon: Icon, suffix, ...props }) => (
    <div className="w-full">
        {label && <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
        <div className="relative group">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Icon className="w-4 h-4" />
                </div>
            )}
            <input
                {...props}
                className={`w-full ${Icon ? 'pl-11' : 'px-4'} ${suffix ? 'pr-11' : 'px-4'} py-3 bg-white dark:bg-slate-900/50 border dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-100 outline-none shadow-sm ${error ? 'border-rose-500 ring-rose-500/10' : 'border-slate-200 hover:border-slate-300 dark:hover:border-slate-700'}`}
            />
            {suffix && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                    {suffix}
                </div>
            )}
        </div>
        {error && <p className="mt-1.5 text-xs font-semibold text-rose-500 ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <span className="w-1 h-1 rounded-full bg-rose-500"></span>
            {error}
        </p>}
    </div>
);

export const Select = ({ label, options, error, ...props }) => (
    <div className="w-full">
        {label && <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
        <div className="relative">
            <select
                {...props}
                className={`w-full px-4 py-3 bg-white dark:bg-slate-900/50 border dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm appearance-none cursor-pointer text-slate-900 dark:text-slate-100 ${error ? 'border-rose-500 ring-rose-500/10' : 'border-slate-200 dark:border-slate-800'}`}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-transform group-focus-within:rotate-180">
                <ChevronDown className="w-4 h-4" />
            </div>
        </div>
        {error && <p className="mt-1.5 text-xs font-semibold text-rose-500 ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
);

export const SearchableSelect = ({ label, value, onChange, options, placeholder, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedOption = options.find(opt => String(opt.value) === String(value));
    const displayValue = isOpen ? search : (selectedOption ? selectedOption.label : search);

    const filteredOptions = options.filter(opt =>
        String(opt.label || '').toLowerCase().includes(search.toLowerCase()) ||
        String(opt.value || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (selectedValue) => {
        onChange({ target: { value: selectedValue } });
        setSearch('');
        setIsOpen(false);
    };

    const handleInputChange = (e) => {
        setSearch(e.target.value);
        if (!isOpen) setIsOpen(true);
        // We don't call the parent onChange immediately on every keystroke if it's for searching
        // but the current dashboards expect the parent to handle the value.
        // To avoid breaking existing logic, we still call it.
        onChange(e);
    };

    return (
        <div className="w-full relative group">
            {label && <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
            <div className="relative">
                <input
                    type="text"
                    className={`w-full px-4 py-3 bg-white dark:bg-slate-900/50 border dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm text-slate-900 dark:text-slate-100 ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearch('');
                    }}
                    onBlur={() => setTimeout(() => {
                        setIsOpen(false);
                        setSearch('');
                    }, 200)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 glass rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200 border border-slate-200/50 dark:border-slate-700/50">
                    <ul className="max-h-60 overflow-y-auto py-2">
                        {filteredOptions.map(opt => (
                            <li
                                key={String(opt.value)}
                                className="px-4 py-2.5 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 transition-colors cursor-pointer text-slate-700 dark:text-slate-300 text-sm font-medium"
                                onClick={() => handleSelect(opt.value)}
                            >
                                {opt.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const Card = ({ children, className = '', glass = false }) => (
    <div className={`rounded-3xl border transition-all duration-300 ${glass ? 'glass' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'} ${className}`}>
        {children}
    </div>
);

export const Badge = ({ children, variant = 'primary' }) => {
    const variants = {
        primary: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
        success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
        warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800',
        danger: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-100 dark:border-rose-800',
        info: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-100 dark:border-sky-800',
        neutral: 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-100 dark:border-slate-800'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${variants[variant]}`}>
            {children}
        </span>
    );
};

export const StatCard = ({ label, value, icon: Icon, trend, trendValue, color = 'indigo' }) => {
    const colors = {
        indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200/50 dark:shadow-indigo-900/20',
        emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200/50 dark:shadow-emerald-900/20',
        amber: 'from-amber-500 to-amber-600 shadow-amber-200/50 dark:shadow-amber-900/20',
        rose: 'from-rose-500 to-rose-600 shadow-rose-200/50 dark:shadow-rose-900/20'
    };

    return (
        <Card className="p-6 relative overflow-hidden group hover:scale-[1.02] transform transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-4 shadow-lg group-hover:rotate-6 transition-transform duration-300`}>
                    {Icon && <Icon className="w-6 h-6 text-white" />}
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-end gap-2">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white font-display leading-none">{value}</h3>
                    {trendValue && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md mb-0.5 ${trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                            {trend === 'up' ? '+' : '-'}{trendValue}%
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );
};
