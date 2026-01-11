
import React, { useState } from 'react';
import { Todo, Subtask, Criticality, FormProps } from '../../types';
import { PlusIcon, TrashIcon } from '../icons';

const TodoForm: React.FC<FormProps<Todo>> = ({ onSave, onClose, itemToEdit }) => {
    const [text, setText] = useState(itemToEdit?.text || '');
    const [subtasks, setSubtasks] = useState<Subtask[]>(itemToEdit?.subtasks || []);
    const [dueDate, setDueDate] = useState(itemToEdit?.dueDate ? itemToEdit.dueDate.split('T')[0] : '');
    const [criticality, setCriticality] = useState<Criticality>(itemToEdit?.criticality || 'Medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ 
            ...itemToEdit, 
            id: itemToEdit?.id || '', 
            type: 'todo', 
            text, 
            subtasks, 
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            criticality, 
            completed: itemToEdit?.completed || false, 
            createdAt: itemToEdit?.createdAt || '' 
        } as Todo);
        onClose();
    };
    
    const addSubtask = () => {
        setSubtasks(current => [...current, { id: crypto.randomUUID(), text: '', completed: false }]);
    };

    const inputClass = "w-full bg-gray-900/60 border border-gray-700/50 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-white font-medium text-sm";
    const labelClass = "text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block";

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-6">
            <div>
                <label className={labelClass}>Task Description</label>
                <input 
                    type="text" 
                    value={text} 
                    onChange={e => setText(e.target.value)} 
                    placeholder="Clear car, pay rent, update vault..." 
                    required 
                    className={inputClass} 
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Due Date</label>
                    <input 
                        type="date" 
                        value={dueDate} 
                        onChange={e => setDueDate(e.target.value)} 
                        className={inputClass} 
                    />
                </div>
                <div>
                    <label className={labelClass}>Priority</label>
                    <select 
                        value={criticality} 
                        onChange={e => setCriticality(e.target.value as Criticality)} 
                        className={inputClass}
                    >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                <label className={labelClass}>Breakdown Subtasks</label>
                <div className="space-y-2.5">
                    {subtasks.map((st) => (
                        <div key={st.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                            <input 
                                type="text" 
                                value={st.text} 
                                onChange={e => setSubtasks(current => current.map(s => s.id === st.id ? {...s, text: e.target.value} : s))} 
                                placeholder="Add step..." 
                                className="w-full bg-gray-900/40 border border-gray-700/30 p-3 rounded-xl text-xs focus:ring-1 focus:ring-blue-400 outline-none font-medium"
                            />
                            <button type="button" onClick={() => setSubtasks(current => current.filter(s => s.id !== st.id))} className="text-red-500/60 hover:text-red-500 p-2 shrink-0">
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addSubtask} className="w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-400 border-2 border-dashed border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2">
                        <PlusIcon className="w-4 h-4" /> Add Milestone
                    </button>
                </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 p-4 rounded-2xl font-black text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/30 active:scale-95 tracking-wide">
                SAVE TASK
            </button>
        </form>
    );
};

export default TodoForm;
