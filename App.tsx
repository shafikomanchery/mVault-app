
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  LayoutDashboardIcon, VaultIcon, StickyNoteIcon, CalendarIcon, ListTodoIcon,
  PlusIcon, TrashIcon, EditIcon, EyeIcon, EyeOffIcon, SparklesIcon, MenuIcon,
  DownloadIcon, ImportIcon, HistoryIcon, CheckSquareIcon
} from './components/icons';
import useLocalStorage from './hooks/useLocalStorage';
import {
  View, VaultItem, Account, Note, Event, Todo,
  RecurringFrequency, Criticality
} from './types';
import * as geminiService from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [items, setItems] = useLocalStorage<VaultItem[]>('vaultItems', []);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const accounts = useMemo(() => items.filter((item): item is Account => item.type === 'account'), [items]);
  const notes = useMemo(() => items.filter((item): item is Note => item.type === 'note'), [items]);
  const events = useMemo(() => items.filter((item): item is Event => item.type === 'event'), [items]);
  const todos = useMemo(() => items.filter((item): item is Todo => item.type === 'todo'), [items]);

  const [modal, setModal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);

  // Re-implement recurring events logic
  useEffect(() => {
    const intervalId = setInterval(() => {
      setItems(currentItems => {
        let itemsChanged = false;
        const updatedItems = currentItems.map(item => {
          if (item.type === 'event' && item.recurring !== RecurringFrequency.None) {
            const eventDate = new Date(item.date);
            if (eventDate.getTime() < Date.now()) {
              itemsChanged = true;
              let nextDate = new Date(eventDate);
              if (item.recurring === RecurringFrequency.Monthly) {
                nextDate.setMonth(nextDate.getMonth() + 1);
              } else if (item.recurring === RecurringFrequency.Quarterly) {
                nextDate.setMonth(nextDate.getMonth() + 3);
              } else if (item.recurring === RecurringFrequency.Yearly) {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
              }
              return { ...item, date: nextDate.toISOString() };
            }
          }
          return item;
        });
        return itemsChanged ? updatedItems : currentItems;
      });
    }, 60 * 1000); // Check once every minute

    return () => clearInterval(intervalId);
  }, [setItems]);


  const addItem = (item: Omit<VaultItem, 'id' | 'createdAt'>) => {
    const newItem: VaultItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    } as VaultItem;
    setItems(prevItems => [...prevItems, newItem]);
  };
  
  const updateItem = (updatedItem: VaultItem) => {
    setItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));
  };
  
  const deleteItem = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
    }
  }, [setItems]);
  
  const handleEdit = (item: VaultItem) => {
    setSelectedItem(item);
    setModal(`edit-${item.type}`);
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'mvault_export.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    importInputRef.current?.click();
  };

  const onImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedItems = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedItems)) {
            const validItems = importedItems.filter(item => item.id && item.type);
            if (window.confirm(`This will overwrite all current data. Are you sure you want to import ${validItems.length} items?`)) {
              setItems(validItems);
              alert('Import successful!');
            }
          } else {
            alert('Invalid file format.');
          }
        } catch (error) {
          alert('Error parsing file.');
        }
      };
      reader.readAsText(file);
      event.target.value = ''; // Reset file input
    }
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardView items={items} onEdit={handleEdit} onDelete={deleteItem} />;
      case 'vault':
        return <VaultView accounts={accounts} onEdit={handleEdit} onDelete={deleteItem} setAccounts={(newAccounts) => setItems(prevItems => [...prevItems.filter(i => i.type !== 'account'), ...newAccounts])} />;
      case 'notes':
        return <NotesView notes={notes} onEdit={handleEdit} onDelete={deleteItem} />;
      case 'events':
        return <EventsView events={events} onEdit={handleEdit} onDelete={deleteItem} />;
      case 'todos':
        return <TodosView todos={todos} onEdit={handleEdit} onDelete={deleteItem} updateTodo={updateItem as (todo: Todo) => void} />;
      default:
        return <div>Select a view</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar view={view} setView={setView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport}/>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden mr-4 p-2 rounded-md hover:bg-gray-700">
                <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-semibold capitalize">{view}</h1>
          </div>
          {view !== 'dashboard' && (
            <button onClick={() => setModal(`add-${view === 'vault' ? 'account' : view.slice(0, -1)}`)} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 flex items-center gap-2 transition-colors">
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">New {view === 'vault' ? 'Account' : view.slice(0, -1)}</span>
            </button>
          )}
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderView()}
        </div>
      </main>
      <input type="file" accept=".json" ref={importInputRef} onChange={onImportFileChange} className="hidden" />
      {modal && <ModalController modal={modal} setModal={setModal} addItem={addItem} updateItem={updateItem} selectedItem={selectedItem} setSelectedItem={setSelectedItem} />}
    </div>
  );
};

