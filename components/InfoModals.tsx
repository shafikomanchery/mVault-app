import React from 'react';
import { Modal } from './Shared';
import { MVaultLogo } from './icons';

export const AboutModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <Modal title="" onClose={onClose}>
            <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                    <MVaultLogo className="scale-125" />
                </div>
                <p className="text-gray-400 text-sm">Version 1.0.0 (Production)</p>
            </div>
            
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                    <strong className="text-white">mVault</strong> is a secure, local-first personal vault designed to keep your digital life organized and protected.
                </p>
                <p>
                    Unlike traditional cloud password managers, mVault operates on a <strong>Zero-Knowledge Architecture</strong>. Your data is encrypted directly on your device using military-grade AES-256-GCM encryption before it is ever saved. We do not have servers that store your password, and we cannot see your data.
                </p>
                
                <h4 className="font-bold text-white mt-6 border-b border-gray-700 pb-2">Key Technologies</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                    <li>AES-256-GCM Encryption</li>
                    <li>PBKDF2 Key Derivation (100,000 iterations)</li>
                    <li>IndexedDB for Offline Storage</li>
                    <li>Client-Side CSV Processing</li>
                </ul>

                <h4 className="font-bold text-white mt-6 border-b border-gray-700 pb-2">Developer</h4>
                <div className="text-gray-300">
                    <p>Created by <strong className="text-white">Mohammed Shafi</strong></p>
                    <p className="mt-1 text-gray-400">Contact: <a href="mailto:shafihussainkk@gmail.com" className="text-blue-400 hover:underline">shafihussainkk@gmail.com</a></p>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                <p className="text-xs text-gray-500">Designed with security and simplicity in mind.</p>
            </div>
        </Modal>
    );
};

export const PrivacyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <Modal title="Privacy & Disclaimer" onClose={onClose}>
            <div className="space-y-4 text-gray-300 text-sm overflow-y-auto max-h-[60vh] pr-2">
                <h4 className="text-white font-bold text-lg">Privacy Policy</h4>
                <p>
                    Your privacy is not just a policy; it is the core architecture of this application.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-400">
                    <li><strong>No Data Collection:</strong> This application does not track your usage, does not use analytics, and does not send data to any third-party servers.</li>
                    <li><strong>Local Storage:</strong> All data is stored locally on your specific device using your browser's IndexedDB.</li>
                    <li><strong>Encryption:</strong> Your data is encrypted using your Master Password. If you lose this password, your data is mathematically unrecoverable. We cannot reset it for you.</li>
                </ul>

                <h4 className="text-white font-bold text-lg mt-6">Disclaimer</h4>
                <p className="uppercase text-xs font-bold text-gray-500 tracking-wider">Limitation of Liability</p>
                <p>
                    The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement.
                </p>
                <p>
                    In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.
                </p>
                <p>
                    <strong>User Responsibility:</strong> You are solely responsible for maintaining the security of your Master Password and backing up your data regularly using the "Export" feature.
                </p>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium">
                    I Understand
                </button>
            </div>
        </Modal>
    );
};