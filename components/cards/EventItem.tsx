import React from 'react';
import { Event } from '../../types';
import { CriticalityBadge } from '../Shared';
import { EditIcon, TrashIcon } from '../icons';

const EventItem: React.FC<{event: Event, onEdit: () => void, onDelete: () => void}> = ({event, onEdit, onDelete}) => {
    return (
        <li className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="text-center w-16 flex-shrink-0">
                    <p className="text-blue-400 font-bold text-lg">{new Date(event.date).toLocaleDateString(undefined, {day: '2-digit'})}</p>
                    <p className="text-gray-400 text-sm">{new Date(event.date).toLocaleDateString(undefined, {month: 'short'})}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-white">{event.title}</h4>
                    <p className="text-sm text-gray-300">{event.description}</p>
                </div>
            </div>
             <div className="flex items-center gap-2 self-end sm:self-center">
                <CriticalityBadge criticality={event.criticality} />
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </li>
    )
}

export default EventItem;