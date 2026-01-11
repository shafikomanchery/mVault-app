
import React, { useState } from 'react';
import { Account } from '../../types';
import { CriticalityBadge } from '../Shared';
import { EyeIcon, EyeOffIcon, HistoryIcon, EditIcon, TrashIcon, CopyIcon, CheckIcon, KeyIcon } from '../icons';
import useClipboard from '../../hooks/useClipboard';

const AccountCard: React.FC<{account: Account, onEdit: () => void, onDelete: () => void, onShowHistory: () => void}> = ({account, onEdit, onDelete, onShowHistory}) => {
    const [showPassword, setShowPassword] = useState(false);
    const { hasCopied: hasCopiedPass, copyToClipboard: copyPass } = useClipboard(3000);
    const { hasCopied: hasCopiedUser, copyToClipboard: copyUser } = useClipboard(3000);

    return (
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 p-4 rounded-2xl hover:bg-gray-800/60 hover:border-blue-500/30 transition-all flex flex-col gap-3 group shadow-sm hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl shrink-0">
                        <KeyIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-sm text-white truncate leading-tight">{account.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 group/user">
                            <p className="text-[10px] text-gray-400 truncate font-medium">{account.username}</p>
                            <button 
                                onClick={(e) => { e.stopPropagation(); copyUser(account.username); }}
                                className={`shrink-0 transition-colors p-0.5 rounded ${hasCopiedUser ? 'text-green-500' : 'text-gray-600 hover:text-blue-400'}`}
                            >
                                {hasCopiedUser ? <CheckIcon className="w-3 h-3"/> : <CopyIcon className="w-3 h-3"/>}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="shrink-0 pt-0.5">
                    <CriticalityBadge criticality={account.criticality} />
                </div>
            </div>

            {account.password && (
                <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-700/40 rounded-xl px-3 py-2.5">
                    <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={account.password} 
                        readOnly 
                        className="border-none bg-transparent w-full text-xs text-gray-300 focus:outline-none font-mono tracking-wider" 
                    />
                    <div className="flex items-center gap-1 border-l border-gray-700/50 pl-2">
                        <button 
                            onClick={() => copyPass(account.password!)} 
                            className={`p-1.5 transition-all active:scale-90 ${hasCopiedPass ? 'text-green-500' : 'text-gray-400 hover:text-green-400'}`}
                        >
                            {hasCopiedPass ? <CheckIcon className="w-4 h-4"/> : <CopyIcon className="w-4 h-4"/>}
                        </button>
                        <button 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="p-1.5 text-gray-400 hover:text-white transition-all active:scale-90"
                        >
                            {showPassword ? <EyeOffIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                <div className="min-w-0 flex-1">
                    {account.url && (
                        <a 
                            href={account.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-400/80 hover:text-blue-400 text-[10px] font-bold truncate block underline decoration-blue-400/20"
                        >
                            {account.url.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={onShowHistory} className="p-2 text-gray-500 hover:text-blue-400 transition-colors" title="History"><HistoryIcon className="w-4 h-4"/></button>
                    <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-400 transition-colors" title="Edit"><EditIcon className="w-4 h-4"/></button>
                    <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Delete"><TrashIcon className="w-4 h-4"/></button>
                </div>
            </div>
        </div>
    );
};

export default AccountCard;
