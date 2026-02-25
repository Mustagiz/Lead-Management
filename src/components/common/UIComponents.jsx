import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Button = ({ children, variant = 'primary', onClick, disabled, className = '', type = 'button' }) => {
    const baseStyles = 'px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm';
    const variants = {
        primary: 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 hover:shadow-indigo-200 dark:hover:shadow-indigo-900/20 hover:shadow-lg',
        secondary: 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-md',
        danger: 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-rose-100 dark:hover:shadow-rose-900/20 hover:shadow-lg',
        ghost: 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export const Input = ({ label, error, ...props }) => (
    <div className="mb-4">
        {label && <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-0.5">{label}</label>}
        <input
            {...props}
            className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white outline-none shadow-sm ${error ? 'border-rose-300 dark:border-rose-500/50 ring-2 ring-rose-50 dark:ring-rose-900/20' : 'border-gray-200 dark:border-slate-700'}`}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-rose-500 ml-0.5 animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
);

export const Select = ({ label, options, error, ...props }) => (
    <div className="mb-4">
        {label && <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-0.5">{label}</label>}
        <select
            {...props}
            className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none shadow-sm appearance-none cursor-pointer text-gray-900 dark:text-white ${error ? 'border-rose-300 dark:border-rose-500/50 ring-2 ring-rose-50 dark:ring-rose-900/20' : 'border-gray-200 dark:border-slate-700'}`}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {error && <p className="mt-1.5 text-xs font-medium text-rose-500 ml-0.5 animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
);

export const SearchableSelect = ({ label, value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes((value || '').toLowerCase())
    );

    const handleSelect = (selectedValue) => {
        onChange({ target: { value: selectedValue } });
        setIsOpen(false);
    };

    return (
        <div className="mb-4 relative">
            {label && <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</label>}
            <div className="relative">
                <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all pr-10 text-gray-900 dark:text-white"
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                />
                <div className="absolute right-3 top-3 pointer-events-none text-gray-400 dark:text-gray-500">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.map(opt => (
                        <li
                            key={opt.value}
                            className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer text-gray-700 dark:text-gray-200 text-sm"
                            onClick={() => handleSelect(opt.value)}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
        {children}
    </div>
);
