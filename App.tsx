
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MenuIcon, PlusIcon, AlertTriangleIcon, CheckSquareIcon, SearchIcon } from './components/icons';
import useLocalStorage from './hooks/useLocalStorage';
import {
  View, VaultItem, Account, Note, Event, Todo,
  RecurringFrequency, AccountType, EncryptedData
} from './types';
import { saveVault } from './utils/security';
import { db } from './services/db';

// Components
import Sidebar from './components/Sidebar';
import ModalController from './components/ModalController';
import HistoryModal from './components/HistoryModal';
import { ConfirmationModal, Modal } from './components/Shared';
import AuthScreen from './components/AuthScreen';
import { AboutModal, PrivacyModal } from './components/InfoModals';

// Views
import DashboardView from './views/DashboardView';
import VaultView from './views/VaultView';
import NotesView from './views/NotesView';
import EventsView from './views/EventsView';
import TodosView from './views/TodosView';

const STORAGE_KEY = 'mvault_db';
const LEGACY_STORAGE_KEY = 'vaultItems';
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'setup' | 'migration'>('login');
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [encryptedDataBlob, setEncryptedDataBlob] = useState<EncryptedData | undefined>(undefined);
  const [legacyData, setLegacyData] = useState<VaultItem[] | undefined>(undefined);

  const [view, setView] = useState<View>('dashboard');
  const [items, setItems] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastAccountType, setLastAccountType] = useLocalStorage<AccountType>('lastAccountType', 'website');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  const [importError, setImportError] = useState<string | null>(null);
  const [exportType, setExportType] = useState<'JSON' | 'CSV' | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const handleLock = useCallback(() => {
      setVaultKey(null);
      setItems([]);
      setIsLocked(true);
      setAuthMode('login');
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
  }, []);

  const resetIdleTimer = useCallback(() => {
      if (isLocked) return;
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => handleLock(), IDLE_TIMEOUT_MS);
  }, [isLocked, handleLock]);

  useEffect(() => {
      if (isLocked) return;
      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
      const handleActivity = () => resetIdleTimer();
      events.forEach(event => window.addEventListener(event, handleActivity));
      resetIdleTimer();
      return () => {
          events.forEach(event => window.removeEventListener(event, handleActivity));
          if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      };
  }, [isLocked, resetIdleTimer]);

  useEffect(() => {
    const loadStorage = async () => {
        try {
            const dbRecord = await db.vault.get('root');
            if (dbRecord) {
                setEncryptedDataBlob(dbRecord);
                setAuthMode('login');
                return;
            }
            const lsLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (lsLegacy) {
                setLegacyData(JSON.parse(lsLegacy));
                setAuthMode('migration');
                return;
            }
            setAuthMode('setup');
        } catch (e) {
            setAuthMode('setup');
        }
    };
    loadStorage();
  }, []);

  useEffect(() => {
    const save = async () => {
        if (!isLocked && vaultKey && encryptedDataBlob && items.length >= 0) {
             try {
                 const newEncryptedData = await saveVault(items, vaultKey, encryptedDataBlob.salt);
                 await db.vault.put({ id: 'root', ...newEncryptedData });
                 setEncryptedDataBlob(newEncryptedData);
             } catch (e) {
                 console.error("Failed to save vault", e);
             }
        }
    };
    const timeoutId = setTimeout(() => { if (!isLocked) save(); }, 500);
    return () => clearTimeout(timeoutId);
  }, [items, isLocked, vaultKey, encryptedDataBlob?.salt]);

  const handleAuthenticated = async (key: CryptoKey, data: VaultItem[], encryptedBlob: EncryptedData) => {
      setVaultKey(key);
      setItems(data);
      setEncryptedDataBlob(encryptedBlob);
      setIsLocked(false);
  };

  const handleExportJSON = () => {
      const dataStr = JSON.stringify(items, null, 2);
      downloadFile(dataStr, 'json');
      setExportType(null);
  };

  const handleExportCSV = () => {
      const accounts = items.filter((i): i is Account => i.type === 'account');
      if (accounts.length === 0) {
          alert("No accounts found to export to CSV.");
          setExportType(null);
          return;
      }

      // CSV Header
      let csvContent = "name,url,username,password,accountType,criticality,tags\n";

      // Helper to escape CSV values
      const escape = (val: string | undefined) => {
          if (!val) return '""';
          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
      };

      accounts.forEach(acc => {
          const row = [
              escape(acc.name),
              escape(acc.url),
              escape(acc.username),
              escape(acc.password),
              escape(acc.accountType),
              escape(acc.criticality),
              escape(acc.tags?.join(';'))
          ].join(',');
          csvContent += row + "\n";
      });

      downloadFile(csvContent, 'csv');
      setExportType(null);
  };

  const downloadFile = (content: string, extension: string) => {
      const type = extension === 'json' ? 'application/json' : 'text/csv';
      const dataBlob = new Blob([content], { type });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = url;
      link.download = `mvault-export-${timestamp}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const fileContent = event.target?.result as string;
              let importedItems: VaultItem[] = [];

              if (file.name.endsWith('.json')) {
                  importedItems = JSON.parse(fileContent);
              } else if (file.name.endsWith('.csv')) {
                  // Basic CSV parser for interoperability
                  const lines = fileContent.split('\n');
                  const headers = lines[0].split(',');
                  importedItems = lines.slice(1).filter(l => l.trim()).map(line => {
                      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                      const clean = (v: string) => v.replace(/^"|"$/g, '').replace(/""/g, '"');
                      return {
                          id: generateUUID(),
                          type: 'account',
                          name: clean(values[0] || 'Imported Account'),
                          url: clean(values[1] || ''),
                          username: clean(values[2] || ''),
                          password: clean(values[3] || ''),
                          accountType: (clean(values[4] || 'other') as AccountType),
                          criticality: (clean(values[5] || 'Medium') as any),
                          tags: values[6] ? clean(values[6]).split(';') : [],
                          createdAt: new Date().toISOString(),
                          history: [],
                          priority: 0
                      } as Account;
                  });
              }

              if (!Array.isArray(importedItems) || importedItems.length === 0) {
                  throw new Error("Invalid or empty backup file.");
              }

              setItems(prev => {
                  const existingIds = new Set(prev.map(i => i.id));
                  const newItems = importedItems.filter(i => !existingIds.has(i.id));
                  return [...prev, ...newItems];
              });
              
              alert(`Successfully imported ${importedItems.length} items!`);
          } catch (err) {
              setImportError(err instanceof Error ? err.message : "Failed to parse import file.");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const filteredItems = useMemo(() => {
      if (!searchQuery.trim()) return items;
      const query = searchQuery.toLowerCase();
      return items.filter(item => {
          const title = ('name' in item ? item.name : 'title' in item ? item.title : 'text' in item ? item.text : '').toLowerCase();
          const username = ('username' in item ? item.username : '').toLowerCase();
          const tags = (item.tags || []).join(' ').toLowerCase();
          return title.includes(query) || username.includes(query) || tags.includes(query);
      });
  }, [items, searchQuery]);

  const accounts = useMemo(() => filteredItems.filter((item): item is Account => item.type === 'account'), [filteredItems]);
  const notes = useMemo(() => filteredItems.filter((item): item is Note => item.type === 'note'), [filteredItems]);
  const events = useMemo(() => filteredItems.filter((item): item is Event => item.type === 'event'), [filteredItems]);
  const todos = useMemo(() => filteredItems.filter((item): item is Todo => item.type === 'todo'), [filteredItems]);

  const [modal, setModal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<Account | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const addItem = useCallback((item: Omit<VaultItem, 'id' | 'createdAt'>) => {
    const newItem: VaultItem = { ...item, id: generateUUID(), createdAt: new Date().toISOString() } as VaultItem;
    setItems(prevItems => [...prevItems, newItem]);
  }, []);
  
  const updateItem = useCallback((updatedItem: VaultItem) => {
    setItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));
  }, []);
  
  const requestDelete = useCallback((id: string) => setItemToDeleteId(id), []);

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView items={filteredItems} onEdit={(i) => {setSelectedItem(i); setModal(`edit-${i.type}`);}} onDelete={requestDelete} />;
      case 'vault': return <VaultView accounts={accounts} onEdit={(i) => {setSelectedItem(i); setModal('edit-account');}} onDelete={requestDelete} onShowHistory={setHistoryModalItem}/>;
      case 'notes': return <NotesView notes={notes} onEdit={(i) => {setSelectedItem(i); setModal('edit-note');}} onDelete={requestDelete} />;
      case 'events': return <EventsView events={events} onEdit={(i) => {setSelectedItem(i); setModal('edit-event');}} onDelete={requestDelete} />;
      case 'todos': return <TodosView todos={todos} onEdit={(i) => {setSelectedItem(i); setModal('edit-todo');}} onDelete={requestDelete} updateTodo={updateItem as any} />;
      default: return null;
    }
  };

  if (isLocked) {
      return <AuthScreen mode={authMode} encryptedData={encryptedDataBlob} legacyData={legacyData} onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar 
        view={view} 
        setView={setView} 
        isOpen={isSidebarOpen} 
        setOpen={setSidebarOpen} 
        onImport={() => document.getElementById('import-input')?.click()} 
        onExport={() => setExportType('JSON')} // Defaulting to trigger warning
        onLock={handleLock} 
        onShowAbout={() => setShowAbout(true)} 
        onShowPrivacy={() => setShowPrivacy(true)} 
      />
      <input 
        id="import-input" 
        type="file" 
        accept=".json,.csv" 
        className="hidden" 
        onChange={handleImport}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gray-800 border-b border-gray-700 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center w-full sm:w-auto">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden mr-4 p-2 hover:bg-gray-700 rounded"><MenuIcon /></button>
            <h1 className="text-xl font-bold capitalize mr-8 hidden lg:block">{view}</h1>
            
            <div className="relative flex-1 sm:min-w-[300px] group">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${items.length} items...`}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                />
            </div>
          </div>
          
          {view !== 'dashboard' && (
            <button 
              onClick={() => setModal(`add-${view === 'vault' ? 'account' : view.slice(0, -1)}`)} 
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="text-sm font-bold">New {view === 'vault' ? 'Account' : view.slice(0, -1)}</span>
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0f172a]">
          {renderView()}
        </div>
      </main>

      <ModalController modal={modal} setModal={setModal} addItem={addItem} updateItem={updateItem} selectedItem={selectedItem} setSelectedItem={setSelectedItem} lastAccountType={lastAccountType} setLastAccountType={setLastAccountType} />
      
      {historyModalItem && <HistoryModal account={historyModalItem} onClose={() => setHistoryModalItem(null)} />}
      
      {itemToDeleteId && <ConfirmationModal item={items.find(i => i.id === itemToDeleteId)!} onConfirm={() => {setItems(items.filter(i => i.id !== itemToDeleteId)); setItemToDeleteId(null);}} onCancel={() => setItemToDeleteId(null)} />}
      
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      
      {exportType && (
          <Modal title="Secure Export" onClose={() => setExportType(null)}>
              <div className="space-y-4">
                  <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 text-yellow-300 text-sm rounded-xl">
                      <strong>Security Risk:</strong> Exported files are unencrypted. Please delete them after use.
                  </div>
                  
                  <div className="space-y-2">
                      <button 
                          onClick={handleExportJSON} 
                          className="w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-left flex justify-between items-center group transition-all"
                      >
                          <div>
                              <p className="font-bold text-white">Full Vault (JSON)</p>
                              <p className="text-xs text-gray-400">Recommended for backup. Includes Notes & Todos.</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                              &rarr;
                          </div>
                      </button>

                      <button 
                          onClick={handleExportCSV} 
                          className="w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-left flex justify-between items-center group transition-all"
                      >
                          <div>
                              <p className="font-bold text-white">Passwords Only (CSV)</p>
                              <p className="text-xs text-gray-400">Optimal for Excel or other password managers.</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-green-600 transition-colors">
                              &rarr;
                          </div>
                      </button>
                  </div>

                  <button onClick={() => setExportType(null)} className="w-full py-3 text-gray-500 font-bold hover:text-white transition-colors">Cancel</button>
              </div>
          </Modal>
      )}

      {importError && (
          <Modal title="Import Failed" onClose={() => setImportError(null)}>
              <div className="space-y-4">
                  <div className="p-3 bg-red-900/20 border border-red-700/30 text-red-300 text-sm rounded-xl">
                      {importError}
                  </div>
                  <button onClick={() => setImportError(null)} className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold">Close</button>
              </div>
          </Modal>
      )}
    </div>
  );
};

export default App;
