
import React, { useState, useMemo } from 'react';
import { Account, AccountType, Criticality, HistoryEntry, FormProps } from '../../types';
import { EyeIcon, EyeOffIcon, SparklesIcon, TagIcon } from '../icons';
import { generateStrongPassword } from '../../utils/security';

const AccountForm: React.FC<FormProps<Account> & { lastAccountType: AccountType, setLastAccountType: (type: AccountType) => void }> = ({ onSave, onClose, itemToEdit, lastAccountType, setLastAccountType }) => {
    const [name, setName] = useState(itemToEdit?.name || '');
    const [username, setUsername] = useState(itemToEdit?.username || '');
    const [password, setPassword] = useState(itemToEdit?.password || '');
    const [url, setUrl] = useState(itemToEdit?.url || '');
    const [accountType, setAccountType] = useState<AccountType>(itemToEdit?.accountType || lastAccountType);
    const [expiryDate, setExpiryDate] = useState(itemToEdit?.expiryDate ? itemToEdit.expiryDate.split('T')[0] : '');
    const [criticality, setCriticality] = useState<Criticality>(itemToEdit?.criticality || 'Medium');
    const [tagsInput, setTagsInput] = useState(itemToEdit?.tags?.join(', ') || '');
    const [showPassword, setShowPassword] = useState(false);

    const passwordStrength = useMemo(() => {
        if (!password) return 0;
        let score = 0;
        if (password.length > 8) score++;
        if (password.length > 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    }, [password]);

    const handleGeneratePassword = () => {
        const pass = generateStrongPassword(20);
        setPassword(pass);
        setShowPassword(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
        
        const updatedHistory = itemToEdit ? [...itemToEdit.history] : [];
        if (itemToEdit && itemToEdit.password !== password) {
             updatedHistory.filter(e => e.field !== 'password').push({
                 timestamp: new Date().toISOString(),
                 field: 'password',
                 oldValue: itemToEdit.password,
                 newValue: password || ''
             });
        }

        onSave({
            ...itemToEdit,
            id: itemToEdit?.id || '',
            type: 'account',
            name, username, password, url, accountType, 
            expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
            criticality,
            tags,
            history: updatedHistory,
            priority: itemToEdit?.priority || 0,
            createdAt: itemToEdit?.createdAt || ''
        } as Account);
        setLastAccountType(accountType);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Account Name (e.g., Bank of America)" required className="w-full bg-gray-900/50 border border-gray-700 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username or Email" required className="w-full bg-gray-900/50 border border-gray-700 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            
            <div className="space-y-1.5">
                <div className="relative group">
                    <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Password" 
                        className="w-full bg-gray-900/50 border border-gray-700 p-2.5 pr-20 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button type="button" onClick={handleGeneratePassword} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-md" title="Generate Strong Password"><SparklesIcon className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-gray-500 hover:text-white rounded-md">{showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button>
                    </div>
                </div>
                {password && (
                    <div className="flex gap-1 h-1 px-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`h-full flex-1 rounded-full transition-colors ${passwordStrength >= i ? (passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 4 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-700'}`} />
                        ))}
                    </div>
                )}
            </div>

            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Login URL" className="w-full bg-gray-900/50 border border-gray-700 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            
            <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Tags (comma separated: work, personal, critical)" className="w-full bg-gray-900/50 border border-gray-700 p-2.5 pl-9 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <select value={accountType} onChange={e => setAccountType(e.target.value as AccountType)} className="w-full bg-gray-900/50 border border-gray-700 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none capitalize">
                    {(['website', 'bank', 'email', 'subscription', 'other'] as AccountType[]).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className="w-full bg-gray-900/50 border border-gray-700 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>Low</option><option>Medium</option><option>High</option>
                </select>
            </div>
            
            <button type="submit" className="w-full bg-blue-600 p-3.5 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]">Save Secure Account</button>
        </form>
    );
};

export default AccountForm;
