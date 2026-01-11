
import React from 'react';
import { Event } from '../types';
import EventItem from '../components/cards/EventItem';
import { CalendarIcon } from '../components/icons';

const EventsView: React.FC<{events: Event[], onEdit: (item: Event) => void, onDelete: (id: string) => void, updateEvent: (event: Event) => void}> = ({events, onEdit, onDelete, updateEvent}) => {
    const sortedEvents = [...events].sort((a,b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <header className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Key Dates</h2>
                    <p className="text-gray-500 text-[10px] sm:text-sm font-bold uppercase tracking-widest mt-1">Life Milestones</p>
                </div>
                {events.some(e => e.completed) && (
                    <div className="flex items-center gap-1.5 bg-green-500/5 text-green-500/60 px-2 py-0.5 rounded-full border border-green-500/10 text-[9px] font-black uppercase">
                        <span className="w-1 h-1 rounded-full bg-green-500" />
                        {events.filter(e => e.completed).length} Done
                    </div>
                )}
            </header>
            
            {events.length > 0 ? (
                <div className="bg-gray-800/10 border border-gray-800/40 rounded-[32px] overflow-hidden p-1 pb-8">
                    <ul className="divide-y divide-gray-800/30">
                        {sortedEvents.map(event => (
                            <EventItem 
                                key={event.id} 
                                event={event} 
                                onUpdate={updateEvent}
                                onEdit={() => onEdit(event)} 
                                onDelete={() => onDelete(event.id)} 
                            />
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-800/10 border border-dashed border-gray-800 rounded-[40px]">
                    <div className="bg-gray-800/40 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-700/30">
                        <CalendarIcon className="w-8 h-8 text-gray-700" />
                    </div>
                    <p className="text-gray-600 font-bold text-sm">No scheduled events.</p>
                    <p className="text-gray-700 text-[10px] uppercase tracking-widest mt-2">Mark important recurring dates</p>
                </div>
            )}
        </div>
    );
}

export default EventsView;
