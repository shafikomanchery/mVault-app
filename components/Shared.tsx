
import React from 'react';
import { Criticality, VaultItem } from '../types';
import { AlertTriangleIcon, TagIcon } from './icons';

export const CriticalityBadge: React.FC<{criticality: Criticality}> = ({criticality}) => {
    const colors = {
        High: 'bg-red-500/10 text-red-400 border-red-500/20',
        Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        Low: 'bg-green-500/10 text-green-400 border-green-500/20',
    }
    return <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${colors[criticality]}`}>{criticality}</span>
}

export const TagBadge: React.FC<{tags?: string[]}> = ({tags}) => {
    if (!tags || tags.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => (
                <span key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-gray-700/50 text-gray-300 text-[10px] font-medium rounded-md border border-gray-600/50">
                    <TagIcon className="w-2.5 h-2.5 opacity-50" />
                    {tag}
                </span>
            ))}
        </div>
    );
}

export const Modal: React.FC<{children: React.ReactNode, title: string, onClose: () => void}> = ({children, title, onClose}) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2">&times;</button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

export const ConfirmationModal: React.FC<{item: VaultItem; onConfirm: () => void; onCancel: () => void;}> = ({ item, onConfirm, onCancel }) => {
    const getTitle = (item: VaultItem) => {
        if ('name' in item) return item.name;
        if ('title' in item) return item.title;
        if ('text' in item) return item.text;
        return 'Untitled';
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-900/20 border border-red-500/20 mb-4">
                       <AlertTriangleIcon className="h-7 w-7 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Delete this item?</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        You are about to permanently remove <span className="text-gray-100 font-bold">"{getTitle(item)}"</span>. This cannot be undone.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold transition-colors shadow-lg shadow-red-900/20">Delete Forever</button>
                </div>
            </div>
        </div>
    );
};
