import React from 'react';
import { Note } from '../../types';
import { CriticalityBadge } from '../Shared';
import { EditIcon, TrashIcon } from '../icons';

const NoteCard: React.FC<{note: Note, onEdit: () => void, onDelete: () => void}> = ({note, onEdit, onDelete}) => {
    return (
         <div className="bg-gray-800 border border-yellow-500/30 p-4 rounded-lg shadow-md flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-yellow-300">{note.title}</h3>
                <CriticalityBadge criticality={note.criticality} />
            </div>
            <p className="text-gray-300 text-sm flex-1">{note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}</p>
             <div className="flex justify-end gap-2 pt-2 border-t border-gray-700 mt-3">
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </div>
    )
}

export default NoteCard;