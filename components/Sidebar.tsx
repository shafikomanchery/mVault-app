
import React, { useMemo } from 'react';
import { View } from '../types';
import { 
    MVaultLogo, LayoutDashboardIcon, VaultIcon, StickyNoteIcon, 
    CalendarIcon, ListTodoIcon, ImportIcon, DownloadIcon, ShieldCheckIcon 
} from './icons';

const LockIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

const InfoIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

const ShieldIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

const SettingsIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
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
    onShowSettings: () => void;
    onShowAbout: () => void;
    onShowPrivacy: () => void;
    lastExportDate?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ view, setView, isOpen, setOpen, onImport, onExport, onLock, onShowSettings, onShowAbout, onShowPrivacy, lastExportDate }) => {
    const backupStatus = useMemo(() => {
        if (!lastExportDate) return { label: 'Backup Required', color: 'text-amber-500', alert: true };
        const date = new Date(lastExportDate);
        const diffDays = Math.ceil((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 30) return { label: 'Backup Overdue', color: 'text-red-400', alert: true };
        return { label: `Backed up ${diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`}`, color: 'text-gray-600', alert: false };
    }, [lastExportDate]);

    const NavItem: React.FC<{ targetView: View; icon: React.ReactNode; label: string }> = ({ targetView, icon, label }) => (
      <button
        onClick={() => { setView(targetView); if (window.innerWidth < 768) setOpen(false); }}
        className={`flex items-center w-full px-4 py-3 text-left transition-all rounded-xl group ${
            view === targetView 
            ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400' 
            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white border border-transparent'
        }`}
      >
        <span className={`${view === targetView ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
            {icon}
        </span>
        <span className="ml-3 font-semibold text-sm tracking-wide">{label}</span>
        {view === targetView && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />}
      </button>
    );
  
    return (
      <>
        <div className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setOpen(false)}></div>
        <aside className={`fixed md:relative top-0 left-0 h-full bg-[#0f172a] shadow-2xl transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 flex-shrink-0 flex flex-col border-r border-gray-800/50`}>
            <div className="px-6 py-8 border-b border-gray-800/50">
                <MVaultLogo />
                <div className="flex items-center gap-2 mt-3 ml-1 bg-blue-500/10 w-fit px-2 py-0.5 rounded-full border border-blue-500/20">
                    <ShieldCheckIcon className="w-2.5 h-2.5 text-blue-400" />
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Local Device Vault</span>
                </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <p className="px-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-4">Workspace</p>
                    <div className="space-y-1">
                        <NavItem targetView="dashboard" icon={<LayoutDashboardIcon className="w-5 h-5" />} label="Dashboard" />
                        <NavItem targetView="vault" icon={<VaultIcon className="w-5 h-5" />} label="Accounts" />
                        <NavItem targetView="notes" icon={<StickyNoteIcon className="w-5 h-5" />} label="Notes" />
                        <NavItem targetView="events" icon={<CalendarIcon className="w-5 h-5" />} label="Events" />
                        <NavItem targetView="todos" icon={<ListTodoIcon className="w-5 h-5" />} label="Tasks" />
                    </div>
                </div>

                <div>
                    <p className="px-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-4">System</p>
                    <div className="space-y-1">
                        <button onClick={onImport} className="flex items-center w-full px-4 py-3 text-left text-gray-400 hover:bg-gray-700/40 hover:text-white rounded-xl transition-all border border-transparent group">
                            <ImportIcon className="w-5 h-5 text-gray-500 group-hover:text-blue-400" /> <span className="ml-3 text-sm font-medium">Import</span>
                        </button>
                        <button onClick={onExport} className="flex items-center w-full px-4 py-3 text-left text-gray-400 hover:bg-gray-700/40 hover:text-white rounded-xl transition-all border border-transparent group">
                            <DownloadIcon className="w-5 h-5 text-gray-500 group-hover:text-green-400" /> <span className="ml-3 text-sm font-medium">Export</span>
                        </button>
                        <button onClick={onShowSettings} className="flex items-center w-full px-4 py-3 text-left text-gray-400 hover:bg-gray-700/40 hover:text-white rounded-xl transition-all border border-transparent group">
                            <SettingsIcon className="w-5 h-5 text-gray-500 group-hover:text-blue-400" /> <span className="ml-3 text-sm font-medium">Settings</span>
                        </button>
                        <button onClick={onLock} className="flex items-center w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all border border-transparent mt-2">
                            <LockIcon className="w-5 h-5" /> <span className="ml-3 text-sm font-bold tracking-wide">Lock Session</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="p-4 border-t border-gray-800/50 bg-[#1e293b]/20">
                <div className="px-2 mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full ${backupStatus.alert ? 'bg-amber-500 animate-pulse' : 'bg-gray-600'}`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${backupStatus.color}`}>
                            {backupStatus.label}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button onClick={onShowAbout} className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800 text-gray-500 hover:text-white transition-all border border-gray-700/30">
                        <InfoIcon className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">About</span>
                    </button>
                    <button onClick={onShowPrivacy} className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800 text-gray-500 hover:text-white transition-all border border-gray-700/30">
                        <ShieldIcon className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Privacy</span>
                    </button>
                </div>
                <div className="text-center pb-2">
                    <p className="text-[9px] text-gray-600 font-bold tracking-tighter">&copy; {new Date().getFullYear()} MVAULT SECURITY SYSTEMS</p>
                    <p className="text-[8px] text-gray-700 mt-1 uppercase tracking-widest font-medium">End-to-End Encrypted</p>
                </div>
            </div>
        </aside>
      </>
    );
  };

export default Sidebar;
