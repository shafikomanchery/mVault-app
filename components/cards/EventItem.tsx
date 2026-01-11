
import React from 'react';
import { Event } from '../../types';
import { CriticalityBadge } from '../Shared';
import { TrashIcon, CheckIcon, RotateCwIcon } from '../icons';

const EventItem: React.FC<{event: Event, onUpdate: (event: Event) => void, onEdit: () => void, onDelete: () => void}> = ({event, onUpdate, onEdit, onDelete}) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const isPast = eventDate < now && !event.completed;
    
    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate({...event, completed: !event.completed});
    };

    return (
        <li 
            onClick={onEdit}
            className={`group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl transition-all cursor-pointer hover:bg-gray-800/60 hover:border-blue-500/30 shadow-sm ${event.completed ? 'opacity-50' : 'opacity-100'}`}
        >
            {/* 1. Compact Circular Toggle */}
            <button 
                onClick={handleToggle}
                className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-75 z-10 ${
                    event.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-gray-600 hover:border-green-500/50 text-transparent'
                }`}
            >
                <CheckIcon className={`w-3.5 h-3.5 stroke-[4] ${event.completed ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 group-hover:text-green-500'}`} />
            </button>

            {/* 2. Optimized Date Display */}
            <div className={`flex flex-col items-center shrink-0 w-10 sm:w-12 transition-colors ${event.completed ? 'grayscale' : ''}`}>
                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${isPast ? 'text-red-500' : 'text-gray-500'}`}>
                    {eventDate.toLocaleDateString(undefined, {month: 'short'})}
                </span>
                <span className={`text-xl sm:text-2xl font-black tabular-nums leading-none mt-0.5 ${isPast ? 'text-red-400' : 'text-white'}`}>
                    {eventDate.getDate()}
                </span>
            </div>

            <div className={`w-[1px] h-8 sm:h-10 ${isPast ? 'bg-red-500/20' : 'bg-gray-700/50'}`} />

            {/* 3. Responsive Content Section */}
            <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-bold text-sm sm:text-base text-gray-100 truncate ${event.completed ? 'line-through text-gray-500' : ''}`}>
                        {event.title}
                    </h4>
                    {event.completed && (
                        <span className="shrink-0 text-[8px] font-black bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20 uppercase tracking-tighter">Done</span>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <CriticalityBadge criticality={event.criticality} />
                    
                    {isPast && !event.completed && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md">
                            <span className="text-[8px] font-black text-red-500 uppercase tracking-tight">Overdue</span>
                        </div>
                    )}

                    {event.recurring !== 'None' && !event.completed && (
                         <span className="text-[8px] sm:text-[9px] font-bold text-indigo-400/80 uppercase flex items-center gap-1">
                            <RotateCwIcon className="w-2.5 h-2.5" />
                            {event.recurring}
                        </span>
                    )}
                </div>
            </div>

            {/* 4. Secondary Actions */}
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-2 text-gray-600 hover:text-red-400 transition-colors shrink-0"
            >
                <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
        </li>
    )
}

export default EventItem;
