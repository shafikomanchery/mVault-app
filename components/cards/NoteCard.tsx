
import React from 'react';
import { Note } from '../../types';
import { CriticalityBadge } from '../Shared';
import { TrashIcon, StickyNoteIcon, ChevronLeftIcon } from '../icons';

const NoteCard: React.FC<{note: Note, onEdit: () => void, onDelete: () => void}> = ({note, onEdit, onDelete}) => {
    return (
         <div 
            onClick={onEdit}
            className="group relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden hover:bg-gray-800/60 hover:border-blue-500/30 transition-all active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md"
        >
            <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl">
                            <StickyNoteIcon className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-base text-white truncate group-hover:text-blue-400 transition-colors leading-tight">
                            {note.title || 'Untitled Note'}
                        </h3>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm line-clamp-3 leading-relaxed font-medium mb-4">
                        {note.content || 'No content...'}
                    </p>
                    <div className="flex items-center justify-between">
                        <CriticalityBadge criticality={note.criticality} />
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                            {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                
                <div className="flex flex-col items-center justify-between self-stretch shrink-0">
                    <div className="p-2 rounded-full bg-gray-900/40 text-gray-500 group-hover:text-blue-400 transition-colors">
                        <ChevronLeftIcon className="w-4 h-4 rotate-180" />
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 text-gray-600 hover:text-red-400 transition-colors mt-auto"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default NoteCard;
