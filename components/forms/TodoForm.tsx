import React, { useState } from 'react';
import { Todo, Subtask, Criticality, FormProps } from '../../types';
import { PlusIcon, TrashIcon } from '../icons';

const TodoForm: React.FC<FormProps<Todo>> = ({ onSave, onClose, itemToEdit }) => {
    const [text, setText] = useState(itemToEdit?.text || '');
    const [subtasks, setSubtasks] = useState<Subtask[]>(itemToEdit?.subtasks || []);
    const [criticality, setCriticality] = useState<Criticality>(itemToEdit?.criticality || 'Medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...itemToEdit, id: itemToEdit?.id || '', type: 'todo', text, subtasks, criticality, completed: itemToEdit?.completed || false, createdAt: itemToEdit?.createdAt || '' } as Todo);
        onClose();
    };
    
    const addSubtask = () => {
        setSubtasks(current => [...current, { id: crypto.randomUUID(), text: '', completed: false }]);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Todo task..." required className="w-full bg-gray-700 p-2 rounded" />
            <div className="space-y-2">
                {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-2">
                        <input type="text" value={st.text} onChange={e => setSubtasks(current => current.map(s => s.id === st.id ? {...s, text: e.target.value} : s))} placeholder="New subtask" className="w-full bg-gray-600 p-1 rounded text-sm"/>
                        <button type="button" onClick={() => setSubtasks(current => current.filter(s => s.id !== st.id))} className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ))}
            </div>
             <button type="button" onClick={addSubtask} className="w-full text-left text-blue-400 hover:text-blue-300 p-2 rounded text-sm flex items-center gap-2">
                <PlusIcon className="w-4 h-4" /> Add Subtask
            </button>
            <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className="w-full bg-gray-700 p-2 rounded">
                <option>Low</option><option>Medium</option><option>High</option>
            </select>
            <button type="submit" className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">Save</button>
        </form>
    );
};

export default TodoForm;