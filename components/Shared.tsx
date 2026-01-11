
import React from 'react';
import { Criticality, VaultItem } from '../types';
import { AlertTriangleIcon, TagIcon } from './icons';

export const CriticalityBadge: React.FC<{criticality: Criticality}> = ({criticality}) => {
    const colors = {
        High: 'bg-red-500/10 text-red-400 border-red-500/20',
        Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        Low: 'bg-green-500/10 text-green-400 border-green-500/20',
    }
    return <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${colors[criticality]}`}>{criticality}</span>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div 
                className="bg-[#1e293b] border-t sm:border border-gray-700 rounded-t-[32px] sm:rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 duration-300" 
                onClick={e => e.stopPropagation()}
            >
                {/* Drag Handle for Mobile */}
                <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mt-4 mb-1 sm:hidden opacity-50" />
                
                <div className="p-5 sm:p-6 border-b border-gray-700/50 flex justify-between items-center">
                    <h3 className="text-xl font-extrabold text-white tracking-tight">{title}</h3>
                    <button onClick={onClose} className="bg-gray-800 text-gray-400 hover:text-white transition-colors w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold">&times;</button>
                </div>
                <div className="p-5 sm:p-8 max-h-[85vh] sm:max-h-[75vh] overflow-y-auto custom-scrollbar">
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-[32px] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-3xl bg-red-500/10 border border-red-500/20 mb-6">
                       <AlertTriangleIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3">Delete Item?</h3>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed px-2">
                        You are removing <span className="text-gray-100 font-bold">"{getTitle(item)}"</span>. This action is final and cannot be undone.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={onConfirm} className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-2xl text-white font-bold transition-all shadow-xl shadow-red-900/20 active:scale-95">Delete Forever</button>
                    <button onClick={onCancel} className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-2xl text-gray-400 font-bold transition-all active:scale-95">Keep It</button>
                </div>
            </div>
        </div>
    );
};
