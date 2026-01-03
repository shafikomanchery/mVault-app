
import React, { useState, useEffect } from 'react';
import { Modal } from './Shared';
import { KeyIcon, TrashIcon } from './icons';
import { isBiometricsSupported, registerBiometrics, disableBiometrics } from '../utils/biometrics';

interface SettingsModalProps {
    onClose: () => void;
    onResetVault: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onResetVault }) => {
    const [bioEnabled, setBioEnabled] = useState(false);
    const [isSupported, setIsSupported] = useState<boolean | null>(null);
    const [supportReason, setSupportReason] = useState<string | null>(null);
    const [setupStep, setSetupStep] = useState<'idle' | 'verifying'>('idle');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkSupport = async () => {
            const { supported, reason } = await isBiometricsSupported();
            setIsSupported(supported);
            setSupportReason(reason || null);
            setBioEnabled(!!localStorage.getItem('mvault_biometric_id'));
        };
        checkSupport();
    }, []);

    const handleToggleBiometrics = async () => {
        if (bioEnabled) {
            disableBiometrics();
            setBioEnabled(false);
        } else {
            setError(null);
            setSetupStep('verifying');
        }
    };

    const confirmSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!password) {
            setError("Master password required.");
            return;
        }

        const result = await registerBiometrics(password);
        if (result.success) {
            setBioEnabled(true);
            setSetupStep('idle');
            setPassword('');
        } else {
            setError(result.error || "Hardware registration failed.");
        }
    };

    return (
        <Modal title="Security Settings" onClose={onClose}>
            <div className="space-y-6">
                <section className="space-y-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Authentication</h4>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-900/40 rounded-2xl border border-gray-700/50">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isSupported ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-600'}`}>
                                <KeyIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-white">Biometric Unlock</p>
                                <p className={`text-[10px] truncate ${isSupported ? 'text-gray-500' : 'text-red-400/80'}`}>
                                    {isSupported === null ? 'Checking hardware...' : 
                                     isSupported ? 'Touch ID / Face ID supported' : (supportReason || 'Hardware not available')}
                                </p>
                            </div>
                        </div>
                        <button 
                            disabled={!isSupported}
                            onClick={handleToggleBiometrics}
                            className={`w-12 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${bioEnabled ? 'bg-blue-600' : 'bg-gray-700'} ${!isSupported && 'opacity-20 cursor-not-allowed'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${bioEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {setupStep === 'verifying' && (
                        <form onSubmit={confirmSetup} className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs text-blue-400 font-medium">Link Touch ID to your vault:</p>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                placeholder="Verify Master Password"
                                autoFocus
                            />
                            {error && <p className="text-[10px] text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">{error}</p>}
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setSetupStep('idle')} className="flex-1 py-2 text-xs font-bold text-gray-500">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white">Start Scan</button>
                            </div>
                        </form>
                    )}
                </section>

                <section className="space-y-4 pt-4 border-t border-gray-700/50">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Advanced Control</h4>
                    
                    <button 
                        onClick={() => { if(window.confirm("CRITICAL: This will permanently delete your Master Password and ALL items. This is unrecoverable. Continue?")) onResetVault(); }}
                        className="w-full flex items-center gap-3 p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl transition-colors group"
                    >
                        <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                            <TrashIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-red-400 group-hover:text-red-300">Hard Factory Reset</p>
                            <p className="text-[10px] text-red-500/60 font-medium">Completely wipe local database & cache</p>
                        </div>
                    </button>
                </section>
            </div>
        </Modal>
    );
};
