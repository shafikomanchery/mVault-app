
import React, { useMemo, useState, useEffect } from 'react';
import { Account, AccountType } from '../types';
import AccountCard from '../components/cards/AccountCard';
import { VaultIcon, ChevronLeftIcon, StickyNoteIcon, CalendarIcon, KeyIcon } from '../components/icons';

const CategoryCard: React.FC<{
    type: AccountType;
    label: string;
    count: number;
    onClick: () => void;
    icon: React.ReactNode;
}> = ({ label, count, onClick, icon }) => (
    <button 
        onClick={onClick}
        className="bg-gray-800/40 backdrop-blur-sm hover:bg-gray-800/60 border border-gray-700/50 hover:border-blue-500/30 p-4 rounded-3xl transition-all group text-left relative overflow-hidden flex sm:flex-col items-center sm:items-start gap-4 sm:gap-6 shadow-sm"
    >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform translate-x-4 -translate-y-4 hidden sm:block">
            {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-24 h-24' })}
        </div>
        <div className={`p-3 rounded-2xl shrink-0 ${count > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-700/30 text-gray-500'}`}>
            {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
        </div>
        <div className="relative z-10 flex-1 min-w-0">
            <h3 className="text-base sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">{label}</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                {count === 1 ? '1 Item' : `${count} Items`}
            </p>
        </div>
        <div className="sm:hidden text-gray-700 group-hover:text-blue-400 transition-colors shrink-0">
            <ChevronLeftIcon className="w-4 h-4 rotate-180" />
        </div>
    </button>
);

interface VaultViewProps {
    accounts: Account[];
    onEdit: (item: Account) => void;
    onDelete: (id: string) => void;
    onShowHistory: (account: Account) => void;
    initialCategory?: AccountType | null;
    onCategoryChange?: (type: AccountType | null) => void;
}

const VaultView: React.FC<VaultViewProps> = ({accounts, onEdit, onDelete, onShowHistory, initialCategory, onCategoryChange}) => {
    const [selectedType, setSelectedType] = useState<AccountType | null>(initialCategory || null);

    useEffect(() => {
        if (initialCategory !== undefined) {
            setSelectedType(initialCategory);
        }
    }, [initialCategory]);

    const handleSelectType = (type: AccountType | null) => {
        setSelectedType(type);
        if (onCategoryChange) onCategoryChange(type);
    };

    const groupedAccounts = useMemo(() => {
        const groups: Record<AccountType, Account[]> = { website: [], bank: [], email: [], subscription: [], other: [] };
        accounts.forEach(acc => {
            if (groups[acc.accountType]) groups[acc.accountType].push(acc);
            else groups.other.push(acc);
        });
        return groups;
    }, [accounts]);

    const typeLabels: Record<AccountType, string> = {
        website: 'Websites & Apps',
        bank: 'Banking & Finance',
        email: 'Email Accounts',
        subscription: 'Subscriptions',
        other: 'Miscellaneous'
    };

    const typeIcons: Record<AccountType, React.ReactNode> = {
        website: <KeyIcon />,
        bank: <VaultIcon />,
        email: <StickyNoteIcon />,
        subscription: <CalendarIcon />,
        other: <VaultIcon />
    };

    if (accounts.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-800/10 border border-dashed border-gray-800 rounded-[40px] max-w-4xl mx-auto">
                <VaultIcon className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-600 font-black text-sm uppercase tracking-widest">Vault Empty</p>
                <p className="text-gray-700 text-[10px] uppercase tracking-widest mt-2">Tap 'New Account' to secure credentials</p>
            </div>
        );
    }

    if (selectedType) {
        const items = groupedAccounts[selectedType];
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-4xl mx-auto">
                <header className="flex flex-col gap-3 px-1">
                    <button 
                        onClick={() => handleSelectType(null)}
                        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest group w-fit"
                    >
                        <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Categories
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl shadow-lg shadow-blue-500/5">
                                {React.cloneElement(typeIcons[selectedType] as React.ReactElement<any>, { className: 'w-6 h-6' })}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{typeLabels[selectedType]}</h2>
                        </div>
                        <span className="text-[10px] font-black text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700 uppercase tracking-widest">
                            {items.length} Items
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                    {items.map(acc => (
                        <AccountCard key={acc.id} account={acc} onEdit={() => onEdit(acc)} onDelete={() => onDelete(acc.id)} onShowHistory={() => onShowHistory(acc)} />
                    ))}
                    {items.length === 0 && <p className="text-gray-600 text-sm italic p-8 text-center col-span-full">No accounts stored in this category.</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 max-w-4xl mx-auto">
            <header className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Security Vault</h2>
                    <p className="text-gray-500 text-[10px] sm:text-sm font-bold uppercase tracking-widest mt-1">Classified Credentials</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 px-3 py-1.5 rounded-full text-[10px] font-black text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                    <VaultIcon className="w-3.5 h-3.5" />
                    {accounts.length} Total
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {(Object.keys(groupedAccounts) as AccountType[]).map(type => (
                    <CategoryCard key={type} type={type} label={typeLabels[type]} count={groupedAccounts[type].length} onClick={() => handleSelectType(type)} icon={typeIcons[type]} />
                ))}
            </div>
        </div>
    );
}

export default VaultView;
