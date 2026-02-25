import React, { useState } from 'react';
import { BarChart3, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Card } from '../common/UIComponents';

const LoginPage = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        let finalEmail = formData.username.trim();
        if (!finalEmail.includes('@')) {
            finalEmail = `${finalEmail}@ovmkr.site`;
        }

        const result = await login(finalEmail, formData.password);
        if (!result.success) {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-2xl">
                <div className="text-center p-8 border-b border-gray-100 dark:border-slate-800">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 transform -rotate-6 transition-transform hover:rotate-0">
                        <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Lead Manager Pro
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <Input
                        label="Email or Username"
                        type="text"
                        placeholder="username@ovmkr.site"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />

                    <div className="relative">
                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full mb-4">
                        Login
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;
