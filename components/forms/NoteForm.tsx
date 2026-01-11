
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Note, Criticality, NoteCategory, FormProps } from '../../types';

const ChevronDownIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

interface ExtendedNoteFormProps extends FormProps<Note> {
    existingNotes?: Note[];
}

const NoteForm: React.FC<ExtendedNoteFormProps> = ({ onSave, onClose, itemToEdit, existingNotes = [] }) => {
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [content, setContent] = useState(itemToEdit?.content || '');
    const [category, setCategory] = useState<string>(itemToEdit?.category || 'General');
    const [criticality, setCriticality] = useState<Criticality>(itemToEdit?.criticality || 'Medium');
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const suggestions = useMemo(() => {
        const cats = new Set<string>();
        cats.add('General'); 
        existingNotes.forEach(n => {
            if (n.category && n.category.trim()) cats.add(n.category);
        });
        
        return Array.from(cats).sort((a, b) => {
            if (a === 'General') return -1;
            if (b === 'General') return 1;
            return a.localeCompare(b);
        });
    }, [existingNotes]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalCategory = category.trim() || 'General';
        onSave({ 
            ...itemToEdit, 
            id: itemToEdit?.id || '', 
            type: 'note', 
            title, 
            content, 
            category: finalCategory,
            criticality, 
            createdAt: itemToEdit?.createdAt || new Date().toISOString() 
        } as Note);
        onClose();
    };

    const inputClass = "w-full bg-gray-900/60 border border-gray-700/50 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-white font-medium text-sm placeholder-gray-600";
    const labelClass = "text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block";

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-6" autoComplete="off">
            <div>
                <label className={labelClass}>Note Title</label>
                <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Brief summary..." 
                    required 
                    className={inputClass} 
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative" ref={dropdownRef}>
                    <label className={labelClass}>Category</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={category} 
                            onChange={e => {
                                setCategory(e.target.value);
                                setIsDropdownOpen(true);
                            }} 
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholder="General..." 
                            className={`${inputClass} pr-10`}
                        />
                        <button 
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                        >
                            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute z-[60] left-0 right-0 mt-2 bg-[#1e293b] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                {suggestions.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => {
                                            setCategory(s);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-800 last:border-0 ${
                                            category === s 
                                            ? 'bg-blue-600/10 text-blue-400' 
                                            : 'text-gray-300 hover:bg-gray-800'
                                        }`}
                                    >
                                        {s}
                                        {s === 'General' && <span className="ml-2 text-[8px] opacity-40 uppercase tracking-tighter">(System)</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className={labelClass}>Priority</label>
                    <select value={criticality} onChange={e => setCriticality(e.target.value as Criticality)} className={inputClass}>
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                    </select>
                </div>
            </div>

            <div>
                <label className={labelClass}>Content</label>
                <textarea 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    placeholder="Secure details go here..." 
                    rows={8} 
                    className={`${inputClass} resize-none leading-relaxed`}
                ></textarea>
            </div>

            <button type="submit" className="w-full bg-blue-600 p-4 rounded-2xl font-black text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/30 active:scale-95 tracking-wide uppercase">
                Save Secure Note
            </button>
        </form>
    );
};

export default NoteForm;
