import React, { useMemo } from 'react';
import { VaultItem, Account } from '../types';
import { CriticalityBadge } from '../components/Shared';
import { AlertTriangleIcon, CalendarIcon, CheckSquareIcon, VaultIcon, StickyNoteIcon, ListTodoIcon, EditIcon, TrashIcon } from '../components/icons';

const ItemList: React.FC<{items: VaultItem[], onEdit: (item: VaultItem) => void, onDelete: (id: string) => void}> = ({items, onEdit, onDelete}) => {
    if (items.length === 0) return <p className="text-gray-400">No items to display.</p>

    const getIcon = (type: VaultItem['type']) => {
        switch(type) {
            case 'account': return <VaultIcon className="w-5 h-5 text-gray-400" />;
            case 'note': return <StickyNoteIcon className="w-5 h-5 text-gray-400" />;
            case 'event': return <CalendarIcon className="w-5 h-5 text-gray-400" />;
            case 'todo': return <ListTodoIcon className="w-5 h-5 text-gray-400" />;
        }
    }
    
    const getTitle = (item: VaultItem) => {
        if ('name' in item) return item.name;
        if ('title' in item) return item.title;
        if ('text' in item) return item.text;
        return 'Untitled';
    }
    
    return <ul className="space-y-2">
        {items.map(item => (
            <li key={item.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600">
                <div className="flex items-center gap-3">
                    {getIcon(item.type)}
                    <span className="font-medium">{getTitle(item)}</span>
                    <CriticalityBadge criticality={item.criticality} />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(item)} className="p-1 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => onDelete(item.id)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </li>
        ))}
    </ul>
}

const DashboardView: React.FC<{items: VaultItem[], onEdit: (item: VaultItem) => void, onDelete: (id: string) => void}> = ({items, onEdit, onDelete}) => {
    const highPriorityItems = useMemo(() => items.filter(item => item.criticality === 'High').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [items]);
    const recentItems = useMemo(() => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [items]);
    const highCriticalityCount = useMemo(() => items.filter(item => item.criticality === 'High').length, [items]);
    
    const expiringSoonItems = useMemo(() => {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        return items
            .filter((item): item is Account => item.type === 'account' && !!item.expiryDate)
            .filter(account => {
                const expiry = new Date(account.expiryDate!);
                return expiry > now && expiry <= thirtyDaysFromNow;
            })
            .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
    }, [items]);

    const AlertsPanel = () => {
        const alerts = [];

        if (highCriticalityCount > 0) {
            alerts.push(
                <div key="critical" className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center gap-4">
                    <AlertTriangleIcon className="w-8 h-8 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold">Attention Required</h3>
                        <p>You have {highCriticalityCount} high-criticality item{highCriticalityCount > 1 ? 's' : ''} that may require your attention.</p>
                    </div>
                </div>
            );
        }

        if (expiringSoonItems.length > 0) {
            alerts.push(
                <div key="expiring" className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-4 rounded-lg flex items-center gap-4">
                    <CalendarIcon className="w-8 h-8 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold">Expiring Soon</h3>
                        <p>You have {expiringSoonItems.length} account password{expiringSoonItems.length > 1 ? 's' : ''} expiring within 30 days.</p>
                    </div>
                </div>
            );
        }

        if (alerts.length > 0) {
            return <div className="space-y-4">{alerts}</div>;
        }

        return (
            <div className="bg-green-900/50 border border-green-700 text-green-300 p-4 rounded-lg flex items-center gap-4">
                <CheckSquareIcon className="w-8 h-8 flex-shrink-0" />
                <div>
                    <h3 className="font-bold">All Clear</h3>
                    <p>No high-criticality or expiring items found. Keep up the great work!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold">Dashboard</h2>
            </div>
            
            <AlertsPanel />

            {expiringSoonItems.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4 text-yellow-300">Expiring Soon</h3>
                    <ItemList items={expiringSoonItems} onEdit={onEdit} onDelete={onDelete} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">High Priority Items</h3>
                    <ItemList items={highPriorityItems} onEdit={onEdit} onDelete={onDelete} />
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Recently Added</h3>
                    <ItemList items={recentItems} onEdit={onEdit} onDelete={onDelete} />
                </div>
            </div>
        </div>
    )
}

export default DashboardView;