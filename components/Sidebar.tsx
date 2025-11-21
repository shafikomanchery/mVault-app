
import React from 'react';
import { View } from '../types';
import { 
    MVaultLogo, LayoutDashboardIcon, VaultIcon, StickyNoteIcon, 
    CalendarIcon, ListTodoIcon, ImportIcon, DownloadIcon 
} from './icons';

// Add Lock Icon locally since it's specific here
const LockIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

// Add Info Icon
const InfoIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

// Add Shield/Privacy Icon
const ShieldIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

interface SidebarProps { 
    view: View; 
    setView: (view: View) => void;
    isOpen: boolean; 
    setOpen: (isOpen: boolean) => void; 
    onImport: () => void; 
    onExport: () => void;
    onLock: () => void;
    onShowAbout: () => void;
    onShowPrivacy: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ view, setView, isOpen, setOpen, onImport, onExport, onLock, onShowAbout, onShowPrivacy }) => {
    const NavItem: React.FC<{ targetView: View; icon: React.ReactNode; label: string }> = ({ targetView, icon, label }) => (
      <button
        onClick={() => { setView(targetView); if (window.innerWidth < 768) setOpen(false); }}
        className={`flex items-center w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors ${view === targetView ? 'bg-gray-700 text-white' : ''}`}
      >
        {icon}
        <span className="ml-3 font-medium">{label}</span>
      </button>
    );
  
    return (
      <>
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setOpen(false)}></div>
        <aside className={`fixed md:relative top-0 left-0 h-full bg-gray-800 shadow-lg transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 flex-shrink-0 flex flex-col border-r border-gray-700`}>
            <div className="px-4 py-6 border-b border-gray-700">
                <MVaultLogo />
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <div className="mb-6">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Apps</p>
                    <NavItem targetView="dashboard" icon={<LayoutDashboardIcon className="w-5 h-5" />} label="Dashboard" />
                    <NavItem targetView="vault" icon={<VaultIcon className="w-5 h-5" />} label="Vault" />
                    <NavItem targetView="notes" icon={<StickyNoteIcon className="w-5 h-5" />} label="Notes" />
                    <NavItem targetView="events" icon={<CalendarIcon className="w-5 h-5" />} label="Events" />
                    <NavItem targetView="todos" icon={<ListTodoIcon className="w-5 h-5" />} label="Todos" />
                </div>

                <div>
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data & Security</p>
                    <button onClick={onImport} className="flex items-center w-full px-4 py-2.5 text-left text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors">
                        <ImportIcon className="w-5 h-5" /> <span className="ml-3 text-sm">Import Vault</span>
                    </button>
                    <button onClick={onExport} className="flex items-center w-full px-4 py-2.5 text-left text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors">
                        <DownloadIcon className="w-5 h-5" /> <span className="ml-3 text-sm">Export Vault</span>
                    </button>
                    <button onClick={onLock} className="flex items-center w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded-lg transition-colors mt-1">
                        <LockIcon className="w-5 h-5" /> <span className="ml-3 text-sm font-medium">Lock Vault</span>
                    </button>
                </div>
            </nav>

            <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button onClick={onShowAbout} className="flex flex-col items-center justify-center p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                        <InfoIcon className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">About</span>
                    </button>
                    <button onClick={onShowPrivacy} className="flex flex-col items-center justify-center p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                        <ShieldIcon className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">Privacy</span>
                    </button>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-gray-600">&copy; {new Date().getFullYear()} mVault Security.</p>
                    <p className="text-[10px] text-gray-600">All rights reserved.</p>
                </div>
            </div>
        </aside>
      </>
    );
  };

export default Sidebar;
