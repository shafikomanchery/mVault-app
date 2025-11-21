// AI services have been removed in favor of local utilities.
// See utils/security.ts for password generation.

export const generateStrongPassword = async (): Promise<string> => {
    throw new Error("AI Service Removed");
};

export const detectSensitiveData = async (content: string): Promise<string | null> => {
    return null;
};

export const prioritizeAccountsWithAI = async (accounts: any[]): Promise<string[]> => {
    return accounts.map(a => a.id);
};

export const optimizeTodoWithAI = async (task: string): Promise<string[]> => {
    return [];
};
