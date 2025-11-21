
export type View = 'dashboard' | 'vault' | 'notes' | 'events' | 'todos';

export type Criticality = 'High' | 'Medium' | 'Low';

export type AccountType = 'bank' | 'email' | 'website' | 'subscription' | 'other';

export interface HistoryEntry {
  timestamp: string;
  field: string;
  oldValue?: string;
  newValue: string;
}

export interface Account {
  id: string;
  type: 'account';
  accountType: AccountType;
  name: string;
  username: string;
  password?: string;
  url?: string;
  expiryDate?: string;
  history: HistoryEntry[];
  priority: number;
  criticality: Criticality;
  createdAt: string;
}

export interface Note {
  id: string;
  type: 'note';
  title: string;
  content: string;
  createdAt: string;
  criticality: Criticality;
}

export enum RecurringFrequency {
  None = 'none',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Yearly = 'yearly',
}

export interface Event {
  id: string;
  type: 'event';
  title: string;
  date: string;
  description: string;
  recurring: RecurringFrequency;
  criticality: Criticality;
  createdAt: string;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Todo {
    id: string;
    type: 'todo';
    text: string;
    completed: boolean;
    subtasks: Subtask[];
    createdAt: string;
    criticality: Criticality;
}


export type VaultItem = Account | Note | Event | Todo;

export interface FormProps<T extends VaultItem> {
    onSave: (item: T) => void;
    onClose: () => void;
    itemToEdit?: T | null;
}

export interface EncryptedData {
    salt: string;
    iv: string;
    ciphertext: string;
}
