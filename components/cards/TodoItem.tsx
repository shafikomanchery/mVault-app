
import React from 'react';
import { Todo } from '../../types';
import { CriticalityBadge } from '../Shared';
import { TrashIcon, CalendarIcon, ListTodoIcon, ChevronLeftIcon } from '../icons';

const TodoItem: React.FC<{todo: Todo, onUpdate: (todo: Todo) => void, onEdit: () => void, onDelete: () => void}> = ({todo, onUpdate, onEdit, onDelete}) => {
    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate({...todo, completed: !todo.completed});
    };

    const handleSubtaskToggle = (e: React.MouseEvent, subtaskId: string) => {
        e.stopPropagation();
        const newSubtasks = todo.subtasks.map(st => st.id === subtaskId ? {...st, completed: !st.completed} : st);
        onUpdate({...todo, subtasks: newSubtasks});
    };
    
    const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date(new Date().setHours(0,0,0,0));
    const completedSubtasks = todo.subtasks.filter(s => s.completed).length;
    const totalSubtasks = todo.subtasks.length;

    return (
        <div 
            onClick={onEdit}
            className={`group bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 transition-all hover:bg-gray-800/60 hover:border-blue-500/30 cursor-pointer shadow-sm hover:shadow-md ${todo.completed ? 'opacity-50 grayscale-[0.2]' : ''}`}
        >
            <div className="flex items-start gap-4">
                <button 
                    onClick={handleToggle}
                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${todo.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 hover:border-blue-500'}`}
                >
                    {todo.completed && <span className="text-xs font-bold">✓</span>}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-bold text-sm sm:text-base text-gray-100 truncate ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                            {todo.text}
                        </h4>
                        <CriticalityBadge criticality={todo.criticality} />
                    </div>

                    <div className="flex items-center gap-3">
                        {todo.dueDate && (
                            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                                <CalendarIcon className="w-3.5 h-3.5" />
                                <span>{new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                        )}
                        {totalSubtasks > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/10">
                                <ListTodoIcon className="w-3.5 h-3.5" />
                                {completedSubtasks}/{totalSubtasks}
                            </div>
                        )}
                    </div>

                    {totalSubtasks > 0 && !todo.completed && (
                        <div className="mt-4 space-y-2 border-l-2 border-gray-700/30 pl-4 ml-1">
                            {todo.subtasks.slice(0, 3).map(st => (
                                <div key={st.id} className="flex items-center gap-2 py-0.5">
                                    <div className={`w-3 h-3 rounded-sm border flex items-center justify-center text-[8px] ${st.completed ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-gray-600'}`}>
                                        {st.completed && '✓'}
                                    </div>
                                    <span className={`text-[11px] font-semibold truncate ${st.completed ? 'text-gray-600 line-through' : 'text-gray-400'}`}>
                                        {st.text || 'Untitled Task'}
                                    </span>
                                </div>
                            ))}
                            {totalSubtasks > 3 && <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">+{totalSubtasks - 3} more subtasks</p>}
                        </div>
                    )}
                </div>

                <div className="shrink-0 flex flex-col justify-between self-stretch">
                    <div className="text-gray-700 hover:text-blue-400 p-1">
                        <ChevronLeftIcon className="w-4 h-4 rotate-180" />
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 text-gray-600 hover:text-red-400 mt-auto transition-colors"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default TodoItem;
