import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  LayoutDashboardIcon, VaultIcon, StickyNoteIcon, CalendarIcon, ListTodoIcon,
  PlusIcon, TrashIcon, EditIcon, EyeIcon, EyeOffIcon, SparklesIcon, MenuIcon,
  DownloadIcon, ImportIcon, HistoryIcon, CheckSquareIcon, AlertTriangleIcon, RotateCwIcon,
  MVaultLogo
} from './components/icons';
import useLocalStorage from './hooks/useLocalStorage';
import {
  View, VaultItem, Account, Note, Event, Todo,
  RecurringFrequency, Criticality, HistoryEntry, AccountType, Subtask
} from './types';
import * as geminiService from './services/geminiService';

const MOCK_DATA: VaultItem[] = [
    {
        id: 'mock-acc-1',
        type: 'account',
        accountType: 'bank',
        name: 'Savings Account (Mock)',
        username: 'user123',
        password: 'Password123!',
        url: 'https://mybank.com',
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        history: [],
        priority: 1,
        criticality: 'High',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'mock-acc-2',
        type: 'account',
        accountType: 'website',
        name: 'Social Media (Mock)',
        username: 'myprofile',
        password: 'SocialPassword!',
        url: 'https://social.com',
        history: [],
        priority: 2,
        criticality: 'Medium',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'mock-note-1',
        type: 'note',
        title: 'Project Ideas (Mock)',
        content: 'Think about a new side project. Maybe something with React and AI. This is a mock note you can safely delete.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        criticality: 'Low'
    },
    {
        id: 'mock-todo-1',
        type: 'todo',
        text: 'Finish the report (Mock)',
        completed: false,
        subtasks: [{id: 'sub1', text: 'Gather data', completed: true}, {id: 'sub2', text: 'Write draft', completed: false}],
        createdAt: new Date().toISOString(),
        criticality: 'High'
    }
];


