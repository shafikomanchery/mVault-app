
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MenuIcon, PlusIcon, AlertTriangleIcon, CheckSquareIcon } from './components/icons';
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
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 Minutes

// --- Utilities ---

// Polyfill for crypto.randomUUID if not available
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const HEADERS = [
    'id', 'type', 'title', 'content', 'username', 'password', 'url', 
    'date', 'recurring', 'accountType', 'expiryDate', 'criticality', 
    'completed', 'subtasks', 'history', 'createdAt'
];

const escapeCsv = (str: string | number | boolean | undefined | null): string => {
    if (str === undefined || str === null) return '';
    const stringValue = String(str);
    // Standard CSV escaping
    if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

// Robust CSV Parser
const parseCSV = (text: string, delimiter: string): string[][] => {
    // Normalize line endings to \n
    const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;
    
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized[i];
        const nextChar = normalized[i + 1];

        if (insideQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentCell += '"';
                    i++; 
                } else {
                    insideQuotes = false;
                }
            } else {
                currentCell += char;
            }
        } else {
            if (char === '"') {
                insideQuotes = true;
            } else if (char === delimiter) {
                currentRow.push(currentCell);
                currentCell = '';
            } else if (char === '\n') {
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
    }
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }
    return rows;
};

interface ImportPreviewData {
    totalRows: number;
    items: VaultItem[];
    counts: { account: number; note: number; event: number; todo: number };
    mappingUsed: Record<string, string>; // Field -> CSV Header Name
}

