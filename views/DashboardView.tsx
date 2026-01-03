import React, { useMemo } from 'react';
import { VaultItem, Account, Event, Todo } from '../types';
import { CriticalityBadge } from '../components/Shared';
// FIX: Removed ClockIcon from imports as it is defined locally at the bottom of this file
import { AlertTriangleIcon, CalendarIcon, CheckSquareIcon, VaultIcon, StickyNoteIcon, ListTodoIcon, EditIcon, TrashIcon } from '../components/icons';

const ItemList: React.FC<{items: VaultItem[], onEdit: (item: VaultItem) => void, onDelete: (id: string) => void}> = ({items, onEdit, onDelete}) => {
    if (items.length === 0) return <p className="text-gray-500 text-sm italic">No items to display.</p>

    const getIcon = (type: VaultItem['type']) => {
        switch(type) {
            case 'account': return <VaultIcon className="w-5 h-5 text-blue-400/70" />;
            case 'note': return <StickyNoteIcon className="w-5 h-5 text-yellow-400/70" />;
            case 'event': return <CalendarIcon className="w-5 h-5 text-indigo-400/70" />;
            case 'todo': return <ListTodoIcon className="w-5 h-5 text-green-400/70" />;
        }
    }
    
    const getTitle = (item: VaultItem) => {
        if ('name' in item) return item.name;
        if ('title' in item) return item.title;
        if ('text' in item) return item.text;
        return 'Untitled';
    }

    const getDateLabel = (item: VaultItem) => {
        if (item.type === 'account' && item.expiryDate) return `Expires: ${new Date(item.expiryDate).toLocaleDateString()}`;
        if (item.type === 'event' && item.date) return `Date: ${new Date(item.date).toLocaleDateString()}`;
        if (item.type === 'todo' && item.dueDate) return `Due: ${new Date(item.dueDate).toLocaleDateString()}`;
        return null;
    }
    
    return <ul className="space-y-3">
        {items.map(item => (
            <li key={item.id} className="flex items-center justify-between p-3 bg-gray-700/40 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors group">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                        {getIcon(item.type)}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-100 truncate">{getTitle(item)}</span>
                            <CriticalityBadge criticality={item.criticality} />
                        </div>
                        {getDateLabel(item) && (
                            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">
                                {getDateLabel(item)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => onEdit(item)} className="p-2 text-gray-500 hover:text-blue-400 transition-colors" title="Edit"><EditIcon className="w-4 h-4"/></button>
                    <button onClick={() => onDelete(item.id)} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Delete"><TrashIcon className="w-4 h-4"/></button>
                </div>
            </li>
        ))}
    </ul>
}

const DashboardView: React.FC<{items: VaultItem[], onEdit: (item: VaultItem) => void, onDelete: (id: string) => void}> = ({items, onEdit, onDelete}) => {
    const highPriorityItems = useMemo(() => items.filter(item => item.criticality === 'High').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [items]);
    const highCriticalityCount = useMemo(() => items.filter(item => item.criticality === 'High').length, [items]);
    
    const now = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(now.getDate() + 30);

    const expiringSoonItems = useMemo(() => {
        return items
            .filter((item): item is Account => item.type === 'account' && !!item.expiryDate)
            .filter(account => {
                const expiry = new Date(account.expiryDate!);
                return expiry > now && expiry <= futureLimit;
            })
            .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
    }, [items, now, futureLimit]);

    const upcomingDeadlines = useMemo(() => {
        const events = items.filter((item): item is Event => item.type === 'event');
        const todos = items.filter((item): item is Todo => item.type === 'todo' && !item.completed && !!item.dueDate);
        
        const combined = [...events, ...todos]
            .filter(item => {
                const itemDate = new Date(item.type === 'event' ? item.date : item.dueDate!);
                return itemDate >= new Date(new Date().setHours(0,0,0,0));
            })
            .sort((a, b) => {
                const dateA = new Date(a.type === 'event' ? a.date : a.dueDate!).getTime();
                const dateB = new Date(b.type === 'event' ? b.date : b.dueDate!).getTime();
                return dateA - dateB;
            })
            .slice(0, 6);
        
        return combined;
    }, [items]);

    const AlertsPanel = () => {
        const alerts = [];

        if (highCriticalityCount > 0) {
            alerts.push(
                <div key="critical" className="bg-red-900/20 border border-red-700/30 text-red-300 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-red-900/40 p-2 rounded-lg">
                        <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Security Attention</h3>
                        <p className="text-xs text-red-300/80">You have {highCriticalityCount} high-criticality item{highCriticalityCount > 1 ? 's' : ''} stored.</p>
                    </div>
                </div>
            );
        }

        if (expiringSoonItems.length > 0) {
            alerts.push(
                <div key="expiring" className="bg-yellow-900/20 border border-yellow-700/30 text-yellow-300 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-yellow-900/40 p-2 rounded-lg">
                        <ClockIcon className="w-6 h-6 flex-shrink-0 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Password Rotations</h3>
                        <p className="text-xs text-yellow-300/80">{expiringSoonItems.length} account{expiringSoonItems.length > 1 ? 's' : ''} require password updates soon.</p>
                    </div>
                </div>
            );
        }

        if (alerts.length > 0) {
            return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{alerts}</div>;
        }

        return (
            <div className="bg-green-900/20 border border-green-700/30 text-green-300 p-4 rounded-xl flex items-center gap-4">
                <div className="bg-green-900/40 p-2 rounded-lg">
                    <CheckSquareIcon className="w-6 h-6 flex-shrink-0 text-green-400" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Vault Secure</h3>
                    <p className="text-xs text-green-300/80">No immediate actions or upcoming password expirations found.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <header>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h2>
                <p className="text-gray-500 text-sm mt-1">Overview of your vault's security and schedule.</p>
            </header>
            
            <AlertsPanel />

            {expiringSoonItems.length > 0 && (
                <section className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <ClockIcon className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-xl font-bold text-white">Expiring Passwords</h3>
                    </div>
                    <ItemList items={expiringSoonItems} onEdit={onEdit} onDelete={onDelete} />
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarIcon className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-xl font-bold text-white">Upcoming Items</h3>
                    </div>
                    <ItemList items={upcomingDeadlines} onEdit={onEdit} onDelete={onDelete} />
                </section>
                
                <section className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangleIcon className="w-5 h-5 text-red-400" />
                        <h3 className="text-xl font-bold text-white">Critical Items</h3>
                    </div>
                    <ItemList items={highPriorityItems} onEdit={onEdit} onDelete={onDelete} />
                </section>
            </div>
        </div>
    )
}

// Add local ClockIcon since it's used here
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);

export default DashboardView;