import React, { useState } from 'react';
import { Account } from '../types';
import { Modal } from './Shared';
import { EyeIcon, EyeOffIcon } from './icons';

const HistoryModal: React.FC<{ account: Account; onClose: () => void }> = ({ account, onClose }) => {
    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

    const togglePasswordVisibility = (index: number) => {
        setVisiblePasswords(prev => ({ ...prev, [index]: !prev[index] }));
    };

    return (
        <Modal title={`History for ${account.name}`} onClose={onClose}>
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {account.history.length > 0 ? (
                    account.history.map((entry, index) => (
                        <div key={index} className="p-3 bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
                            <p className="font-semibold capitalize">{entry.field} changed</p>
                            {entry.field === 'password' && entry.oldValue ? (
                                <div className="text-sm text-gray-300 mt-1">
                                    <p>Previous value:</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type={visiblePasswords[index] ? 'text' : 'password'}
                                            value={entry.oldValue}
                                            readOnly
                                            className="border-none bg-gray-600 rounded px-2 py-1 w-full text-sm"
                                        />
                                        <button onClick={() => togglePasswordVisibility(index)} className="p-1 text-gray-400 hover:text-white">
                                            {visiblePasswords[index] ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            ) : entry.oldValue && (
                                <p className="text-sm text-gray-300 mt-1">From: "{entry.oldValue}" to "{entry.newValue}"</p>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400">No history available for this account.</p>
                )}
            </div>
        </Modal>
    );
};

export default HistoryModal;