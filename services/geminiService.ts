// This is the proxy function that all other functions will use.
const callProxy = async (service: string, args: any[] = []) => {
    const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, args }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Proxy call failed for ${service}: ${response.statusText} - ${errorText}`);
    }
    return response.json();
}

export const generateStrongPassword = async (): Promise<string> => {
  try {
    return await callProxy("generateStrongPassword");
  } catch (error) {
    console.error("Error generating password:", error);
    return "Error!CouldNotGenerate1";
  }
};

export const detectSensitiveData = async (content: string): Promise<string | null> => {
    try {
        const result = await callProxy("detectSensitiveData", [content]);
        return result.toLowerCase() === 'none' ? null : result;
    } catch (error) {
        console.error("Error detecting sensitive data:", error);
        return null;
    }
};

export const prioritizeAccountsWithAI = async (accounts: any[]): Promise<string[]> => {
    try {
        return await callProxy("prioritizeAccountsWithAI", [accounts]);
    } catch (error) {
        console.error("Error prioritizing accounts:", error);
        return accounts.map(a => a.id);
    }
};

export const optimizeTodoWithAI = async (task: string): Promise<string[]> => {
    try {
        const subtasks = await callProxy("optimizeTodoWithAI", [task]);
        return Array.isArray(subtasks) ? subtasks : [];
    } catch (error) {
        console.error("Error optimizing todo:", error);
        return [];
    }
};