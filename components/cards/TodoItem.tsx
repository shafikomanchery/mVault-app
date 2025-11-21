import React from 'react';
import { Todo } from '../../types';
import { CriticalityBadge } from '../Shared';
import { EditIcon, TrashIcon } from '../icons';

const TodoItem: React.FC<{todo: Todo, onUpdate: (todo: Todo) => void, onEdit: () => void, onDelete: () => void}> = ({todo, onUpdate, onEdit, onDelete}) => {
    const handleToggle = () => onUpdate({...todo, completed: !todo.completed});
    const handleSubtaskToggle = (subtaskId: string) => {
        const newSubtasks = todo.subtasks.map(st => st.id === subtaskId ? {...st, completed: !st.completed} : st);
        onUpdate({...todo, subtasks: newSubtasks});
    };
    return (
        <div className={`p-3 rounded-lg ${todo.completed ? 'bg-gray-700/50' : ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <input type="checkbox" checked={todo.completed} onChange={handleToggle} className="h-5 w-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500" />
                    <span className={`font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-white'}`}>{todo.text}</span>
                    <CriticalityBadge criticality={todo.criticality} />
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>
            {todo.subtasks.length > 0 && <div className="pl-8 pt-2 space-y-1">
                {todo.subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={st.completed} onChange={() => handleSubtaskToggle(st.id)} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500" />
                        <span className={`text-sm ${st.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>{st.text}</span>
                    </div>
                ))}
            </div>}
        </div>
    )
}

export default TodoItem;