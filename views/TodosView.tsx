import React from 'react';
import { Todo } from '../types';
import TodoItem from '../components/cards/TodoItem';

const TodosView: React.FC<{todos: Todo[], onEdit: (item: Todo) => void, onDelete: (id: string) => void, updateTodo: (todo: Todo) => void}> = ({todos, onEdit, onDelete, updateTodo}) => {
    return <div className="space-y-4">
        <h2 className="text-3xl font-bold">Todos</h2>
        {todos.length > 0 ? (
            <div className="bg-gray-800 p-4 rounded-lg shadow-md space-y-3">
                 {todos.map(todo => <TodoItem key={todo.id} todo={todo} onEdit={() => onEdit(todo)} onDelete={() => onDelete(todo.id)} onUpdate={updateTodo} />)}
            </div>
        ) : (
            <p className="text-gray-400">No todos yet. Click 'New Todo' to create one.</p>
        )}
    </div>;
}

export default TodosView;