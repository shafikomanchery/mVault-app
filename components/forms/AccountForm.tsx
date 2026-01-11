
import React, { useState, useMemo } from 'react';
import { Account, AccountType, Criticality, FormProps } from '../../types';
import { EyeIcon, EyeOffIcon, SparklesIcon, TagIcon, CalendarIcon } from '../icons';
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
        let updatedHistory = itemToEdit ? [...itemToEdit.history] : [];
        if (itemToEdit && itemToEdit.password !== password) {
             updatedHistory = [
                 ...updatedHistory.filter(h => h.field !== 'password'),
                 {
                     timestamp: new Date().toISOString(),
                     field: 'password',
                     oldValue: itemToEdit.password,
                     newValue: password || ''
                 }
             ];
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

    const inputClass = "w-full bg-gray-900/60 border border-gray-700/50 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-600 text-sm";
    const labelClass = "text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1.5 flex items-center gap-1.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-5 pb-6">
            <div className="space-y-4">
                <div>
                    <label className={labelClass}>Account Identity</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Personal Banking" required className={inputClass} />
                </div>
                
                <div>
                    <label className={labelClass}>Username or Email</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="john.doe@example.com" required className={inputClass} />
                </div>
                
                <div className="space-y-2">
                    <label className={labelClass}>
                        Secure Password 
                        <span className="text-[9px] lowercase opacity-40 font-medium tracking-normal ml-auto">(Tap ✨ to generate)</span>
                    </label>
                    <div className="relative group">
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="••••••••••••" 
                            className={`${inputClass} pr-24 font-mono`} 
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            <button type="button" onClick={handleGeneratePassword} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Generate Strong Password"><SparklesIcon className="w-4 h-4" /></button>
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 text-gray-500 hover:text-white rounded-lg transition-colors">{showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button>
                        </div>
                    </div>
                    {password && (
                        <div className="flex gap-1.5 h-1.5 px-1 mt-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`h-full flex-1 rounded-full transition-all duration-500 ${passwordStrength >= i ? (passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 4 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-800'}`} />
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className={labelClass}>Login URL (Optional)</label>
                    <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className={inputClass} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Category</label>
                        <select value={accountType} onChange={e => setAccountType(e.target.value as AccountType)} className={`${inputClass} appearance-none`}>
                            <option value="website">Website</option>
                            <option value="bank">Bank</option>
                            <option value="email">Email</option>
                            <option value="subscription">Subscription</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Criticality</label>
                        <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className={inputClass}>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className={labelClass}><TagIcon className="w-3.5 h-3.5" /> Discovery Tags</label>
                    <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="work, finance, personal..." className={inputClass} />
                </div>
            </div>
            
            <button type="submit" className="w-full bg-blue-600 p-4 rounded-2xl font-black text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/30 active:scale-95 mt-6 tracking-wide">
                SAVE SECURE ACCOUNT
            </button>
        </form>
    );
};

export default AccountForm;
