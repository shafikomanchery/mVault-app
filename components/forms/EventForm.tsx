
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
        onSave({ 
            ...itemToEdit, 
            id: itemToEdit?.id || '', 
            type: 'event', 
            title, 
            date, 
            description, 
            recurring, 
            criticality, 
            completed: itemToEdit?.completed || false,
            createdAt: itemToEdit?.createdAt || '' 
        } as Event);
        onClose();
    };

    const inputClass = "w-full bg-gray-900/60 border border-gray-700/50 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-white font-medium text-sm";
    const labelClass = "text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block";

    return (
        <form onSubmit={handleSubmit} className="space-y-5 pb-6">
            <div>
                <label className={labelClass}>Event Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Birthday, Meeting, Deadline..." required className={inputClass} />
            </div>
            
            <div>
                <label className={labelClass}>Date & Time</label>
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} />
            </div>

            <div>
                <label className={labelClass}>Description (Optional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add some context..." rows={3} className={`${inputClass} resize-none`}></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Frequency</label>
                <select value={recurring} onChange={e => setRecurring(e.target.value as RecurringFrequency)} className={inputClass}>
                    {Object.values(RecurringFrequency).map(freq => <option key={freq} value={freq}>{freq}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className={inputClass}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                </select>
              </div>
            </div>
            
            <button type="submit" className="w-full bg-blue-600 p-4 rounded-2xl font-black text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/30 active:scale-95 mt-4 tracking-wide">
                SAVE EVENT
            </button>
        </form>
    );
};

export default EventForm;
