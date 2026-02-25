import React from 'react';
import { X } from 'lucide-react';
import { Button, Card } from '../common/UIComponents';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <Card className="w-full max-w-md">
                <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                    <div className="flex justify-end gap-4">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button variant="danger" onClick={onConfirm}>Confirm</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ConfirmationModal;
