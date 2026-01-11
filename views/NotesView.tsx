
import React, { useState, useMemo } from 'react';
import { Note } from '../types';
import NoteCard from '../components/cards/NoteCard';
import { StickyNoteIcon, ChevronLeftIcon, VaultIcon } from '../components/icons';

const NoteCategoryCard: React.FC<{
    label: string;
    count: number;
    onClick: () => void;
    isDefault?: boolean;
}> = ({ label, count, onClick, isDefault }) => (
    <button 
        onClick={onClick}
        className="bg-gray-800/40 backdrop-blur-sm hover:bg-gray-800/60 border border-gray-700/50 hover:border-blue-500/30 p-4 rounded-3xl transition-all group text-left relative overflow-hidden flex sm:flex-col items-center sm:items-start gap-4 sm:gap-6 shadow-sm"
    >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform translate-x-4 -translate-y-4 hidden sm:block">
            {isDefault ? <VaultIcon className="w-24 h-24" /> : <StickyNoteIcon className="w-24 h-24" />}
        </div>
        <div className={`p-3 rounded-2xl shrink-0 ${count > 0 ? (isDefault ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-500') : 'bg-gray-700/30 text-gray-500'}`}>
            {isDefault ? <VaultIcon className="w-6 h-6" /> : <StickyNoteIcon className="w-6 h-6" />}
        </div>
        <div className="relative z-10 flex-1 min-w-0">
            <h3 className="text-base sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">{label}</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                {count === 1 ? '1 Note' : `${count} Notes`}
            </p>
        </div>
        <div className="sm:hidden text-gray-700 group-hover:text-blue-400 transition-colors shrink-0">
            <ChevronLeftIcon className="w-4 h-4 rotate-180" />
        </div>
    </button>
);

const NotesView: React.FC<{notes: Note[], onEdit: (item: Note) => void, onDelete: (id: string) => void}> = ({notes, onEdit, onDelete}) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = useMemo(() => {
        const groups: Record<string, Note[]> = { 'General': [] };
        notes.forEach(note => {
            const cat = note.category || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(note);
        });
        return groups;
    }, [notes]);

    const sortedCategoryNames = useMemo(() => {
        return Object.keys(categories).sort((a, b) => {
            if (a === 'General') return -1;
            if (b === 'General') return 1;
            return a.localeCompare(b);
        });
    }, [categories]);

    if (notes.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-800/10 border border-dashed border-gray-800 rounded-[40px] max-w-4xl mx-auto">
                <div className="bg-gray-800/40 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-700/30">
                    <StickyNoteIcon className="w-8 h-8 text-gray-700" />
                </div>
                <p className="text-gray-600 font-black text-sm uppercase tracking-widest">No Notes Stored</p>
                <p className="text-gray-700 text-[10px] uppercase tracking-widest mt-2">Tap 'New Note' to secure a thought</p>
            </div>
        );
    }

    if (selectedCategory) {
        const items = categories[selectedCategory] || [];
        const isDefault = selectedCategory === 'General';
        
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-4xl mx-auto">
                <header className="flex flex-col gap-3 px-1">
                    <button 
                        onClick={() => setSelectedCategory(null)}
                        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest group w-fit"
                    >
                        <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Categories
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl shadow-lg ${isDefault ? 'bg-blue-500/10 text-blue-400 shadow-blue-500/5' : 'bg-yellow-500/10 text-yellow-500 shadow-yellow-500/5'}`}>
                                {isDefault ? <VaultIcon className="w-6 h-6" /> : <StickyNoteIcon className="w-6 h-6" />}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{selectedCategory}</h2>
                        </div>
                        <span className="text-[10px] font-black text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700 uppercase tracking-widest">
                            {items.length} Items
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                    {items.map(note => (
                        <NoteCard key={note.id} note={note} onEdit={() => onEdit(note)} onDelete={() => onDelete(note.id)} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 max-w-4xl mx-auto">
            <header className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Secure Notes</h2>
                    <p className="text-gray-500 text-[10px] sm:text-sm font-bold uppercase tracking-widest mt-1">Encrypted Thoughts</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700/50 px-3 py-1.5 rounded-full text-[10px] font-black text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                    <StickyNoteIcon className="w-3.5 h-3.5" />
                    {notes.length} Total
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {sortedCategoryNames.map(name => (
                    <NoteCategoryCard 
                        key={name} 
                        label={name} 
                        count={categories[name].length} 
                        onClick={() => setSelectedCategory(name)} 
                        isDefault={name === 'General'}
                    />
                ))}
            </div>
        </div>
    );
}

export default NotesView;
