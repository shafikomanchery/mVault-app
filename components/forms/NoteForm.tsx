import React, { useState } from 'react';
import { Note, Criticality, FormProps } from '../../types';

const NoteForm: React.FC<FormProps<Note>> = ({ onSave, onClose, itemToEdit }) => {
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [content, setContent] = useState(itemToEdit?.content || '');
    const [criticality, setCriticality] = useState<Criticality>(itemToEdit?.criticality || 'Medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...itemToEdit, id: itemToEdit?.id || '', type: 'note', title, content, criticality, createdAt: itemToEdit?.createdAt || '' } as Note);
        onClose();
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note Title" required className="w-full bg-gray-700 p-2 rounded" />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Your note..." rows={5} className="w-full bg-gray-700 p-2 rounded"></textarea>
            <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className="w-full bg-gray-700 p-2 rounded">
                <option>Low</option><option>Medium</option><option>High</option>
            </select>
            <button type="submit" className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">Save</button>
        </form>
    );
};

export default NoteForm;