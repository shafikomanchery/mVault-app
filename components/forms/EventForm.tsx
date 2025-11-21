import React, { useState } from 'react';
import { Event, RecurringFrequency, Criticality, FormProps } from '../../types';

const EventForm: React.FC<FormProps<Event>> = ({ onSave, onClose, itemToEdit }) => {
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [date, setDate] = useState(itemToEdit?.date ? new Date(itemToEdit.date).toISOString().substring(0, 16) : '');
    const [description, setDescription] = useState(itemToEdit?.description || '');
    const [recurring, setRecurring] = useState<RecurringFrequency>(itemToEdit?.recurring || RecurringFrequency.None);
    const [criticality, setCriticality] = useState<Criticality>(itemToEdit?.criticality || 'Medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...itemToEdit, id: itemToEdit?.id || '', type: 'event', title, date, description, recurring, criticality, createdAt: itemToEdit?.createdAt || '' } as Event);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event Title" required className="w-full bg-gray-700 p-2 rounded" />
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-gray-700 p-2 rounded" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." rows={3} className="w-full bg-gray-700 p-2 rounded"></textarea>
            <div className="grid grid-cols-2 gap-4">
              <select value={recurring} onChange={e => setRecurring(e.target.value as RecurringFrequency)} className="w-full bg-gray-700 p-2 rounded">
                  {Object.values(RecurringFrequency).map(freq => <option key={freq} value={freq} className="capitalize">{freq}</option>)}
              </select>
              <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className="w-full bg-gray-700 p-2 rounded">
                  <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">Save</button>
        </form>
    );
};

export default EventForm;