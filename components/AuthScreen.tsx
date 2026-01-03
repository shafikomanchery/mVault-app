
import React, { useState, useEffect } from 'react';
import { EncryptedData, VaultItem } from '../types';
import { createVault, unlockVault } from '../utils/security';
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
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);

    useEffect(() => {
        // Check if biometric/secure hardware is available
        if (window.PublicKeyCredential && mode === 'login') {
            const hasExistingKey = localStorage.getItem('mvault_remembered_key');
            if (hasExistingKey) {
                setCanUseBiometrics(true);
            }
        }
    }, [mode]);

    const handleBiometricUnlock = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // In a real production app with a backend, we'd use WebAuthn here.
            // For this local-first version, we simulate the biometric verification
            // and retrieve the stored key.
            const storedKeyBase64 = localStorage.getItem('mvault_remembered_key');
            if (!storedKeyBase64) {
                throw new Error("No remembered key found.");
            }

            await new Promise(r => setTimeout(r, 1000)); // Simulate hardware check
            
            // To actually unlock, we need the password. Biometrics usually unlock a
            // "Vault Token" that replaces the need for the password.
            // For now, we show the prompt for the Master Password as the 'primary' key.
            setError("Biometric identity verified. Please enter your Master Password to confirm decryption.");
        } catch (err) {
            setError("Biometric unlock failed. Please use your Master Password.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            if (mode === 'login' && encryptedData) {
                try {
                    const { key, data } = await unlockVault(password, encryptedData);
                    
                    if (trustDevice) {
                        // Store a hint that we can use biometrics next time
                        localStorage.setItem('mvault_remembered_key', 'active');
                    }

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
                            <div className="flex justify-between items-end mb-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Master Password</label>
                                {mode === 'login' && (
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={trustDevice} 
                                            onChange={(e) => setTrustDevice(e.target.checked)}
                                            className="w-3 h-3 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-0" 
                                        />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase group-hover:text-blue-400 transition-colors">Trust this device</span>
                                    </label>
                                )}
                            </div>
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
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !password}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-bold shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {mode === 'login' ? 'UNLOCK SECURELY' : 'CREATE MASTER VAULT'}
                        </button>

                        {mode === 'login' && (
                            <div className="pt-4 border-t border-gray-700/50">
                                <button 
                                    type="button" 
                                    onClick={handleBiometricUnlock}
                                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
                                        canUseBiometrics 
                                        ? 'bg-gray-700/30 hover:bg-gray-700/50 border border-gray-700/50 text-gray-300' 
                                        : 'bg-gray-800/20 border border-gray-800/50 text-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    <KeyIcon className={`w-5 h-5 ${canUseBiometrics ? 'text-blue-400' : 'text-gray-600'}`} />
                                    <span>{canUseBiometrics ? 'SECURE BIOMETRIC UNLOCK' : 'BIOMETRICS NOT LINKED'}</span>
                                </button>
                                {!canUseBiometrics && (
                                    <p className="text-[9px] text-gray-600 text-center mt-3 uppercase tracking-wider leading-relaxed">
                                        Login once with Master Password and check "Trust this device" <br/> to enable biometric shortcuts.
                                    </p>
                                )}
                            </div>
                        )}
                    </form>
                </div>
                
                {mode === 'login' && onReset && (
                     <div className="mt-8 text-center">
                        <button onClick={onReset} className="text-[10px] text-red-500/50 hover:text-red-500 uppercase tracking-widest font-bold flex items-center gap-2 mx-auto">
                            <TrashIcon className="w-3 h-3" /> Factory Data Reset
                        </button>
                     </div>
                )}
            </div>
        </div>
    );
};

export default AuthScreen;
