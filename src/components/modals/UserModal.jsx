import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Select, Card } from '../common/UIComponents';

const UserModal = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(
        user ? { ...user } : { name: '', username: '', password: '', role: 'employee' }
    );
    const [showPassword, setShowPassword] = useState(false);
    const { createUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (user) {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    role: formData.role
                })
                .eq('id', user.id);

            if (error) {
                alert('Error updating profile: ' + error.message);
                return;
            }
        } else {
            let finalEmail = formData.username.trim();
            if (!finalEmail.includes('@')) {
                finalEmail = `${finalEmail}@ovmkr.site`;
            }

            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', finalEmail)
                .maybeSingle();

            if (existingProfile) {
                alert(`User Already Exists: "${finalEmail}" is already in your user list.`);
                return;
            }

            const result = await createUser({
                ...formData,
                username: finalEmail
            });
            if (!result.success) {
                alert('Error adding user: ' + result.error);
                return;
            }
        }

        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <Card className="w-full max-w-md">
                <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {user ? 'Edit User' : 'Add User'}
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <Input
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <Input
                        label="Email"
                        placeholder="username@ovmkr.site"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />

                    {!user && (
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
                    )}

                    <Select
                        label="Role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        options={[
                            { value: 'employee', label: 'Employee' },
                            { value: 'qa', label: 'QA' },
                            { value: 'admin', label: 'Admin' }
                        ]}
                    />

                    <div className="flex justify-end gap-4 mt-6">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button type="submit">
                            {user ? 'Update User' : 'Add User'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default UserModal;
