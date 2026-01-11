
import React, { useMemo } from 'react';
import { Todo } from '../types';
import TodoItem from '../components/cards/TodoItem';
import { ListTodoIcon } from '../components/icons';

const TodosView: React.FC<{todos: Todo[], onEdit: (item: Todo) => void, onDelete: (id: string) => void, updateTodo: (todo: Todo) => void}> = ({todos, onEdit, onDelete, updateTodo}) => {
    const sections = useMemo(() => {
        const active = todos.filter(t => !t.completed).sort((a,b) => (b.criticality === 'High' ? 1 : -1));
        const done = todos.filter(t => t.completed);
        return { active, done };
    }, [todos]);

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <header className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Security Tasks</h2>
                    <p className="text-gray-500 text-[10px] sm:text-sm font-bold uppercase tracking-widest mt-1">Active Checklist</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700/50 px-3 py-1.5 rounded-full text-[10px] font-black text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                    <ListTodoIcon className="w-3.5 h-3.5" />
                    {todos.length} Total
                </div>
            </header>

            {todos.length > 0 ? (
                <div className="space-y-8">
                    {/* Active Tasks */}
                    {sections.active.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="px-1 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">In Progress</h3>
                            <div className="space-y-3">
                                {sections.active.map(todo => (
                                    <TodoItem 
                                        key={todo.id} 
                                        todo={todo} 
                                        onEdit={() => onEdit(todo)} 
                                        onDelete={() => onDelete(todo.id)} 
                                        onUpdate={updateTodo} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Tasks */}
                    {sections.done.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="px-1 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Archived</h3>
                            <div className="space-y-3">
                                {sections.done.map(todo => (
                                    <TodoItem 
                                        key={todo.id} 
                                        todo={todo} 
                                        onEdit={() => onEdit(todo)} 
                                        onDelete={() => onDelete(todo.id)} 
                                        onUpdate={updateTodo} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-800/10 border border-dashed border-gray-800 rounded-[40px]">
                    <div className="bg-gray-800/40 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-700/30">
                        <ListTodoIcon className="w-8 h-8 text-gray-700" />
                    </div>
                    <p className="text-gray-600 font-bold text-sm">Inbox Zero.</p>
                    <p className="text-gray-700 text-[10px] uppercase tracking-widest mt-2">Keep your digital life tidy</p>
                </div>
            )}
        </div>
    );
}

export default TodosView;
