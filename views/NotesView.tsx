import React from 'react';
import { Note } from '../types';
import NoteCard from '../components/cards/NoteCard';

const NotesView: React.FC<{notes: Note[], onEdit: (item: Note) => void, onDelete: (id: string) => void}> = ({notes, onEdit, onDelete}) => {
    return <div className="space-y-4">
        <h2 className="text-3xl font-bold">Notes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map(note => <NoteCard key={note.id} note={note} onEdit={() => onEdit(note)} onDelete={() => onDelete(note.id)} />)}
        </div>
        {notes.length === 0 && <p className="text-gray-400">No notes yet. Click 'New Note' to create one.</p>}
    </div>;
}

export default NotesView;