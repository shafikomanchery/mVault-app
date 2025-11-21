
import React, { useState } from 'react';
import { EncryptedData, VaultItem } from '../types';
import { createVault, unlockVault } from '../utils/security';
import { MVaultLogo, VaultIcon, TrashIcon } from './icons';

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
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        
        // Small delay to allow UI to update to loading state smoothly
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            if (mode === 'login' && encryptedData) {
                try {
                    const { key, data } = await unlockVault(password, encryptedData);
                    onAuthenticated(key, data, encryptedData);
                } catch (err) {
                    console.error(err);
                    setError("Decryption failed. Incorrect password or corrupted data.");
                    setIsLoading(false);
                }
            } else if (mode === 'setup' || mode === 'migration') {
                if (password.length < 8) {
                    setError("Password must be at least 8 characters.");
                    setIsLoading(false);
                    return;
                }
                if (password !== confirmPassword) {
                    setError("Passwords do not match.");
                    setIsLoading(false);
                    return;
                }
                
                const initialData = mode === 'migration' ? (legacyData || []) : [];
                const { key, encrypted } = await createVault(password, initialData);
                onAuthenticated(key, initialData, encrypted);
            }
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred.");
            setIsLoading(false);
        }
    };

    const isSetup = mode === 'setup' || mode === 'migration';

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-blue-500/30">
            
            {/* Background Decorative Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse" style={{animationDuration: '4s'}}></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse" style={{animationDuration: '7s'}}></div>

            <div className="w-full max-w-md relative z-10">
                
                {/* Header / Logo Section */}
                <div className="flex flex-col items-center mb-8 transform transition-all duration-500 hover:scale-[1.02]">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                        <div className="relative bg-gray-900 border border-gray-700/50 p-5 rounded-2xl shadow-2xl flex items-center justify-center ring-1 ring-white/5">
                             <VaultIcon className="w-10 h-10 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <MVaultLogo className="justify-center scale-125 origin-center mb-2 text-white" />
                        <p className="text-blue-200/60 text-xs font-bold tracking-[0.2em] uppercase mt-2">
                            {mode === 'login' ? 'Secure Access' : 'Vault Initialization'}
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5">
                    
                    {/* Loading Progress Bar */}
                    <div className="h-1 w-full bg-gray-700/30">
                        <div className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out ${isLoading ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
                    </div>

                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-white text-center mb-2">
                            {mode === 'login' ? 'Welcome Back' : 'Protect Your Vault'}
                        </h2>
                        <p className="text-center text-gray-400 text-sm mb-8 leading-relaxed">
                             {mode === 'login' 
                                ? 'Enter your master password to decrypt your data.' 
                                : 'Create a strong master password. This is the only key to your data; do not lose it.'}
                        </p>

                        {mode === 'migration' && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg mb-6 flex items-start gap-3">
                                <div className="text-yellow-500 mt-0.5 text-lg">⚠️</div>
                                <p className="text-xs text-yellow-200/80 leading-relaxed pt-1">
                                    Unencrypted data detected. Set a password to encrypt it immediately.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Master Password</label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-900/60 border border-gray-600/50 text-white text-lg rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder-gray-600 group-hover:border-gray-500/50"
                                        placeholder="••••••••••••"
                                        autoFocus
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-[10px] uppercase font-bold tracking-widest"
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            {isSetup && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Confirm Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-gray-900/60 border border-gray-600/50 text-white text-lg rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder-gray-600"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="w-1 h-8 bg-red-500 rounded-full"></div>
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !password}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] mt-2 ${
                                    isLoading || !password 
                                        ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/30 hover:shadow-blue-900/50'
                                }`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    mode === 'login' ? 'UNLOCK VAULT' : 'INITIALIZE VAULT'
                                )}
                            </button>
                        </form>
                    </div>
                    
                    {/* Card Footer */}
                    {isSetup && (
                        <div className="bg-gray-900/50 p-4 text-center border-t border-gray-700/50">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                                AES-256-GCM End-to-End Encryption
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Forgot Password / Reset Link */}
                {mode === 'login' && onReset && (
                     <div className="mt-6 text-center">
                        <button 
                            onClick={onReset}
                            className="text-xs text-red-400/60 hover:text-red-400 hover:underline transition-colors flex items-center gap-1 mx-auto"
                        >
                            <TrashIcon className="w-3 h-3" />
                            Reset Vault (Clear All Data)
                        </button>
                     </div>
                )}
                
                {/* Bottom Status Indicator */}
                <div className="mt-8 flex items-center justify-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-xs font-medium text-gray-400">Secure Local Environment</span>
                </div>

            </div>
        </div>
    );
};

export default AuthScreen;
