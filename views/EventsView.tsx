import React from 'react';
import { Event } from '../types';
import EventItem from '../components/cards/EventItem';

const EventsView: React.FC<{events: Event[], onEdit: (item: Event) => void, onDelete: (id: string) => void}> = ({events, onEdit, onDelete}) => {
    const sortedEvents = [...events].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return <div className="space-y-4">
        <h2 className="text-3xl font-bold">Events</h2>
        {events.length > 0 ? (
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                <ul className="divide-y divide-gray-700">
                    {sortedEvents.map(event => <EventItem key={event.id} event={event} onEdit={() => onEdit(event)} onDelete={() => onDelete(event.id)} />)}
                </ul>
            </div>
        ) : (
            <p className="text-gray-400">No events yet. Click 'New Event' to create one.</p>
        )}
    </div>;
}

export default EventsView;