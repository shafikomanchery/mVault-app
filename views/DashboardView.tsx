
import React, { useMemo } from 'react';
import { VaultItem, Account, Event, Todo, View, AccountType } from '../types';
import { CriticalityBadge } from '../components/Shared';
import { 
    AlertTriangleIcon, CalendarIcon, CheckSquareIcon, VaultIcon, 
    StickyNoteIcon, ListTodoIcon, ChevronLeftIcon 
} from '../components/icons';

const StatCard: React.FC<{ 
    icon: React.ReactNode, 
    count: number, 
    label: string, 
    color: string, 
    onClick: () => void,
    subNote?: string 
}> = ({ icon, count, label, color, onClick, subNote }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 bg-gray-800/40 border border-gray-700/50 rounded-2xl hover:border-blue-500/30 transition-all active:scale-95 group relative overflow-hidden"
    >
        <div className={`p-2 rounded-xl mb-2 ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
            {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
        </div>
        <span className="text-xl font-extrabold text-white">{count}</span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
        {subNote && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </div>
        )}
    </button>
);

const TimelineItem: React.FC<{ item: VaultItem, onNavigate: (view: View, category?: AccountType) => void }> = ({ item, onNavigate }) => {
    const getIcon = () => {
        switch(item.type) {
            case 'account': return <VaultIcon className="w-4 h-4 text-blue-400" />;
            case 'note': return <StickyNoteIcon className="w-4 h-4 text-yellow-400" />;
            case 'event': return <CalendarIcon className="w-4 h-4 text-indigo-400" />;
            case 'todo': return <ListTodoIcon className="w-4 h-4 text-green-400" />;
        }
    };

    const getTitle = () => {
        if ('name' in item) return item.name;
        if ('title' in item) return item.title;
        if ('text' in item) return item.text;
        return 'Untitled';
    };

    const getDate = () => {
        if (item.type === 'account' && item.expiryDate) return new Date(item.expiryDate);
        if (item.type === 'event' && item.date) return new Date(item.date);
        if (item.type === 'todo' && item.dueDate) return new Date(item.dueDate);
        return null;
    };

    const date = getDate();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDate = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;
    const isOverdue = itemDate && itemDate < today && !('completed' in item && item.completed);
    
    const getRelativeLabel = () => {
        if (!date) return "";
        if (isOverdue) return "Overdue";
        const diffDays = Math.ceil((itemDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Tomorrow";
        if (diffDays < 7) return `In ${diffDays} days`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const handleItemClick = () => {
        const viewMap: Record<VaultItem['type'], View> = {
            'account': 'vault',
            'note': 'notes',
            'event': 'events',
            'todo': 'todos'
        };
        const category = item.type === 'account' ? item.accountType : undefined;
        onNavigate(viewMap[item.type], category);
    };

    return (
        <li 
            onClick={handleItemClick}
            className={`flex items-center justify-between p-3.5 sm:p-4 bg-gray-800/20 border border-gray-700/50 rounded-2xl hover:bg-gray-800/40 hover:border-blue-500/30 cursor-pointer transition-all active:bg-gray-800/60 group`}
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className={`p-2.5 rounded-xl shrink-0 ${isOverdue ? 'bg-red-500/10' : 'bg-gray-800/80'}`}>
                    {getIcon()}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-sm sm:text-base text-gray-100 truncate group-hover:text-white">{getTitle()}</p>
                        <div className="hidden xs:block"><CriticalityBadge criticality={item.criticality} /></div>
                    </div>
                    <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-0.5 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                        {getRelativeLabel()} {item.type === 'account' && ' • Expiry'}
                    </p>
                </div>
            </div>
            <div className="shrink-0 ml-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <ChevronLeftIcon className="w-4 h-4 rotate-180 text-blue-400" />
            </div>
        </li>
    );
};

const DashboardView: React.FC<{ items: VaultItem[], onNavigate: (view: View, category?: AccountType) => void }> = ({ items, onNavigate }) => {
    const stats = useMemo(() => ({
        accounts: items.filter(i => i.type === 'account').length,
        notes: items.filter(i => i.type === 'note').length,
        events: items.filter(i => i.type === 'event').length,
        todos: items.filter(i => i.type === 'todo').length,
        criticalCount: items.filter(i => i.criticality === 'High').length
    }), [items]);

    const groupedTimeline = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const futureLimit = new Date(today);
        futureLimit.setDate(today.getDate() + 30); // 30 day range

        const relevant = items.filter(i => {
            const d = i.type === 'event' ? i.date : i.type === 'todo' ? i.dueDate : i.type === 'account' ? i.expiryDate : null;
            if (!d) return false;
            const date = new Date(d);
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            // Show if overdue OR within next 30 days
            return dateOnly < futureLimit && !('completed' in i && i.completed);
        }).sort((a, b) => {
            const getD = (i: VaultItem) => {
                const d = i.type === 'event' ? i.date : i.type === 'todo' ? i.dueDate : i.type === 'account' ? i.expiryDate : null;
                return new Date(d!).getTime();
            };
            return getD(a) - getD(b);
        });

        const groups: { label: string, items: VaultItem[] }[] = [];
        const overdue = relevant.filter(i => {
             const d = i.type === 'event' ? i.date : i.type === 'todo' ? i.dueDate : i.type === 'account' ? i.expiryDate : null;
             return new Date(d!) < today;
        });
        const todayItems = relevant.filter(i => {
             const d = i.type === 'event' ? i.date : i.type === 'todo' ? i.dueDate : i.type === 'account' ? i.expiryDate : null;
             const date = new Date(d!);
             return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() === today.getTime();
        });
        const upcoming = relevant.filter(i => {
             const d = i.type === 'event' ? i.date : i.type === 'todo' ? i.dueDate : i.type === 'account' ? i.expiryDate : null;
             const date = new Date(d!);
             return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() > today.getTime();
        });

        if (overdue.length > 0) groups.push({ label: 'Action Required', items: overdue });
        if (todayItems.length > 0) groups.push({ label: 'Today', items: todayItems });
        if (upcoming.length > 0) groups.push({ label: 'Upcoming (30 Days)', items: upcoming });

        return groups;
    }, [items]);

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <header className="px-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Welcome to Vault</h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1 font-medium">Your security center is updated.</p>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <StatCard 
                    icon={<VaultIcon />} 
                    count={stats.accounts} 
                    label="Accounts" 
                    color="text-blue-400" 
                    onClick={() => onNavigate('vault')} 
                    subNote={stats.criticalCount > 0 ? `${stats.criticalCount} Critical` : undefined}
                />
                <StatCard icon={<StickyNoteIcon />} count={stats.notes} label="Notes" color="text-yellow-400" onClick={() => onNavigate('notes')} />
                <StatCard icon={<CalendarIcon />} count={stats.events} label="Events" color="text-indigo-400" onClick={() => onNavigate('events')} />
                <StatCard icon={<ListTodoIcon />} count={stats.todos} label="Tasks" color="text-green-400" onClick={() => onNavigate('todos')} />
            </div>

            {/* Smart Grouped Timeline Feed */}
            <section className="space-y-6 pt-2">
                {groupedTimeline.length > 0 ? (
                    groupedTimeline.map(group => (
                        <div key={group.label} className="space-y-3">
                            <div className="flex items-center gap-3 px-1">
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.25em] ${group.label === 'Action Required' ? 'text-red-500' : 'text-gray-500'}`}>
                                    {group.label}
                                </h3>
                                <div className="h-[1px] flex-1 bg-gray-800/50" />
                            </div>
                            <ul className="space-y-2.5">
                                {group.items.map(item => (
                                    <TimelineItem key={item.id} item={item} onNavigate={onNavigate} />
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <div className="bg-gray-800/10 border border-dashed border-gray-800 p-8 rounded-3xl text-center">
                        <CheckSquareIcon className="w-8 h-8 text-gray-800 mx-auto mb-2 opacity-50" />
                        <p className="text-gray-600 text-sm font-semibold">Timeline clear.</p>
                        <p className="text-gray-700 text-[10px] uppercase mt-1">No tasks or expirations in the next 30 days</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default DashboardView;
