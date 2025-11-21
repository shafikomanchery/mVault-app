import React from 'react';
import { Criticality, VaultItem } from '../types';
import { AlertTriangleIcon } from './icons';

export const CriticalityBadge: React.FC<{criticality: Criticality}> = ({criticality}) => {
    const colors = {
        High: 'bg-red-500/20 text-red-300',
        Medium: 'bg-yellow-500/20 text-yellow-300',
        Low: 'bg-green-500/20 text-green-300',
    }
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[criticality]}`}>{criticality}</span>
}

export const Modal: React.FC<{children: React.ReactNode, title: string, onClose: () => void}> = ({children, title, onClose}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
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
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900">
                       <AlertTriangleIcon className="h-6 w-6 text-red-400" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">Delete Item?</h3>
                    <div className="mt-2 text-sm text-gray-400">
                        <p>Are you sure you want to delete this item?</p>
                        <p className="font-medium text-gray-300 mt-1">"{getTitle(item)}"</p>
                        <p className="mt-1">This action cannot be undone.</p>
                    </div>
                </div>
                <div className="bg-gray-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={onConfirm}
                    >
                        Delete
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-500 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};