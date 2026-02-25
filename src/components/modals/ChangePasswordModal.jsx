import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Button, Input, Card } from '../common/UIComponents';

const ChangePasswordModal = ({ user, onClose }) => {
    const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords don't match");
            return;
        }

        if (formData.newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: formData.newPassword
        });

        if (error) {
            setError(error.message);
        } else {
            alert('Password changed successfully');
            onClose();
        }
    };

    const toggleShow = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <Card className="w-full max-w-md">
                <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Change Password</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="relative">
                        <Input
                            label="Current Password"
                            type={showPasswords.current ? "text" : "password"}
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => toggleShow('current')}
                            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                        >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="relative">
                        <Input
                            label="New Password"
                            type={showPasswords.new ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => toggleShow('new')}
                            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                        >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="relative">
                        <Input
                            label="Confirm New Password"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => toggleShow('confirm')}
                            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                        >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>}

                    <div className="flex justify-end gap-4 mt-6">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button type="submit">
                            Change Password
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ChangePasswordModal;
