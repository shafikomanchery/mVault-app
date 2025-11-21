
import { EncryptedData } from '../types';

// --- Password Generator ---
export const generateStrongPassword = (length: number = 16): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  const array = new Uint32Array(length);
  
  if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
  } else {
      for(let i=0; i<length; i++) {
          array[i] = Math.floor(Math.random() * charset.length);
      }
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  return password;
};

// --- Crypto Utilities for Vault Security ---

const buff_to_base64 = (buff: BufferSource): string => {
    let binary = '';
    let bytes: Uint8Array;

    if (ArrayBuffer.isView(buff)) {
        // Create a copy to ensure we have the correct slice of data
        bytes = new Uint8Array(buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength));
    } else {
        bytes = new Uint8Array(buff);
    }

    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

const base64_to_buff = (b64: string): Uint8Array => {
    const binary_string = window.atob(b64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
};

// Derive a key from password and salt using PBKDF2
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", 
        enc.encode(password), 
        { name: "PBKDF2" }, 
        false, 
        ["deriveBits", "deriveKey"]
    );
    
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
};

// Encrypt data
const encryptDataInternal = async (data: any, key: CryptoKey): Promise<{iv: string, ciphertext: string}> => {
    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(data));
    // 12 bytes IV is standard for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
    
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encodedData
    );
    
    return {
        iv: buff_to_base64(iv),
        ciphertext: buff_to_base64(ciphertext)
    };
};

// Decrypt data
const decryptDataInternal = async (encryptedData: EncryptedData, key: CryptoKey): Promise<any> => {
    try {
        const iv = base64_to_buff(encryptedData.iv);
        const ciphertext = base64_to_buff(encryptedData.ciphertext);
        
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            ciphertext
        );
        
        const dec = new TextDecoder();
        return JSON.parse(dec.decode(decrypted));
    } catch (e) {
        // This error usually means: Wrong Password, Corrupt Data, or Tampered Data
        throw new Error("Decryption failed");
    }
};

// --- Public API ---

export const createVault = async (password: string, initialData: any[]): Promise<{key: CryptoKey, encrypted: EncryptedData}> => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);
    const { iv, ciphertext } = await encryptDataInternal(initialData, key);
    
    return { 
        key, 
        encrypted: { salt: buff_to_base64(salt), iv, ciphertext } 
    };
};

export const unlockVault = async (password: string, encryptedData: EncryptedData): Promise<{key: CryptoKey, data: any[]}> => {
    const salt = base64_to_buff(encryptedData.salt);
    const key = await deriveKey(password, salt);
    const data = await decryptDataInternal(encryptedData, key);
    return { key, data };
};

export const saveVault = async (data: any[], key: CryptoKey, existingSalt: string): Promise<EncryptedData> => {
    const { iv, ciphertext } = await encryptDataInternal(data, key);
    return { salt: existingSalt, iv, ciphertext };
};
