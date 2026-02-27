import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Card } from '../common/UIComponents';

const CampaignModal = ({ campaign, onClose, onSuccess }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState(
        campaign ? { ...campaign } : {
            name: '',
            description: '',
            isActive: true,
            account_list_enabled: false,
            customQuestions: []
        }
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (campaign) {
            const { error } = await supabase
                .from('campaigns')
                .update({
                    name: formData.name,
                    description: formData.description,
                    is_active: formData.isActive,
                    account_list_enabled: formData.account_list_enabled,
                    custom_questions: formData.customQuestions
                })
                .eq('id', campaign.id);

            if (error) {
                alert('Error updating campaign: ' + error.message);
                return;
            }
        } else {
            const { error } = await supabase
                .from('campaigns')
                .insert({
                    name: formData.name,
                    description: formData.description,
                    is_active: formData.isActive,
                    account_list_enabled: formData.account_list_enabled,
                    custom_questions: formData.customQuestions,
                    created_by: currentUser.name
                });

            if (error) {
                alert('Error creating campaign: ' + error.message);
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
                            {campaign ? 'Edit Campaign' : 'Create Campaign'}
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <Input
                        label="Campaign Name *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Enter campaign name"
                    />

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Custom Questions ({formData.customQuestions?.length || 0}/10)
                            </label>
                            {(formData.customQuestions?.length || 0) < 10 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newQuestions = [...(formData.customQuestions || [])];
                                        newQuestions.push({ id: Date.now(), question: '', order: newQuestions.length + 1 });
                                        setFormData({ ...formData, customQuestions: newQuestions });
                                    }}
                                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                                >
                                    + Add Question
                                </button>
                            )}
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {formData.customQuestions?.map((q, index) => (
                                <div key={q.id} className="flex gap-2">
                                    <Input
                                        value={q.question}
                                        onChange={(e) => {
                                            const newQuestions = [...formData.customQuestions];
                                            newQuestions[index].question = e.target.value;
                                            setFormData({ ...formData, customQuestions: newQuestions });
                                        }}
                                        placeholder={`Question ${index + 1}`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newQuestions = formData.customQuestions.filter((_, i) => i !== index);
                                            setFormData({ ...formData, customQuestions: newQuestions });
                                        }}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {(!formData.customQuestions || formData.customQuestions.length === 0) && (
                                <p className="text-sm text-gray-500 italic">No custom questions added.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mb-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Active Campaign</span>
                        </label>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.account_list_enabled}
                                onChange={(e) => setFormData({ ...formData, account_list_enabled: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Enable Account Whitelist</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button type="submit">
                            {campaign ? 'Update Campaign' : 'Create Campaign'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default CampaignModal;
