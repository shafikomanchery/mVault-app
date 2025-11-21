import React, { useState } from 'react';
import { Account, AccountType, Criticality, HistoryEntry, FormProps } from '../../types';
import { generateStrongPassword } from '../../utils/security';
import { SparklesIcon } from '../icons';

const AccountForm: React.FC<FormProps<Account> & { lastAccountType: AccountType, setLastAccountType: (type: AccountType) => void }> = ({ onSave, onClose, itemToEdit, lastAccountType, setLastAccountType }) => {
    const [name, setName] = useState(itemToEdit?.name || '');
    const [username, setUsername] = useState(itemToEdit?.username || '');
    const [password, setPassword] = useState(itemToEdit?.password || '');
    const [url, setUrl] = useState(itemToEdit?.url || '');
    const [accountType, setAccountType] = useState<AccountType>(itemToEdit?.accountType || lastAccountType);
    const [expiryDate, setExpiryDate] = useState(itemToEdit?.expiryDate ? itemToEdit.expiryDate.split('T')[0] : '');
    const [criticality, setCriticality] = useState<Criticality>(itemToEdit?.criticality || 'Medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newHistoryEntry: HistoryEntry | null = itemToEdit && itemToEdit.password !== password
            ? { timestamp: new Date().toISOString(), field: 'password', oldValue: itemToEdit.password, newValue: password! }
            : null;

        // Restrict history to max 1 entry for password field
        let updatedHistory = itemToEdit ? [...itemToEdit.history] : [];
        
        if (newHistoryEntry) {
             // Remove existing password history entries so we only keep the latest one
             updatedHistory = updatedHistory.filter(entry => entry.field !== 'password');
             updatedHistory.push(newHistoryEntry);
        }

        onSave({
            ...itemToEdit,
            id: itemToEdit?.id || '',
            type: 'account',
            name, username, password, url, accountType, 
            expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
            criticality,
            history: updatedHistory,
            priority: itemToEdit?.priority || 0,
            createdAt: itemToEdit?.createdAt || ''
        } as Account);
        setLastAccountType(accountType);
        onClose();
    };
    
    const handleGeneratePassword = () => {
        const newPassword = generateStrongPassword();
        setPassword(newPassword);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Account Name (e.g., Google)" required className="w-full bg-gray-700 p-2 rounded" />
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username or Email" required className="w-full bg-gray-700 p-2 rounded" />
            <div className="flex gap-2">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-gray-700 p-2 rounded" />
                <button type="button" onClick={handleGeneratePassword} className="bg-purple-600 p-2 rounded hover:bg-purple-700" title="Generate Secure Password"><SparklesIcon className="w-5 h-5"/></button>
            </div>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="URL (e.g., https://google.com)" className="w-full bg-gray-700 p-2 rounded" />
            <div className="grid grid-cols-2 gap-4">
                <select value={accountType} onChange={e => setAccountType(e.target.value as AccountType)} className="w-full bg-gray-700 p-2 rounded capitalize">
                    {(['website', 'bank', 'email', 'subscription', 'other'] as AccountType[]).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className="w-full bg-gray-700 p-2 rounded">
                    <option>Low</option><option>Medium</option><option>High</option>
                </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Password Expiry Date (Optional)</label>
              <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded mt-1" />
            </div>
            <button type="submit" className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">Save</button>
        </form>
    );
};

export default AccountForm;