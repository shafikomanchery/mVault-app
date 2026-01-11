
export type View = 'dashboard' | 'vault' | 'notes' | 'events' | 'todos';

export type Criticality = 'High' | 'Medium' | 'Low';

export type RecurringFrequency = 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export const RecurringFrequency = {
    None: 'None',
    Daily: 'Daily',
    Weekly: 'Weekly',
    Monthly: 'Monthly',
    Quarterly: 'Quarterly',
    Yearly: 'Yearly'
} as const;

export type AccountType = 'website' | 'bank' | 'email' | 'subscription' | 'other';
export type NoteCategory = string; // Changed to dynamic string

export interface HistoryEntry {
    timestamp: string;
    field: string;
    oldValue?: string;
    newValue: string;
}

export interface Subtask {
    id: string;
    text: string;
    completed: boolean;
}

export interface EncryptedData {
    salt: string;
    iv: string;
    ciphertext: string;
}

export interface BaseItem {
    id: string;
    type: string;
    createdAt: string;
    criticality: Criticality;
    tags?: string[];
}

export interface Account extends BaseItem {
    type: 'account';
    name: string;
    username: string;
    password?: string;
    url?: string;
    accountType: AccountType;
    expiryDate?: string;
    history: HistoryEntry[];
    priority: number;
}

export interface Note extends BaseItem {
    type: 'note';
    title: string;
    content: string;
    category: NoteCategory;
}

export interface Event extends BaseItem {
    type: 'event';
    title: string;
    date: string;
    description: string;
    recurring: RecurringFrequency;
    completed: boolean;
}

export interface Todo extends BaseItem {
    type: 'todo';
    text: string;
    completed: boolean;
    dueDate?: string;
    subtasks: Subtask[];
}

export type VaultItem = Account | Note | Event | Todo;

export interface FormProps<T> {
    onSave: (item: T) => void;
    onClose: () => void;
    itemToEdit: T | null;
}