// --- COMPONENTS ---

const Sidebar: React.FC<{ view: View; setView: (view: View) => void, isOpen: boolean, setOpen: (isOpen: boolean) => void, onImport: () => void, onExport: () => void }> = ({ view, setView, isOpen, setOpen, onImport, onExport }) => {
  const NavItem: React.FC<{ targetView: View; icon: React.ReactNode; label: string }> = ({ targetView, icon, label }) => (
    <button
      onClick={() => { setView(targetView); if (window.innerWidth < 768) setOpen(false); }}
      className={`flex items-center w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors ${view === targetView ? 'bg-gray-700 text-white' : ''}`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </button>
  );

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setOpen(false)}></div>
      <aside className={`fixed md:relative top-0 left-0 h-full bg-gray-800 shadow-lg transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 flex-shrink-0 flex flex-col`}>
          <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">mVault</h2>
          </div>
          <nav className="flex-1 p-4 space-y-2">
              <NavItem targetView="dashboard" icon={<LayoutDashboardIcon className="w-6 h-6" />} label="Dashboard" />
              <NavItem targetView="vault" icon={<VaultIcon className="w-6 h-6" />} label="Vault" />
              <NavItem targetView="notes" icon={<StickyNoteIcon className="w-6 h-6" />} label="Notes" />
              <NavItem targetView="events" icon={<CalendarIcon className="w-6 h-6" />} label="Events" />
              <NavItem targetView="todos" icon={<ListTodoIcon className="w-6 h-6" />} label="Todos" />
          </nav>
          <div className="p-4 border-t border-gray-700 space-y-2">
              <button onClick={onImport} className="flex items-center w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors">
                <ImportIcon className="w-6 h-6" /> <span className="ml-3">Import Vault</span>
              </button>
              <button onClick={onExport} className="flex items-center w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors">
                <DownloadIcon className="w-6 h-6" /> <span className="ml-3">Export Vault</span>
              </button>
          </div>
      </aside>
    </>
  );
};

const DashboardView: React.FC<{items: VaultItem[], onEdit: (item: VaultItem) => void, onDelete: (id: string) => void}> = ({items, onEdit, onDelete}) => {
    const highPriorityItems = useMemo(() => items.filter(item => item.criticality === 'High').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [items]);
    const recentItems = useMemo(() => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [items]);

    const stats = useMemo(() => ({
        total: items.length,
        accounts: items.filter(i => i.type === 'account').length,
        notes: items.filter(i => i.type === 'note').length,
        events: items.filter(i => i.type === 'event').length,
        todos: items.filter(i => i.type === 'todo').length,
    }), [items]);

    const StatCard: React.FC<{icon: React.ReactNode, label: string, value: number}> = ({icon, label, value}) => (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md flex items-center">
            <div className="p-3 rounded-full bg-gray-700 text-blue-400 mr-4">{icon}</div>
            <div>
                <p className="text-gray-400">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );

    return <div className="space-y-6">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<VaultIcon/>} label="Total Items" value={stats.total} />
            <StatCard icon={<VaultIcon/>} label="Accounts" value={stats.accounts} />
            <StatCard icon={<StickyNoteIcon/>} label="Notes" value={stats.notes} />
            <StatCard icon={<CalendarIcon/>} label="Events" value={stats.events} />
            <StatCard icon={<ListTodoIcon/>} label="Todos" value={stats.todos} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">High Priority Items</h3>
                <ItemList items={highPriorityItems} onEdit={onEdit} onDelete={onDelete} />
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Recently Added</h3>
                <ItemList items={recentItems} onEdit={onEdit} onDelete={onDelete} />
            </div>
        </div>
    </div>
}

