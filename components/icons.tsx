
import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string };

const Icon: React.FC<IconProps> = ({ children, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {children}
    </svg>
);

// FIX: Changed props type from React.SVGProps<SVGSVGElement> to React.ComponentProps<'div'> to match the returned div element.
export const MVaultLogo = (props: React.ComponentProps<'div'>) => (
    <div className="flex items-center gap-2" {...props}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
            <path d="M50 5L10 25V55C10 82.5 50 95 50 95C50 95 90 82.5 90 55V25L50 5Z" className="text-blue-600" fill="currentColor"/>
            {/* Engraving Effect: Shadow layer */}
            <path d="M35 70L42.5 50L50 65L57.5 50L65 70" stroke="rgba(0,0,0,0.2)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" transform="translate(0.5, 1)"/>
            {/* Original M Path */}
            <path d="M35 70L42.5 50L50 65L57.5 50L65 70" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-2xl font-bold text-white">mVault</span>
    </div>
);


export const LayoutDashboardIcon = (props: IconProps) => <Icon {...props}><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></Icon>;
export const VaultIcon = (props: IconProps) => <Icon {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></Icon>;
export const StickyNoteIcon = (props: IconProps) => <Icon {...props}><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" /><path d="M15 3v6h6" /></Icon>;
export const CalendarIcon = (props: IconProps) => <Icon {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></Icon>;
export const ListTodoIcon = (props: IconProps) => <Icon {...props}><rect x="3" y="5" width="6" height="6" rx="1" /><path d="m3 17 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" /></Icon>;
export const PlusIcon = (props: IconProps) => <Icon {...props}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>;
export const TrashIcon = (props: IconProps) => <Icon {...props}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon>;
export const EditIcon = (props: IconProps) => <Icon {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Icon>;
export const EyeIcon = (props: IconProps) => <Icon {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Icon>;
export const EyeOffIcon = (props: IconProps) => <Icon {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></Icon>;
export const SparklesIcon = (props: IconProps) => <Icon {...props}><path d="m12 3-1.9 4.2-4.3.6 3.1 3- .7 4.2 3.8-2 3.8 2-.7-4.2 3.1-3-4.3-.6L12 3z" /><path d="M5 11.5 3.5 13l-1.5-1.5" /><path d="M19 11.5 20.5 13l1.5-1.5" /><path d="m12 21 1.9-4.2 4.3-.6-3.1-3 .7-4.2-3.8 2-3.8-2 .7 4.2-3.1 3 4.3.6L12 21z" /></Icon>;
export const MenuIcon = (props: IconProps) => <Icon {...props}><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></Icon>;
export const DownloadIcon = (props: IconProps) => <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></Icon>;
export const ImportIcon = (props: IconProps) => <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></Icon>;
export const HistoryIcon = (props: IconProps) => <Icon {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></Icon>;
export const RecurringIcon = (props: IconProps) => <Icon {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Icon>;
export const CheckSquareIcon = (props: IconProps) => <Icon {...props}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></Icon>;
export const AlertTriangleIcon = (props: IconProps) => <Icon {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></Icon>;
export const RotateCwIcon = (props: IconProps) => <Icon {...props}><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 1 1.646-5.26L3 8"/></Icon>;