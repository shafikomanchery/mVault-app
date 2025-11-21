import Dexie, { Table } from 'dexie';
import { EncryptedData } from '../types';

// We store the entire vault as a single encrypted blob with a fixed ID ('root').
// In a massive enterprise app, we would encrypt rows individually, 
// but for a personal vault, blob encryption offers better security (metadata protection).

export interface VaultRecord extends EncryptedData {
    id: string; // 'root'
}

class MVaultDB extends Dexie {
    vault!: Table<VaultRecord>;

    constructor() {
        super('mVaultDB');
        
        // Define schema
        (this as any).version(1).stores({
            vault: 'id' 
        });
    }
}

export const db = new MVaultDB();