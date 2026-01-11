
import React from 'react';
import { VaultItem, Account, Note, Event, Todo, AccountType, FormProps } from '../types';
import { Modal } from './Shared';
import AccountForm from './forms/AccountForm';
import NoteForm from './forms/NoteForm';
import EventForm from './forms/EventForm';
import TodoForm from './forms/TodoForm';

interface ModalControllerProps {
  modal: string | null;
  setModal: (modal: string | null) => void;
  addItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => void;
  updateItem: (item: VaultItem) => void;
  selectedItem: VaultItem | null;
  setSelectedItem: (item: VaultItem | null) => void;
  lastAccountType: AccountType,
  setLastAccountType: (type: AccountType) => void;
  items: VaultItem[]; // Added to provide suggestions
}

const ModalController: React.FC<ModalControllerProps> = ({ modal, setModal, addItem, updateItem, selectedItem, setSelectedItem, lastAccountType, setLastAccountType, items }) => {
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
      const existingNotes = items.filter((i): i is Note => i.type === 'note');
      return <Modal title={isEdit ? 'Edit Note' : 'Add Note'} onClose={handleClose}>
        <NoteForm {...formProps as FormProps<Note>} existingNotes={existingNotes} />
      </Modal>;
    case 'event':
      return <Modal title={isEdit ? 'Edit Event' : 'Add Event'} onClose={handleClose}>
        <EventForm {...formProps as FormProps<Event>} />
      </Modal>;
    case 'todo':
      return <Modal title={isEdit ? 'Edit Task' : 'Add Task'} onClose={handleClose}>
        <TodoForm {...formProps as FormProps<Todo>} />
      </Modal>;
    default:
      return null;
  }
};

export default ModalController;
