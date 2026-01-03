import React from 'react';
import { Todo } from '../../types';
import { CriticalityBadge } from '../Shared';
import { EditIcon, TrashIcon, CalendarIcon } from '../icons';

const TodoItem: React.FC<{todo: Todo, onUpdate: (todo: Todo) => void, onEdit: () => void, onDelete: () => void}> = ({todo, onUpdate, onEdit, onDelete}) => {
    const handleToggle = () => onUpdate({...todo, completed: !todo.completed});
    const handleSubtaskToggle = (subtaskId: string) => {
        const newSubtasks = todo.subtasks.map(st => st.id === subtaskId ? {...st, completed: !st.completed} : st);
        onUpdate({...todo, subtasks: newSubtasks});
    };
    
    const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date(new Date().setHours(0,0,0,0));

    return (
        <div className={`p-4 rounded-xl border border-transparent transition-all ${todo.completed ? 'bg-gray-700/30 opacity-75' : 'bg-gray-700/60 hover:border-gray-600'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <input 
                        type="checkbox" 
                        checked={todo.completed} 
                        onChange={handleToggle} 
                        className="h-5 w-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 mt-1 cursor-pointer" 
                    />
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-semibold leading-tight ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                                {todo.text}
                            </span>
                            <CriticalityBadge criticality={todo.criticality} />
                        </div>
                        
                        {todo.dueDate && (
                            <div className={`flex items-center gap-1.5 mt-1 text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                                <CalendarIcon className="w-3 h-3" />
                                <span>
                                    {isOverdue ? 'Overdue: ' : 'Due: '}
                                    {new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-400 transition-colors" title="Edit"><EditIcon className="w-4 h-4"/></button>
                    <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Delete"><TrashIcon className="w-4 h-4"/></button>
                </div>
            </div>

            {todo.subtasks.length > 0 && (
                <div className="pl-8 mt-3 space-y-2 border-l border-gray-600/50 ml-2.5">
                    {todo.subtasks.map(st => (
                        <div key={st.id} className="flex items-center gap-3 group">
                            <input 
                                type="checkbox" 
                                checked={st.completed} 
                                onChange={() => handleSubtaskToggle(st.id)} 
                                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 cursor-pointer" 
                            />
                            <span className={`text-sm transition-colors ${st.completed ? 'line-through text-gray-500' : 'text-gray-300 group-hover:text-white'}`}>
                                {st.text || 'Untitled subtask'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default TodoItem;