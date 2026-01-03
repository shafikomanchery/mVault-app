import React, { useState } from 'react';
import { Todo, Subtask, Criticality, FormProps } from '../../types';
import { PlusIcon, TrashIcon, CalendarIcon } from '../icons';

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

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input 
                type="text" 
                value={text} 
                onChange={e => setText(e.target.value)} 
                placeholder="What needs to be done?" 
                required 
                className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
            />
            
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" /> Deadline (Optional)
                </label>
                <input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                    className="w-full bg-gray-700 p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
            </div>

            <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase ml-1">Subtasks</p>
                {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={st.text} 
                            onChange={e => setSubtasks(current => current.map(s => s.id === st.id ? {...s, text: e.target.value} : s))} 
                            placeholder="Add sub-task..." 
                            className="w-full bg-gray-600 p-2 rounded text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                        />
                        <button type="button" onClick={() => setSubtasks(current => current.filter(s => s.id !== st.id))} className="text-red-400 hover:text-red-300 p-1">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addSubtask} className="w-full text-left text-blue-400 hover:text-blue-300 p-2 rounded text-sm flex items-center gap-2 border border-dashed border-gray-600 hover:border-blue-400 transition-colors">
                    <PlusIcon className="w-4 h-4" /> Add Subtask
                </button>
            </div>

            <div>
                <p className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1">Priority</p>
                <select 
                    value={criticality} 
                    onChange={e => setCriticality(e.target.value as Criticality)} 
                    className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                </select>
            </div>

            <button type="submit" className="w-full bg-blue-600 p-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg mt-2">
                Save Task
            </button>
        </form>
    );
};

export default TodoForm;