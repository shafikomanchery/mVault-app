
import React, { useState } from 'react';
import { Account } from '../../types';
import { CriticalityBadge, TagBadge } from '../Shared';
import { EyeIcon, EyeOffIcon, CalendarIcon, HistoryIcon, EditIcon, TrashIcon, CopyIcon, CheckIcon } from '../icons';
import useClipboard from '../../hooks/useClipboard';

const AccountCard: React.FC<{account: Account, onEdit: () => void, onDelete: () => void, onShowHistory: () => void}> = ({account, onEdit, onDelete, onShowHistory}) => {
    const [showPassword, setShowPassword] = useState(false);
    const { hasCopied, copyToClipboard } = useClipboard(30000);

    return (
        <div className="bg-gray-800/60 border border-gray-700/50 p-5 rounded-2xl shadow-xl hover:border-blue-500/30 transition-all flex flex-col group">
            <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg text-white truncate">{account.name}</h3>
                        <p className="text-sm text-gray-400 truncate">{account.username}</p>
                    </div>
                    <CriticalityBadge criticality={account.criticality} />
                </div>
                
                <TagBadge tags={account.tags} />

                {account.password && (
                    <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-700/50 rounded-xl px-3 py-2.5">
                        <input type={showPassword ? 'text' : 'password'} value={account.password} readOnly className="border-none bg-transparent w-full text-sm text-gray-200 focus:outline-none font-mono" />
                        <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
                            <button onClick={() => copyToClipboard(account.password!)} className="p-1.5 text-gray-400 hover:text-green-400" title="Copy">
                                {hasCopied ? <CheckIcon className="w-4 h-4 text-green-500"/> : <CopyIcon className="w-4 h-4"/>}
                            </button>
                            <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-gray-400 hover:text-white" title={showPassword ? "Hide" : "Show"}>
                                {showPassword ? <EyeOffIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                            </button>
                        </div>
                    </div>
                )}
                
                {account.url && <a href={account.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs truncate block">{account.url}</a>}
                
                {account.expiryDate && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-500/70 uppercase">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        Expires: {new Date(account.expiryDate).toLocaleDateString()}
                    </div>
                )}
            </div>

             <div className="flex justify-end gap-1 pt-4 mt-4 border-t border-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onShowHistory} className="p-2 text-gray-500 hover:text-blue-400 transition-colors"><HistoryIcon className="w-5 h-5"/></button>
                <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-400 transition-colors"><EditIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </div>
    )
}

export default AccountCard;