const ItemList: React.FC<{items: VaultItem[], onEdit: (item: VaultItem) => void, onDelete: (id: string) => void}> = ({items, onEdit, onDelete}) => {
    if (items.length === 0) return <p className="text-gray-400">No items to display.</p>

    const getIcon = (type: VaultItem['type']) => {
        switch(type) {
            case 'account': return <VaultIcon className="w-5 h-5 text-gray-400" />;
            case 'note': return <StickyNoteIcon className="w-5 h-5 text-gray-400" />;
            case 'event': return <CalendarIcon className="w-5 h-5 text-gray-400" />;
            case 'todo': return <ListTodoIcon className="w-5 h-5 text-gray-400" />;
        }
    }
    
    const getTitle = (item: VaultItem) => {
        if ('name' in item) return item.name;
        if ('title' in item) return item.title;
        if ('text' in item) return item.text;
        return 'Untitled';
    }
    
    return <ul className="space-y-2">
        {items.map(item => (
            <li key={item.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600">
                <div className="flex items-center gap-3">
                    {getIcon(item.type)}
                    <span className="font-medium">{getTitle(item)}</span>
                    <CriticalityBadge criticality={item.criticality} />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(item)} className="p-1 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => onDelete(item.id)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </li>
        ))}
    </ul>
}

// Specific Views
const VaultView: React.FC<{accounts: Account[], onEdit: (item: Account) => void, onDelete: (id: string) => void, setAccounts: (accounts: Account[]) => void}> = ({accounts, onEdit, onDelete, setAccounts}) => {
    const [isLoading, setIsLoading] = useState(false);
    
    const prioritizeWithAI = async () => {
        setIsLoading(true);
        try {
            const orderedIds = await geminiService.prioritizeAccountsWithAI(accounts);
            const orderedAccounts = orderedIds.map(id => accounts.find(a => a.id === id)).filter(Boolean) as Account[];
            const otherAccounts = accounts.filter(a => !orderedIds.includes(a.id));
            setAccounts([...orderedAccounts, ...otherAccounts]);
        } catch (error) {
            console.error(error);
            alert("Failed to prioritize accounts.");
        }
        setIsLoading(false);
    }
    
    return <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <h2 className="text-3xl font-bold">Vault</h2>
             <button onClick={prioritizeWithAI} disabled={isLoading} className="bg-purple-600 text-white px-4 py-2 rounded-md shadow hover:bg-purple-700 flex items-center gap-2 transition-colors disabled:bg-gray-500">
                <SparklesIcon className="w-5 h-5"/>
                {isLoading ? "Prioritizing..." : "Prioritize with AI"}
             </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map(acc => <AccountCard key={acc.id} account={acc} onEdit={() => onEdit(acc)} onDelete={() => onDelete(acc.id)} />)}
        </div>
        {accounts.length === 0 && <p className="text-gray-400">No accounts yet. Click 'New Account' to create one.</p>}
    </div>;
}

const NotesView: React.FC<{notes: Note[], onEdit: (item: Note) => void, onDelete: (id: string) => void}> = ({notes, onEdit, onDelete}) => {
    return <div className="space-y-4">
        <h2 className="text-3xl font-bold">Notes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map(note => <NoteCard key={note.id} note={note} onEdit={() => onEdit(note)} onDelete={() => onDelete(note.id)} />)}
        </div>
        {notes.length === 0 && <p className="text-gray-400">No notes yet. Click 'New Note' to create one.</p>}
    </div>;
}

const EventsView: React.FC<{events: Event[], onEdit: (item: Event) => void, onDelete: (id: string) => void}> = ({events, onEdit, onDelete}) => {
    const sortedEvents = [...events].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return <div className="space-y-4">
        <h2 className="text-3xl font-bold">Events</h2>
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <ul className="divide-y divide-gray-700">
                {sortedEvents.map(event => <EventItem key={event.id} event={event} onEdit={() => onEdit(event)} onDelete={() => onDelete(event.id)} />)}
            </ul>
        </div>
        {events.length === 0 && <p className="text-gray-400">No events yet. Click 'New Event' to create one.</p>}
    </div>;
}

const TodosView: React.FC<{todos: Todo[], onEdit: (item: Todo) => void, onDelete: (id: string) => void, updateTodo: (todo: Todo) => void}> = ({todos, onEdit, onDelete, updateTodo}) => {
    return <div className="space-y-4">
        <h2 className="text-3xl font-bold">Todos</h2>
        <div className="bg-gray-800 p-4 rounded-lg shadow-md space-y-3">
             {todos.map(todo => <TodoItem key={todo.id} todo={todo} onEdit={() => onEdit(todo)} onDelete={() => onDelete(todo.id)} onUpdate={updateTodo} />)}
        </div>
        {todos.length === 0 && <p className="text-gray-400">No todos yet. Click 'New Todo' to create one.</p>}
    </div>;
}