const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [items, setItems] = useLocalStorage<VaultItem[]>('vaultItems', MOCK_DATA);
  const [lastAccountType, setLastAccountType] = useLocalStorage<AccountType>('lastAccountType', 'website');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const accounts = useMemo(() => items.filter((item): item is Account => item.type === 'account'), [items]);
  const notes = useMemo(() => items.filter((item): item is Note => item.type === 'note'), [items]);
  const events = useMemo(() => items.filter((item): item is Event => item.type === 'event'), [items]);
  const todos = useMemo(() => items.filter((item): item is Todo => item.type === 'todo'), [items]);

  const [modal, setModal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<Account | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

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

  const addItem = useCallback((item: Omit<VaultItem, 'id' | 'createdAt'>) => {
    const newItem: VaultItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    } as VaultItem;
    setItems(prevItems => [...prevItems, newItem]);
  }, [setItems]);
  
  const updateItem = useCallback((updatedItem: VaultItem) => {
    setItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));
  }, [setItems]);
  
  const requestDelete = useCallback((id: string) => {
    setItemToDeleteId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (itemToDeleteId) {
      setItems(prevItems => prevItems.filter(item => item.id !== itemToDeleteId));
      setItemToDeleteId(null);
    }
  }, [itemToDeleteId, setItems]);

  const cancelDelete = () => {
    setItemToDeleteId(null);
  };

  const itemForDeleteModal = useMemo(() => {
    return itemToDeleteId ? items.find(item => item.id === itemToDeleteId) : null;
  }, [itemToDeleteId, items]);

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

  const handleAiPrioritization = async () => {
    setIsAnalyzing(true);
    try {
        const accountsToPrioritize = items.filter((i): i is Account => i.type === 'account');
        const otherItems = items.filter(i => i.type !== 'account');
        
        if (accountsToPrioritize.length > 0) {
            const orderedAccountIds = await geminiService.prioritizeAccountsWithAI(accountsToPrioritize);
            const accountMap = new Map(accountsToPrioritize.map(acc => [acc.id, acc]));
            const orderedAccounts = orderedAccountIds.map(id => accountMap.get(id)).filter((acc): acc is Account => !!acc);
            const unorderedAccounts = accountsToPrioritize.filter(acc => !orderedAccountIds.includes(acc.id));
            
            setItems([...otherItems, ...orderedAccounts, ...unorderedAccounts]);
            alert('AI prioritization complete! Your Vault view has been updated.');
        } else {
            alert('No accounts found to prioritize.');
        }

    } catch (error) {
        console.error("AI Prioritization failed:", error);
        alert("An error occurred during AI prioritization. Please try again.");
    } finally {
        setIsAnalyzing(false);
    }
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardView items={items} onEdit={handleEdit} onDelete={requestDelete} onAiPrioritize={handleAiPrioritization} isAnalyzing={isAnalyzing} />;
      case 'vault':
        return <VaultView accounts={accounts} onEdit={handleEdit} onDelete={requestDelete} onShowHistory={setHistoryModalItem}/>;
      case 'notes':
        return <NotesView notes={notes} onEdit={handleEdit} onDelete={requestDelete} />;
      case 'events':
        return <EventsView events={events} onEdit={handleEdit} onDelete={requestDelete} />;
      case 'todos':
        return <TodosView todos={todos} onEdit={handleEdit} onDelete={requestDelete} updateTodo={updateItem as (todo: Todo) => void} />;
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
      {modal && <ModalController modal={modal} setModal={setModal} addItem={addItem} updateItem={updateItem} selectedItem={selectedItem} setSelectedItem={setSelectedItem} lastAccountType={lastAccountType} setLastAccountType={setLastAccountType} />}
      {historyModalItem && <HistoryModal account={historyModalItem} onClose={() => setHistoryModalItem(null)} />}
      {itemForDeleteModal && <ConfirmationModal item={itemForDeleteModal} onConfirm={confirmDelete} onCancel={cancelDelete} />}
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
          <div className="px-4 py-4 border-b border-gray-700">
              <MVaultLogo />
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

const DashboardView: React.FC<{items: VaultItem[], onEdit: (item: VaultItem) => void, onDelete: (id: string) => void, onAiPrioritize: () => void, isAnalyzing: boolean}> = ({items, onEdit, onDelete, onAiPrioritize, isAnalyzing}) => {
    const highPriorityItems = useMemo(() => items.filter(item => item.criticality === 'High').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [items]);
    const recentItems = useMemo(() => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [items]);
    const highCriticalityCount = useMemo(() => items.filter(item => item.criticality === 'High').length, [items]);
    
    const expiringSoonItems = useMemo(() => {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        return items
            .filter((item): item is Account => item.type === 'account' && !!item.expiryDate)
            .filter(account => {
                const expiry = new Date(account.expiryDate!);
                return expiry > now && expiry <= thirtyDaysFromNow;
            })
            .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
    }, [items]);

    const AlertsPanel = () => {
        const alerts = [];

        if (highCriticalityCount > 0) {
            alerts.push(
                <div key="critical" className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center gap-4">
                    <AlertTriangleIcon className="w-8 h-8 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold">Attention Required</h3>
                        <p>You have {highCriticalityCount} high-criticality item{highCriticalityCount > 1 ? 's' : ''} that may require your attention.</p>
                    </div>
                </div>
            );
        }

        if (expiringSoonItems.length > 0) {
            alerts.push(
                <div key="expiring" className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-4 rounded-lg flex items-center gap-4">
                    <CalendarIcon className="w-8 h-8 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold">Expiring Soon</h3>
                        <p>You have {expiringSoonItems.length} account password{expiringSoonItems.length > 1 ? 's' : ''} expiring within 30 days.</p>
                    </div>
                </div>
            );
        }

        if (alerts.length > 0) {
            return <div className="space-y-4">{alerts}</div>;
        }

        return (
            <div className="bg-green-900/50 border border-green-700 text-green-300 p-4 rounded-lg flex items-center gap-4">
                <CheckSquareIcon className="w-8 h-8 flex-shrink-0" />
                <div>
                    <h3 className="font-bold">All Clear</h3>
                    <p>No high-criticality or expiring items found. Keep up the great work!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold">Dashboard</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={onAiPrioritize} disabled={isAnalyzing} className="bg-purple-600 text-white px-4 py-2 rounded-md shadow hover:bg-purple-700 flex items-center gap-2 transition-colors disabled:bg-gray-500">
                        <SparklesIcon className="w-5 h-5"/>
                        {isAnalyzing ? "Prioritizing..." : "Prioritize with AI"}
                    </button>
                </div>
            </div>
            
            <AlertsPanel />

            {expiringSoonItems.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4 text-yellow-300">Expiring Soon</h3>
                    <ItemList items={expiringSoonItems} onEdit={onEdit} onDelete={onDelete} />
                </div>
            )}

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
    )
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
const VaultView: React.FC<{accounts: Account[], onEdit: (item: Account) => void, onDelete: (id: string) => void, onShowHistory: (account: Account) => void}> = ({accounts, onEdit, onDelete, onShowHistory}) => {
    return <div className="space-y-4">
        <h2 className="text-3xl font-bold">Vault</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map(acc => <AccountCard key={acc.id} account={acc} onEdit={() => onEdit(acc)} onDelete={() => onDelete(acc.id)} onShowHistory={() => onShowHistory(acc)} />)}
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
const AccountCard: React.FC<{account: Account, onEdit: () => void, onDelete: () => void, onShowHistory: () => void}> = ({account, onEdit, onDelete, onShowHistory}) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md space-y-3 flex flex-col">
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-white">{account.name}</h3>
                        <p className="text-sm text-gray-400">{account.username}</p>
                    </div>
                    <CriticalityBadge criticality={account.criticality} />
                </div>
                {account.password && <div className="flex items-center gap-2 mt-2">
                    <input type={showPassword ? 'text' : 'password'} value={account.password} readOnly className="border-none bg-gray-700 rounded px-2 py-1 w-full text-sm text-gray-200" />
                    <button onClick={() => setShowPassword(!showPassword)} className="p-1 text-gray-400 hover:text-white">{showPassword ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
                </div>}
                {account.url && <a href={account.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all block mt-2">{account.url}</a>}
                {account.expiryDate && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                        <CalendarIcon className="w-4 h-4" />
                        Expires: {new Date(account.expiryDate).toLocaleDateString()}
                    </p>
                )}
            </div>
             <div className="flex justify-end gap-2 pt-2 border-t border-gray-700 mt-3">
                <button onClick={onShowHistory} className="p-2 text-gray-400 hover:text-green-400" aria-label="View History"><HistoryIcon className="w-5 h-5"/></button>
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-400" aria-label="Edit Item"><EditIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400" aria-label="Delete Item"><TrashIcon className="w-5 h-5"/></button>
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

const ConfirmationModal: React.FC<{item: VaultItem; onConfirm: () => void; onCancel: () => void;}> = ({ item, onConfirm, onCancel }) => {
    const getTitle = (item: VaultItem) => {
        if ('name' in item) return item.name;
        if ('title' in item) return item.title;
        if ('text' in item) return item.text;
        return 'Untitled';
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900">
                       <AlertTriangleIcon className="h-6 w-6 text-red-400" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">Delete Item?</h3>
                    <div className="mt-2 text-sm text-gray-400">
                        <p>Are you sure you want to delete this item?</p>
                        <p className="font-medium text-gray-300 mt-1">"{getTitle(item)}"</p>
                        <p className="mt-1">This action cannot be undone.</p>
                    </div>
                </div>
                <div className="bg-gray-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={onConfirm}
                    >
                        Delete
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-500 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const HistoryModal: React.FC<{ account: Account; onClose: () => void }> = ({ account, onClose }) => {
    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

    const togglePasswordVisibility = (index: number) => {
        setVisiblePasswords(prev => ({ ...prev, [index]: !prev[index] }));
    };

    return (
        <Modal title={`History for ${account.name}`} onClose={onClose}>
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {account.history.length > 0 ? (
                    account.history.map((entry, index) => (
                        <div key={index} className="p-3 bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
                            <p className="font-semibold capitalize">{entry.field} changed</p>
                            {entry.field === 'password' && entry.oldValue ? (
                                <div className="text-sm text-gray-300 mt-1">
                                    <p>Previous value:</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type={visiblePasswords[index] ? 'text' : 'password'}
                                            value={entry.oldValue}
                                            readOnly
                                            className="border-none bg-gray-600 rounded px-2 py-1 w-full text-sm"
                                        />
                                        <button onClick={() => togglePasswordVisibility(index)} className="p-1 text-gray-400 hover:text-white">
                                            {visiblePasswords[index] ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            ) : entry.oldValue && (
                                <p className="text-sm text-gray-300 mt-1">From: "{entry.oldValue}" to "{entry.newValue}"</p>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400">No history available for this account.</p>
                )}
            </div>
        </Modal>
    );
};

interface FormProps<T extends VaultItem> {
    onSave: (item: T) => void;
    onClose: () => void;
    itemToEdit?: T | null;
}

const AccountForm: React.FC<FormProps<Account> & { lastAccountType: AccountType, setLastAccountType: (type: AccountType) => void }> = ({ onSave, onClose, itemToEdit, lastAccountType, setLastAccountType }) => {
    const [name, setName] = useState(itemToEdit?.name || '');
    const [username, setUsername] = useState(itemToEdit?.username || '');
    const [password, setPassword] = useState(itemToEdit?.password || '');
    const [url, setUrl] = useState(itemToEdit?.url || '');
    const [accountType, setAccountType] = useState<AccountType>(itemToEdit?.accountType || lastAccountType);
    const [expiryDate, setExpiryDate] = useState(itemToEdit?.expiryDate ? itemToEdit.expiryDate.split('T')[0] : '');
    const [criticality, setCriticality] = useState<Criticality>(itemToEdit?.criticality || 'Medium');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newHistoryEntry: HistoryEntry | null = itemToEdit && itemToEdit.password !== password
            ? { timestamp: new Date().toISOString(), field: 'password', oldValue: itemToEdit.password, newValue: password! }
            : null;

        const updatedHistory = itemToEdit ? (newHistoryEntry ? [...itemToEdit.history, newHistoryEntry] : itemToEdit.history) : [];

        onSave({
            ...itemToEdit,
            id: itemToEdit?.id || '',
            type: 'account',
            name, username, password, url, accountType, 
            expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
            criticality,
            history: updatedHistory,
            priority: itemToEdit?.priority || 0,
            createdAt: itemToEdit?.createdAt || ''
        } as Account);
        setLastAccountType(accountType);
        onClose();
    };
    
    const handleGeneratePassword = async () => {
        setIsGenerating(true);
        const newPassword = await geminiService.generateStrongPassword();
        setPassword(newPassword);
        setIsGenerating(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Account Name (e.g., Google)" required className="w-full bg-gray-700 p-2 rounded" />
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username or Email" required className="w-full bg-gray-700 p-2 rounded" />
            <div className="flex gap-2">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-gray-700 p-2 rounded" />
                <button type="button" onClick={handleGeneratePassword} disabled={isGenerating} className="bg-purple-600 p-2 rounded hover:bg-purple-700 disabled:bg-gray-500"><SparklesIcon className="w-5 h-5"/></button>
            </div>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="URL (e.g., https://google.com)" className="w-full bg-gray-700 p-2 rounded" />
            <div className="grid grid-cols-2 gap-4">
                <select value={accountType} onChange={e => setAccountType(e.target.value as AccountType)} className="w-full bg-gray-700 p-2 rounded capitalize">
                    {(['website', 'bank', 'email', 'subscription', 'other'] as AccountType[]).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className="w-full bg-gray-700 p-2 rounded">
                    <option>Low</option><option>Medium</option><option>High</option>
                </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Password Expiry Date (Optional)</label>
              <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded mt-1" />
            </div>
            <button type="submit" className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">Save</button>
        </form>
    );
};

const NoteForm: React.FC<FormProps<Note>> = ({ onSave, onClose, itemToEdit }) => {
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [content, setContent] = useState(itemToEdit?.content || '');
    const [criticality, setCriticality] = useState<Criticality>(itemToEdit?.criticality || 'Medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...itemToEdit, id: itemToEdit?.id || '', type: 'note', title, content, criticality, createdAt: itemToEdit?.createdAt || '' } as Note);
        
        // Non-blocking call to check for sensitive data
        geminiService.detectSensitiveData(content).then(result => {
          if(result) {
            setTimeout(() => alert(`AI Security Warning: Your note may contain sensitive data (${result}).`), 500);
          }
        });
        
        onClose();
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note Title" required className="w-full bg-gray-700 p-2 rounded" />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Your note..." rows={5} className="w-full bg-gray-700 p-2 rounded"></textarea>
            <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className="w-full bg-gray-700 p-2 rounded">
                <option>Low</option><option>Medium</option><option>High</option>
            </select>
            <button type="submit" className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">Save</button>
        </form>
    );
};

const EventForm: React.FC<FormProps<Event>> = ({ onSave, onClose, itemToEdit }) => {
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [date, setDate] = useState(itemToEdit?.date ? new Date(itemToEdit.date).toISOString().substring(0, 16) : '');
    const [description, setDescription] = useState(itemToEdit?.description || '');
    const [recurring, setRecurring] = useState<RecurringFrequency>(itemToEdit?.recurring || RecurringFrequency.None);
    const [criticality, setCriticality] = useState<Criticality>(itemToEdit?.criticality || 'Medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...itemToEdit, id: itemToEdit?.id || '', type: 'event', title, date, description, recurring, criticality, createdAt: itemToEdit?.createdAt || '' } as Event);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event Title" required className="w-full bg-gray-700 p-2 rounded" />
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-gray-700 p-2 rounded" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." rows={3} className="w-full bg-gray-700 p-2 rounded"></textarea>
            <div className="grid grid-cols-2 gap-4">
              <select value={recurring} onChange={e => setRecurring(e.target.value as RecurringFrequency)} className="w-full bg-gray-700 p-2 rounded">
                  {Object.values(RecurringFrequency).map(freq => <option key={freq} value={freq} className="capitalize">{freq}</option>)}
              </select>
              <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className="w-full bg-gray-700 p-2 rounded">
                  <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">Save</button>
        </form>
    );
};

const TodoForm: React.FC<FormProps<Todo>> = ({ onSave, onClose, itemToEdit }) => {
    const [text, setText] = useState(itemToEdit?.text || '');
    const [subtasks, setSubtasks] = useState<Subtask[]>(itemToEdit?.subtasks || []);
    const [criticality, setCriticality] = useState<Criticality>(itemToEdit?.criticality || 'Medium');
    const [isOptimizing, setIsOptimizing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...itemToEdit, id: itemToEdit?.id || '', type: 'todo', text, subtasks, criticality, completed: itemToEdit?.completed || false, createdAt: itemToEdit?.createdAt || '' } as Todo);
        onClose();
    };
    
    const handleOptimize = async () => {
        if (!text) return;
        setIsOptimizing(true);
        const newSubtaskTexts = await geminiService.optimizeTodoWithAI(text);
        const newSubtasks = newSubtaskTexts.map(st => ({ id: crypto.randomUUID(), text: st, completed: false}));
        setSubtasks(current => [...current, ...newSubtasks]);
        setIsOptimizing(false);
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
                <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Todo task..." required className="w-full bg-gray-700 p-2 rounded" />
                <button type="button" onClick={handleOptimize} disabled={isOptimizing || !text} title="Break down with AI" className="bg-purple-600 p-2 rounded hover:bg-purple-700 disabled:bg-gray-500"><SparklesIcon className="w-5 h-5"/></button>
            </div>
            <div className="space-y-2">
                {subtasks.map((st, i) => (
                    <div key={st.id} className="flex items-center gap-2">
                        <input type="text" value={st.text} onChange={e => setSubtasks(current => current.map(s => s.id === st.id ? {...s, text: e.target.value} : s))} className="w-full bg-gray-600 p-1 rounded text-sm"/>
                        <button type="button" onClick={() => setSubtasks(current => current.filter(s => s.id !== st.id))} className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ))}
            </div>
            <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className="w-full bg-gray-700 p-2 rounded">
                <option>Low</option><option>Medium</option><option>High</option>
            </select>
            <button type="submit" className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">Save</button>
        </form>
    );
};


const ModalController: React.FC<{
  modal: string | null;
  setModal: (modal: string | null) => void;
  addItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => void;
  updateItem: (item: VaultItem) => void;
  selectedItem: VaultItem | null;
  setSelectedItem: (item: VaultItem | null) => void;
  lastAccountType: AccountType,
  setLastAccountType: (type: AccountType) => void
}> = ({ modal, setModal, addItem, updateItem, selectedItem, setSelectedItem, lastAccountType, setLastAccountType }) => {
  const handleClose = () => {
    setSelectedItem(null);
    setModal(null);
  };
  
  if (!modal) return null;

  const [action, type] = modal.split('-');
  const isEdit = action === 'edit';
  
  const formProps = {
    onClose: handleClose,
    onSave: isEdit ? updateItem : addItem,
    itemToEdit: isEdit ? selectedItem : null
  };

  switch (type) {
    case 'account':
      return <Modal title={isEdit ? 'Edit Account' : 'Add Account'} onClose={handleClose}>
        <AccountForm {...formProps as FormProps<Account>} lastAccountType={lastAccountType} setLastAccountType={setLastAccountType}/>
      </Modal>;
    case 'note':
      return <Modal title={isEdit ? 'Edit Note' : 'Add Note'} onClose={handleClose}>
        <NoteForm {...formProps as FormProps<Note>} />
      </Modal>;
    case 'event':
      return <Modal title={isEdit ? 'Edit Event' : 'Add Event'} onClose={handleClose}>
        <EventForm {...formProps as FormProps<Event>} />
      </Modal>;
    case 'todo':
      return <Modal title={isEdit ? 'Edit Todo' : 'Add Todo'} onClose={handleClose}>
        <TodoForm {...formProps as FormProps<Todo>} />
      </Modal>;
    default:
      return null;
  }
};

export default App;