const App: React.FC = () => {
  // --- Security & Auth State ---
  const [isLocked, setIsLocked] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'setup' | 'migration'>('login');
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [encryptedDataBlob, setEncryptedDataBlob] = useState<EncryptedData | undefined>(undefined);
  const [legacyData, setLegacyData] = useState<VaultItem[] | undefined>(undefined);

  // --- App State ---
  const [view, setView] = useState<View>('dashboard');
  const [items, setItems] = useState<VaultItem[]>([]);
  const [lastAccountType, setLastAccountType] = useLocalStorage<AccountType>('lastAccountType', 'website');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  // --- Import/Export State ---
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);
  
  // --- Idle Timer State ---
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
      idleTimerRef.current = window.setTimeout(() => {
          console.log("Idle timeout reached. Locking vault.");
          handleLock();
      }, IDLE_TIMEOUT_MS);
  }, [isLocked, handleLock]);

  useEffect(() => {
      if (isLocked) return;
      
      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
      const handleActivity = () => resetIdleTimer();

      events.forEach(event => window.addEventListener(event, handleActivity));
      resetIdleTimer(); // Start timer

      return () => {
          events.forEach(event => window.removeEventListener(event, handleActivity));
          if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      };
  }, [isLocked, resetIdleTimer]);


  // --- Init & Migration ---
  useEffect(() => {
    const loadStorage = async () => {
        try {
            // 1. Check IndexedDB First (The Source of Truth)
            const dbRecord = await db.vault.get('root');

            if (dbRecord) {
                setEncryptedDataBlob(dbRecord);
                setAuthMode('login');
                return;
            }

            // 2. Migration: Check LocalStorage for old Encrypted Data
            const lsEncrypted = localStorage.getItem(STORAGE_KEY);
            if (lsEncrypted) {
                const parsed = JSON.parse(lsEncrypted);
                if (parsed.salt && parsed.iv && parsed.ciphertext) {
                    console.log("Migrating from LocalStorage to IndexedDB...");
                    await db.vault.put({ id: 'root', ...parsed });
                    localStorage.removeItem(STORAGE_KEY); // Cleanup
                    setEncryptedDataBlob(parsed);
                    setAuthMode('login');
                    return;
                }
            }

            // 3. Migration: Check Legacy Plaintext Data
            const lsLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (lsLegacy) {
                setLegacyData(JSON.parse(lsLegacy));
                setAuthMode('migration');
                return;
            }

            // 4. Fresh Install
            setAuthMode('setup');

        } catch (e) {
            console.error("Database Init Failed:", e);
            setAuthMode('setup');
        }
    };
    loadStorage();
  }, []);

  // --- Auto-Save (Async to IDB) ---
  useEffect(() => {
    const save = async () => {
        if (!isLocked && vaultKey && encryptedDataBlob && items.length >= 0) {
             try {
                 const newEncryptedData = await saveVault(items, vaultKey, encryptedDataBlob.salt);
                 // Save to IndexedDB
                 await db.vault.put({ id: 'root', ...newEncryptedData });
                 setEncryptedDataBlob(newEncryptedData);
             } catch (e) {
                 console.error("Failed to save vault to IndexedDB", e);
             }
        }
    };
    
    // Debounce save slightly to prevent thrashing IDB on rapid typing
    const timeoutId = setTimeout(() => {
        if (!isLocked) save();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [items, isLocked, vaultKey, encryptedDataBlob?.salt]);

  const handleAuthenticated = async (key: CryptoKey, data: VaultItem[], encryptedBlob: EncryptedData) => {
      setVaultKey(key);
      setItems(data);
      setEncryptedDataBlob(encryptedBlob);
      setIsLocked(false);

      if (authMode === 'migration' || authMode === 'setup') {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          await db.vault.put({ id: 'root', ...encryptedBlob });
      }
  };
  
  const handleResetVault = async () => {
      if (window.confirm("DANGER: This will permanently delete all data in your vault. This action cannot be undone. Are you sure?")) {
          await (db as any).delete(); // Clear Dexie DB
          await (db as any).open(); // Re-open clean
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          window.location.reload();
      }
  };

  // --- Derived State ---
  const accounts = useMemo(() => items.filter((item): item is Account => item.type === 'account'), [items]);
  const notes = useMemo(() => items.filter((item): item is Note => item.type === 'note'), [items]);
  const events = useMemo(() => items.filter((item): item is Event => item.type === 'event'), [items]);
  const todos = useMemo(() => items.filter((item): item is Todo => item.type === 'todo'), [items]);

  const [modal, setModal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<Account | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // --- Timers ---
  useEffect(() => {
    if (isLocked) return;
    const intervalId = setInterval(() => {
      setItems(currentItems => {
        let itemsChanged = false;
        const updatedItems = currentItems.map(item => {
          if (item.type === 'event' && item.recurring !== RecurringFrequency.None) {
            const eventDate = new Date(item.date);
            if (eventDate.getTime() < Date.now()) {
              itemsChanged = true;
              let nextDate = new Date(eventDate);
              if (item.recurring === RecurringFrequency.Monthly) nextDate.setMonth(nextDate.getMonth() + 1);
              else if (item.recurring === RecurringFrequency.Quarterly) nextDate.setMonth(nextDate.getMonth() + 3);
              else if (item.recurring === RecurringFrequency.Yearly) nextDate.setFullYear(nextDate.getFullYear() + 1);
              return { ...item, date: nextDate.toISOString() };
            }
          }
          return item;
        });
        return itemsChanged ? updatedItems : currentItems;
      });
    }, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [isLocked]);

  const addItem = useCallback((item: Omit<VaultItem, 'id' | 'createdAt'>) => {
    const newItem: VaultItem = { ...item, id: generateUUID(), createdAt: new Date().toISOString() } as VaultItem;
    setItems(prevItems => [...prevItems, newItem]);
  }, []);
  
  const updateItem = useCallback((updatedItem: VaultItem) => {
    setItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));
  }, []);
  
  const requestDelete = useCallback((id: string) => setItemToDeleteId(id), []);
  const confirmDelete = useCallback(() => {
    if (itemToDeleteId) {
      setItems(prevItems => prevItems.filter(item => item.id !== itemToDeleteId));
      setItemToDeleteId(null);
    }
  }, [itemToDeleteId]);

  const cancelDelete = useCallback(() => {
    setItemToDeleteId(null);
  }, []);

  const itemForDeleteModal = useMemo(() => itemToDeleteId ? items.find(item => item.id === itemToDeleteId) : null, [itemToDeleteId, items]);

  const handleEdit = (item: VaultItem) => {
    setSelectedItem(item);
    setModal(`edit-${item.type}`);
  }

  // --- CSV Import/Export ---

  const handleExport = () => {
    const csvRows = [HEADERS.join(',')];
    for (const item of items) {
        const row = [
            escapeCsv(item.id),
            escapeCsv(item.type),
            escapeCsv(item.type === 'account' ? (item as Account).name : item.type === 'todo' ? (item as Todo).text : (item as any).title),
            escapeCsv(item.type === 'note' ? (item as Note).content : item.type === 'event' ? (item as Event).description : ''),
            escapeCsv((item as Account).username),
            escapeCsv((item as Account).password),
            escapeCsv((item as Account).url),
            escapeCsv((item as Event).date),
            escapeCsv((item as Event).recurring),
            escapeCsv((item as Account).accountType),
            escapeCsv((item as Account).expiryDate),
            escapeCsv(item.criticality),
            escapeCsv((item as Todo).completed),
            escapeCsv(JSON.stringify((item as Todo).subtasks || [])),
            escapeCsv(JSON.stringify((item as Account).history || [])),
            escapeCsv(item.createdAt),
        ];
        csvRows.push(row.join(','));
    }
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvRows.join('\n'));
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `mvault_export_${new Date().toISOString().split('T')[0]}.csv`);
    linkElement.click();
  }

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    if (importInputRef.current) {
        importInputRef.current.value = ''; 
        importInputRef.current.click();
    }
  };

  const onImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImportError(null);
    setImportPreview(null);
    
    if (file) {
      const reader = new FileReader();
      
      reader.onerror = () => {
          setImportError("Failed to read the file. Please try again.");
      };

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (!content) throw new Error("File is empty");

          // --- 1. Configuration ---
          const ALIASES: Record<string, string[]> = {
              type: ['type', 'itemtype', 'category', 'kind', 'grouping', 'folder'],
              title: ['title', 'name', 'account', 'service', 'subject', 'task', 'summary', 'item', 'servicename', 'websitename', 'login_name', 'caption', 'headline'],
              username: ['username', 'user', 'login', 'email', 'userid', 'loginusername', 'signin', 'credential', 'login_username', 'email_address', 'user_email'],
              password: ['password', 'pass', 'key', 'secret', 'auth', 'loginpassword', 'login_password', 'passphrase'],
              url: ['url', 'website', 'link', 'site', 'address', 'host', 'loginurl', 'login_uri', 'login_url', 'web_address'],
              content: ['content', 'notes', 'description', 'desc', 'details', 'body', 'memo', 'comments', 'note', 'extra'],
              date: ['date', 'time', 'eventdate', 'due', 'duedate', 'startdate', 'deadline'],
              history: ['history', 'historyjson'],
              subtasks: ['subtasks', 'subtasksjson']
          };
          
          const normalize = (s: string) => s.trim().replace(/[^a-z0-9]/gi, '').toLowerCase();

          // --- 2. Sniff Delimiter & Parse ---
          const delimiters = [',', ';', '\t', '|'];
          let bestParse: { rows: string[][], delimiter: string, rawHeaders: string[] } | null = null;

          // We will score each delimiter based on how many known columns it finds
          let bestScore = -1;

          for (const delimiter of delimiters) {
               const rows = parseCSV(content, delimiter);
               // Filter empty rows
               const validRows = rows.filter(r => r.length > 0 && r.some(c => c.trim().length > 0));
               
               if (validRows.length < 1) continue;

               // Check first 10 rows for header candidates
               for (let i = 0; i < Math.min(10, validRows.length); i++) {
                   const row = validRows[i];
                   const normRow = row.map(normalize);
                   
                   // Count how many cells match a known alias
                   let rowScore = 0;
                   const knownAliases = new Set(Object.values(ALIASES).flat().map(normalize));
                   
                   normRow.forEach(cell => {
                       if (knownAliases.has(cell)) rowScore += 10; // Exact match
                       else if (knownAliases.has(cell.replace(/_/g, ''))) rowScore += 8; // normalized match
                       else if (Array.from(knownAliases).some(a => cell.includes(a))) rowScore += 2; // partial
                   });

                   // Favor rows with "password" or "username"
                   if (normRow.some(c => c.includes('password'))) rowScore += 20;
                   if (normRow.some(c => c.includes('user') || c.includes('email'))) rowScore += 10;

                   if (rowScore > bestScore && rowScore > 5) {
                       bestScore = rowScore;
                       bestParse = { rows: validRows.slice(i + 1), delimiter, rawHeaders: row };
                   }
               }
          }

          if (!bestParse) {
              throw new Error("Could not detect CSV structure. Please ensure the file has headers like 'Title', 'Username', or 'Password'.");
          }

          const { rows, rawHeaders } = bestParse;
          
          // --- 3. Column Mapping (Scoring System) ---
          const headerMap = new Map<string, number>(); // FieldKey -> ColumnIndex
          const mappingDisplay: Record<string, string> = {}; // For UI Preview
          
          Object.keys(ALIASES).forEach(fieldKey => {
              let bestColIdx = -1;
              let maxColScore = 0;

              rawHeaders.forEach((header, idx) => {
                  const normHeader = normalize(header);
                  let score = 0;
                  
                  // Scoring Logic
                  const fieldAliases = ALIASES[fieldKey].map(normalize);
                  
                  // 1. Exact Match (Highest Priority)
                  if (fieldAliases.includes(normHeader)) score = 100;
                  
                  // 2. Alias contains Header (e.g. alias "username", header "user")
                  else if (fieldAliases.some(a => a.includes(normHeader) && normHeader.length > 2)) score = 60;
                  
                  // 3. Header contains Alias (e.g. header "login_password", alias "password")
                  else if (fieldAliases.some(a => normHeader.includes(a) && a.length > 3)) score = 80;
                  
                  if (score > maxColScore) {
                      maxColScore = score;
                      bestColIdx = idx;
                  }
              });

              if (maxColScore > 0) {
                  headerMap.set(fieldKey, bestColIdx);
                  mappingDisplay[fieldKey] = rawHeaders[bestColIdx];
              }
          });

          // --- 4. Extract Items ---
          const newItems: VaultItem[] = [];
          const counts = { account: 0, note: 0, event: 0, todo: 0 };
          
          const safeJson = (str: string) => { try { return JSON.parse(str); } catch { return []; } };
          const getVal = (row: string[], key: string) => {
              const idx = headerMap.get(key);
              return (idx !== undefined && idx < row.length) ? row[idx].trim() : '';
          };

          for (const row of rows) {
              if (!row || row.length === 0 || row.every(c => !c.trim())) continue;

              let typeRaw = getVal(row, 'type').toLowerCase();
              const title = getVal(row, 'title') || 'Untitled Item';
              const content = getVal(row, 'content');
              const username = getVal(row, 'username');
              const password = getVal(row, 'password');
              const url = getVal(row, 'url');
              const dateStr = getVal(row, 'date');

              // Inference
              if (!typeRaw) {
                  if (password || username || (url && !content)) typeRaw = 'account';
                  else if (dateStr) typeRaw = 'event';
                  else if (content.length > 50 || (!url && !username && !password)) typeRaw = 'note';
                  else typeRaw = 'account';
              }

              const baseItem = {
                  id: generateUUID(),
                  createdAt: new Date().toISOString(),
                  criticality: 'Medium' as const
              };

              if (typeRaw.includes('account') || typeRaw.includes('login') || typeRaw.includes('pass')) {
                  newItems.push({
                      ...baseItem,
                      type: 'account',
                      name: title,
                      username,
                      password,
                      url,
                      accountType: 'other',
                      history: safeJson(getVal(row, 'history')),
                      priority: 0
                  } as Account);
                  counts.account++;
              } else if (typeRaw.includes('event') || typeRaw.includes('date')) {
                   newItems.push({
                      ...baseItem,
                      type: 'event',
                      title: title,
                      date: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
                      description: content,
                      recurring: RecurringFrequency.None
                   } as Event);
                   counts.event++;
              } else if (typeRaw.includes('todo') || typeRaw.includes('task')) {
                  newItems.push({
                      ...baseItem,
                      type: 'todo',
                      text: title,
                      completed: false,
                      subtasks: safeJson(getVal(row, 'subtasks'))
                  } as Todo);
                  counts.todo++;
              } else {
                  newItems.push({
                      ...baseItem,
                      type: 'note',
                      title: title,
                      content: content || [username, url, password].filter(Boolean).join('\n')
                  } as Note);
                  counts.note++;
              }
          }

          if (newItems.length === 0) {
              throw new Error(`Parsed ${rows.length} rows but found no valid items.\nDetected Headers: ${rawHeaders.join(', ')}`);
          }

          // --- 5. Show Preview ---
          setImportPreview({
              totalRows: rows.length,
              items: newItems,
              counts,
              mappingUsed: mappingDisplay
          });

        } catch (error: any) {
          console.error("Import error:", error);
          setImportError(error.message || "Unknown import error");
        }
      };
      reader.readAsText(file);
    }
  }

  const confirmImport = () => {
      if (importPreview) {
          setItems(importPreview.items);
          setImportPreview(null);
          setSidebarOpen(false);
      }
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView items={items} onEdit={handleEdit} onDelete={requestDelete} />;
      case 'vault': return <VaultView accounts={accounts} onEdit={handleEdit} onDelete={requestDelete} onShowHistory={setHistoryModalItem}/>;
      case 'notes': return <NotesView notes={notes} onEdit={handleEdit} onDelete={requestDelete} />;
      case 'events': return <EventsView events={events} onEdit={handleEdit} onDelete={requestDelete} />;
      case 'todos': return <TodosView todos={todos} onEdit={handleEdit} onDelete={requestDelete} updateTodo={updateItem as (todo: Todo) => void} />;
      default: return <div>Select a view</div>;
    }
  };

  if (isLocked) {
      return <AuthScreen 
                mode={authMode} 
                encryptedData={encryptedDataBlob} 
                legacyData={legacyData} 
                onAuthenticated={handleAuthenticated}
                onReset={handleResetVault}
             />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar 
        view={view} 
        setView={setView} 
        isOpen={isSidebarOpen} 
        setOpen={setSidebarOpen} 
        onImport={handleImport} 
        onExport={handleExport}
        onLock={handleLock}
        onShowAbout={() => setShowAbout(true)}
        onShowPrivacy={() => setShowPrivacy(true)}
      />
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
      <input type="file" accept=".csv" ref={importInputRef} onChange={onImportFileChange} className="hidden" />
      
      <ModalController 
        modal={modal} 
        setModal={setModal} 
        addItem={addItem} 
        updateItem={updateItem} 
        selectedItem={selectedItem} 
        setSelectedItem={setSelectedItem} 
        lastAccountType={lastAccountType} 
        setLastAccountType={setLastAccountType} 
      />
      
      {historyModalItem && <HistoryModal account={historyModalItem} onClose={() => setHistoryModalItem(null)} />}
      {itemForDeleteModal && <ConfirmationModal item={itemForDeleteModal} onConfirm={confirmDelete} onCancel={cancelDelete} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

      {/* Import Error Modal */}
      {importError && (
          <Modal title="Import Failed" onClose={() => setImportError(null)}>
              <div className="space-y-4">
                  <div className="flex items-start gap-3 text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-900/50">
                      <AlertTriangleIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                      <div className="text-sm overflow-y-auto max-h-60">
                          <p className="font-bold mb-1">Error Details:</p>
                          <p className="font-mono whitespace-pre-wrap">{importError}</p>
                      </div>
                  </div>
                  <div className="flex justify-end">
                      <button onClick={() => setImportError(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white">Close</button>
                  </div>
              </div>
          </Modal>
      )}

      {/* Import Preview Modal */}
      {importPreview && (
          <Modal title="Confirm Import" onClose={() => setImportPreview(null)}>
              <div className="space-y-6">
                  <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg">
                      <h4 className="font-bold text-blue-300 mb-2">Found {importPreview.totalRows} items</h4>
                      <ul className="grid grid-cols-2 gap-2 text-sm text-blue-200">
                          <li>Accounts: {importPreview.counts.account}</li>
                          <li>Notes: {importPreview.counts.note}</li>
                          <li>Events: {importPreview.counts.event}</li>
                          <li>Todos: {importPreview.counts.todo}</li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Column Mapping</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(importPreview.mappingUsed).map(([field, header]) => (
                              <div key={field} className="flex justify-between bg-gray-700 p-2 rounded">
                                  <span className="capitalize text-gray-400">{field}:</span>
                                  <span className="font-mono text-white truncate ml-2" title={header}>{header}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="p-4 bg-yellow-900/20 border border-yellow-900/50 rounded text-yellow-200 text-sm flex items-start gap-3">
                      <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
                      <p>Proceeding will <strong>OVERWRITE</strong> your current vault data. This cannot be undone.</p>
                  </div>

                  <div className="flex justify-end gap-3">
                      <button onClick={() => setImportPreview(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white">Cancel</button>
                      <button onClick={confirmImport} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium flex items-center gap-2">
                          <CheckSquareIcon className="w-4 h-4" /> Import Data
                      </button>
                  </div>
              </div>
          </Modal>
      )}
    </div>
  );
};

export default App;
