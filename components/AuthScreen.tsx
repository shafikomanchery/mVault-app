
import React, { useState, useEffect } from 'react';
import { EncryptedData, VaultItem } from '../types';
import { createVault, unlockVault } from '../utils/security';
import { authenticateBiometrics } from '../utils/biometrics';
import { ShieldCheckIcon, TrashIcon, KeyIcon } from './icons';

type AuthMode = 'login' | 'setup' | 'migration';

interface AuthScreenProps {
    mode: AuthMode;
    encryptedData?: EncryptedData;
    legacyData?: VaultItem[];
    onAuthenticated: (key: CryptoKey, data: VaultItem[], encryptedData: EncryptedData) => void;
    onReset?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ mode, encryptedData, legacyData, onAuthenticated, onReset }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [trustDevice, setTrustDevice] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasBioSetup, setHasBioSetup] = useState(false);

    useEffect(() => {
        if (mode === 'login') {
            const hasKey = !!localStorage.getItem('mvault_biometric_id');
            setHasBioSetup(hasKey);
        }
    }, [mode]);

    const handleBiometricUnlock = async () => {
        setError(null);
        setIsLoading(true);
        
        try {
            const retrievedPassword = await authenticateBiometrics();
            if (retrievedPassword && encryptedData) {
                const { key, data } = await unlockVault(retrievedPassword, encryptedData);
                onAuthenticated(key, data, encryptedData);
            } else {
                setError("Biometric verification failed or canceled.");
            }
        } catch (err) {
            setError("Could not complete biometric scan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (mode === 'login' && encryptedData) {
                try {
                    const { key, data } = await unlockVault(password, encryptedData);
                    onAuthenticated(key, data, encryptedData);
                } catch (err) {
                    setError("Invalid Master Password.");
                    setIsLoading(false);
                }
            } else if (mode === 'setup' || mode === 'migration') {
                if (password.length < 8) { setError("Min 8 characters required."); setIsLoading(false); return; }
                if (password !== confirmPassword) { setError("Passwords do not match."); setIsLoading(false); return; }
                const initialData = mode === 'migration' ? (legacyData || []) : [];
                const { key, encrypted } = await createVault(password, initialData);
                onAuthenticated(key, initialData, encrypted);
            }
        } catch (err) {
            setError("An unexpected security error occurred.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-6">
                        <ShieldCheckIcon className="w-10 h-10 text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">mVault</h1>
                    <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">Secure Password Manager</p>
                </div>

                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
                    {isLoading && <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 animate-pulse" />}
                    
                    <h2 className="text-xl font-bold text-white mb-6 text-center">
                        {mode === 'login' ? 'Unlock Vault' : 'Initialize Vault'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Master Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-900/60 border border-gray-700/50 text-white rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-600 font-mono"
                                placeholder="••••••••••••"
                                autoFocus
                            />
                        </div>

                        { (mode === 'setup' || mode === 'migration') && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Confirm Password</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    className="w-full bg-gray-900/60 border border-gray-700/50 text-white rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono" 
                                    placeholder="••••••••••••"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-xl flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !password}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-bold shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {mode === 'login' ? 'UNLOCK WITH PASSWORD' : 'CREATE MASTER VAULT'}
                        </button>

                        {mode === 'login' && hasBioSetup && (
                            <div className="pt-4 border-t border-gray-700/50">
                                <button 
                                    type="button" 
                                    onClick={handleBiometricUnlock}
                                    className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all bg-gray-700/30 hover:bg-gray-700/50 border border-gray-700/50 text-blue-400"
                                >
                                    <KeyIcon className="w-5 h-5" />
                                    <span>QUICK BIOMETRIC UNLOCK</span>
                                </button>
                            </div>
                        )}
                    </form>
                </div>
                
                {mode === 'login' && onReset && (
                     <div className="mt-8 text-center">
                        <button onClick={onReset} className="text-[10px] text-red-500/50 hover:text-red-500 uppercase tracking-widest font-bold flex items-center gap-2 mx-auto">
                            <TrashIcon className="w-3 h-3" /> Emergency Factory Reset
                        </button>
                     </div>
                )}
            </div>
        </div>
    );
};

export default AuthScreen;