// Cards and Items
const AccountCard: React.FC<{account: Account, onEdit: () => void, onDelete: () => void}> = ({account, onEdit, onDelete}) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-white">{account.name}</h3>
                    <p className="text-sm text-gray-400">{account.username}</p>
                </div>
                <CriticalityBadge criticality={account.criticality} />
            </div>
            {account.password && <div className="flex items-center gap-2">
                <input type={showPassword ? 'text' : 'password'} value={account.password} readOnly className="border-none bg-gray-700 rounded px-2 py-1 w-full text-sm text-gray-200" />
                <button onClick={() => setShowPassword(!showPassword)} className="p-1 text-gray-400 hover:text-white">{showPassword ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
            </div>}
            {account.url && <a href={account.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">{account.url}</a>}
             <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </div>
    )
}
const NoteCard: React.FC<{note: Note, onEdit: () => void, onDelete: () => void}> = ({note, onEdit, onDelete}) => {
    return (
         <div className="bg-gray-800 border border-yellow-500/30 p-4 rounded-lg shadow-md flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-yellow-300">{note.title}</h3>
                <CriticalityBadge criticality={note.criticality} />
            </div>
            <p className="text-gray-300 text-sm flex-1">{note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}</p>
             <div className="flex justify-end gap-2 pt-2 border-t border-gray-700 mt-3">
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </div>
    )
}
const EventItem: React.FC<{event: Event, onEdit: () => void, onDelete: () => void}> = ({event, onEdit, onDelete}) => {
    return (
        <li className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="text-center w-16 flex-shrink-0">
                    <p className="text-blue-400 font-bold text-lg">{new Date(event.date).toLocaleDateString(undefined, {day: '2-digit'})}</p>
                    <p className="text-gray-400 text-sm">{new Date(event.date).toLocaleDateString(undefined, {month: 'short'})}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-white">{event.title}</h4>
                    <p className="text-sm text-gray-300">{event.description}</p>
                </div>
            </div>
             <div className="flex items-center gap-2 self-end sm:self-center">
                <CriticalityBadge criticality={event.criticality} />
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </li>
    )
}

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


const CriticalityBadge: React.FC<{criticality: Criticality}> = ({criticality}) => {
    const colors = {
        High: 'bg-red-500/20 text-red-300',
        Medium: 'bg-yellow-500/20 text-yellow-300',
        Low: 'bg-green-500/20 text-green-300',
    }
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[criticality]}`}>{criticality}</span>
}

// MODALS AND FORMS
const Modal: React.FC<{children: React.ReactNode, title: string, onClose: () => void}> = ({children, title, onClose}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

const ModalController: React.FC<{modal: string, setModal: (m: string|null) => void, addItem: (i: any) => void, updateItem: (i: any) => void, selectedItem: any, setSelectedItem: (i: any) => void}> = ({modal, setModal, addItem, updateItem, selectedItem, setSelectedItem}) => {
    const isEdit = modal?.startsWith('edit-');
    const type = isEdit ? modal.substring(5) : modal?.substring(4);
    
    const handleClose = () => {
        setModal(null);
        setSelectedItem(null);
    }
    
    const handleSubmit = (itemData: any) => {
        if(isEdit) {
            updateItem({ ...selectedItem, ...itemData });
        } else {
            addItem({ type, ...itemData});
        }
        handleClose();
    }
    
    switch(type) {
        case 'account': return <Modal title={isEdit ? 'Edit Account' : 'Add Account'} onClose={handleClose}><AccountForm onSubmit={handleSubmit} account={selectedItem}/></Modal>;
        case 'note': return <Modal title={isEdit ? 'Edit Note' : 'Add Note'} onClose={handleClose}><NoteForm onSubmit={handleSubmit} note={selectedItem}/></Modal>;
        case 'event': return <Modal title={isEdit ? 'Edit Event' : 'Add Event'} onClose={handleClose}><EventForm onSubmit={handleSubmit} event={selectedItem}/></Modal>;
        case 'todo': return <Modal title={isEdit ? 'Edit Todo' : 'Add Todo'} onClose={handleClose}><TodoForm onSubmit={handleSubmit} todo={selectedItem}/></Modal>;
        default: return null;
    }
}

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
    </div>
);
const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {label: string}> = ({label, children, ...props}) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <select {...props} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
            {children}
        </select>
    </div>
);

const AccountForm: React.FC<{onSubmit: (data: any) => void, account?: Account}> = ({onSubmit, account}) => {
    const [data, setData] = useState({
        name: account?.name || '',
        username: account?.username || '',
        password: account?.password || '',
        url: account?.url || '',
        accountType: account?.accountType || 'website',
        criticality: account?.criticality || 'Medium',
        history: account?.history || [],
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setData({...data, [e.target.name]: e.target.value});
    }

    const generatePassword = async () => {
        setIsLoading(true);
        const pw = await geminiService.generateStrongPassword();
        setData({...data, password: pw});
        setIsLoading(false);
    }
    
    const analyzeCriticality = async () => {
        if(!data.name) return;
        setIsLoading(true);
        const criticality = await geminiService.analyzeAccountCriticality(data.accountType, data.name);
        setData({...data, criticality});
        setIsLoading(false);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = {...data};
        if (account && account.password !== data.password) {
            finalData.history = [...(account.history || []), { timestamp: new Date().toISOString(), field: 'password', oldValue: account.password, newValue: data.password }];
        }
        onSubmit(finalData);
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Name" name="name" value={data.name} onChange={handleChange} required />
            <FormSelect label="Type" name="accountType" value={data.accountType} onChange={handleChange}>
                <option value="website">Website</option>
                <option value="bank">Bank</option>
                <option value="email">Email</option>
                <option value="subscription">Subscription</option>
            </FormSelect>
            <FormInput label="Username/Email" name="username" value={data.username} onChange={handleChange} required />
            <div className="relative">
                <FormInput label="Password" name="password" type="text" value={data.password} onChange={handleChange} />
                <button type="button" onClick={generatePassword} disabled={isLoading} className="absolute right-2 top-8 p-1 bg-purple-500/20 text-purple-300 rounded-md hover:bg-purple-500/40"><SparklesIcon className="w-5 h-5"/></button>
            </div>
            <FormInput label="URL" name="url" value={data.url} onChange={handleChange} />
            <div className="relative">
                <FormSelect label="Criticality" name="criticality" value={data.criticality} onChange={handleChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </FormSelect>
                 <button type="button" onClick={analyzeCriticality} disabled={isLoading || !data.name} className="absolute right-2 top-8 p-1 bg-purple-500/20 text-purple-300 rounded-md hover:bg-purple-500/40 disabled:opacity-50"><SparklesIcon className="w-5 h-5"/></button>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-500">
                {isLoading ? "Analyzing..." : (account ? "Update" : "Save")}
            </button>
        </form>
    );
}

const NoteForm: React.FC<{onSubmit: (data: any) => void, note?: Note}> = ({onSubmit, note}) => {
    const [data, setData] = useState({
        title: note?.title || '',
        content: note?.content || '',
        criticality: note?.criticality || 'Medium',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [sensitiveDataWarning, setSensitiveDataWarning] = useState<string|null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setData({...data, [e.target.name]: e.target.value});
    }

    const analyze = async () => {
        if (!data.title && !data.content) return;
        setIsLoading(true);
        const [crit, sensitive] = await Promise.all([
            geminiService.analyzeItemCriticality(data.title, data.content),
            geminiService.detectSensitiveData(data.content)
        ]);
        setData(d => ({...d, criticality: crit}));
        setSensitiveDataWarning(sensitive);
        setIsLoading(false);
    }
    
    return (
         <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
            <FormInput label="Title" name="title" value={data.title} onChange={handleChange} required />
            <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                <textarea name="content" value={data.content} onChange={handleChange} rows={5} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
             {sensitiveDataWarning && <p className="text-sm text-red-300 bg-red-500/20 p-2 rounded-md">{sensitiveDataWarning}</p>}
             <FormSelect label="Criticality" name="criticality" value={data.criticality} onChange={handleChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
            </FormSelect>
             <button type="button" onClick={analyze} disabled={isLoading || (!data.title && !data.content)} className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2 disabled:bg-gray-500">
                <SparklesIcon className="w-5 h-5"/>
                {isLoading ? "Analyzing..." : "Analyze with AI"}
            </button>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                {note ? "Update" : "Save"}
            </button>
        </form>
    );
}
const EventForm: React.FC<{onSubmit: (data: any) => void, event?: Event}> = ({onSubmit, event}) => {
    const [data, setData] = useState({
        title: event?.title || '',
        date: event?.date ? new Date(event.date).toISOString().split('T')[0] : '',
        description: event?.description || '',
        recurring: event?.recurring || RecurringFrequency.None,
        criticality: event?.criticality || 'Medium',
    });
     const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setData({...data, [e.target.name]: e.target.value});
    }

    const analyzeCriticality = async () => {
        if(!data.title && !data.description) return;
        setIsLoading(true);
        const crit = await geminiService.analyzeItemCriticality(data.title, data.description);
        setData(d => ({...d, criticality: crit}));
        setIsLoading(false);
    }

    return (
         <form onSubmit={(e) => { e.preventDefault(); onSubmit({...data, date: new Date(data.date).toISOString()}); }} className="space-y-4">
            <FormInput label="Title" name="title" value={data.title} onChange={handleChange} required />
            <FormInput label="Date" name="date" type="date" value={data.date} onChange={handleChange} required />
            <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea name="description" value={data.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <FormSelect label="Recurring" name="recurring" value={data.recurring} onChange={handleChange}>
                <option value={RecurringFrequency.None}>None</option>
                <option value={RecurringFrequency.Monthly}>Monthly</option>
                <option value={RecurringFrequency.Quarterly}>Quarterly</option>
                <option value={RecurringFrequency.Yearly}>Yearly</option>
            </FormSelect>
            <div className="relative">
                <FormSelect label="Criticality" name="criticality" value={data.criticality} onChange={handleChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </FormSelect>
                <button type="button" onClick={analyzeCriticality} disabled={isLoading || (!data.title && !data.description)} className="absolute right-2 top-8 p-1 bg-purple-500/20 text-purple-300 rounded-md hover:bg-purple-500/40 disabled:opacity-50"><SparklesIcon className="w-5 h-5"/></button>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                {event ? "Update" : "Save"}
            </button>
        </form>
    );
}

const TodoForm: React.FC<{onSubmit: (data: any) => void, todo?: Todo}> = ({onSubmit, todo}) => {
    const [data, setData] = useState({
        text: todo?.text || '',
        subtasks: todo?.subtasks || [],
        criticality: todo?.criticality || 'Medium',
        completed: todo?.completed || false,
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setData({...data, [e.target.name]: e.target.value});
    }

    const optimizeWithAI = async () => {
        if (!data.text) return;
        setIsLoading(true);
        const subtaskTexts = await geminiService.optimizeTodoWithAI(data.text);
        const newSubtasks = subtaskTexts.map(text => ({id: crypto.randomUUID(), text, completed: false}));
        setData(d => ({...d, subtasks: [...d.subtasks, ...newSubtasks]}));
        setIsLoading(false);
    }
    
    return (
         <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
            <FormInput label="Task" name="text" value={data.text} onChange={handleChange} required />
             <FormSelect label="Criticality" name="criticality" value={data.criticality} onChange={handleChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
            </FormSelect>
            <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Subtasks</h4>
                {data.subtasks.map((st, i) => <div key={st.id} className="flex items-center gap-2 mb-1">
                    <input value={st.text} onChange={(e) => {
                        const newSubtasks = [...data.subtasks];
                        newSubtasks[i].text = e.target.value;
                        setData({...data, subtasks: newSubtasks});
                    }} className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 text-white rounded-md" />
                    <button type="button" onClick={() => setData({...data, subtasks: data.subtasks.filter(s => s.id !== st.id)})}><TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-400"/></button>
                </div>)}
                <button type="button" onClick={() => setData({...data, subtasks: [...data.subtasks, {id: crypto.randomUUID(), text: '', completed: false}]})} className="text-sm text-blue-400 hover:underline mt-1">Add subtask</button>
            </div>
            
            <button type="button" onClick={optimizeWithAI} disabled={isLoading || !data.text} className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2 disabled:bg-gray-500">
                <SparklesIcon className="w-5 h-5"/>
                {isLoading ? "Optimizing..." : "Break down with AI"}
            </button>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                {todo ? "Update" : "Save"}
            </button>
        </form>
    );
}

export default App;
