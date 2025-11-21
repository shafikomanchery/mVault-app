import React from 'react';
import { Account } from '../types';
import AccountCard from '../components/cards/AccountCard';

const VaultView: React.FC<{accounts: Account[], onEdit: (item: Account) => void, onDelete: (id: string) => void, onShowHistory: (account: Account) => void}> = ({accounts, onEdit, onDelete, onShowHistory}) => {
    return <div className="space-y-4">
        <h2 className="text-3xl font-bold">Vault</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map(acc => <AccountCard key={acc.id} account={acc} onEdit={() => onEdit(acc)} onDelete={() => onDelete(acc.id)} onShowHistory={() => onShowHistory(acc)} />)}
        </div>
        {accounts.length === 0 && <p className="text-gray-400">No accounts yet. Click 'New Account' to create one.</p>}
    </div>;
}

export default VaultView;