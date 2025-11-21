
import React, { useState } from 'react';
import { Account } from '../../types';
import { CriticalityBadge } from '../Shared';
import { EyeIcon, EyeOffIcon, CalendarIcon, HistoryIcon, EditIcon, TrashIcon, CopyIcon, CheckIcon } from '../icons';
import useClipboard from '../../hooks/useClipboard';

const AccountCard: React.FC<{account: Account, onEdit: () => void, onDelete: () => void, onShowHistory: () => void}> = ({account, onEdit, onDelete, onShowHistory}) => {
    const [showPassword, setShowPassword] = useState(false);
    const { hasCopied, copyToClipboard } = useClipboard(30000); // Clear after 30s

    const handleCopy = () => {
        if (account.password) {
            copyToClipboard(account.password);
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md space-y-3 flex flex-col">
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-white">{account.name}</h3>
                        <p className="text-sm text-gray-400">{account.username}</p>
                    </div>
                    <CriticalityBadge criticality={account.criticality} />
                </div>
                {account.password && <div className="flex items-center gap-2 mt-2 bg-gray-700 rounded px-2 py-1">
                    <input type={showPassword ? 'text' : 'password'} value={account.password} readOnly className="border-none bg-transparent w-full text-sm text-gray-200 focus:outline-none" />
                    <div className="flex items-center border-l border-gray-600 pl-2 gap-1">
                        <button onClick={handleCopy} className="p-1 text-gray-400 hover:text-green-400" title="Copy Password">
                            {hasCopied ? <CheckIcon className="w-4 h-4 text-green-500"/> : <CopyIcon className="w-4 h-4"/>}
                        </button>
                        <button onClick={() => setShowPassword(!showPassword)} className="p-1 text-gray-400 hover:text-white" title={showPassword ? "Hide" : "Show"}>
                            {showPassword ? <EyeOffIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                        </button>
                    </div>
                </div>}
                {account.url && <a href={account.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all block mt-2">{account.url}</a>}
                {account.expiryDate && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                        <CalendarIcon className="w-4 h-4" />
                        Expires: {new Date(account.expiryDate).toLocaleDateString()}
                    </p>
                )}
            </div>
             <div className="flex justify-end gap-2 pt-2 border-t border-gray-700 mt-3">
                <button onClick={onShowHistory} className="p-2 text-gray-400 hover:text-green-400" aria-label="View History"><HistoryIcon className="w-5 h-5"/></button>
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-400" aria-label="Edit Item"><EditIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400" aria-label="Delete Item"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </div>
    )
}

export default AccountCard;
