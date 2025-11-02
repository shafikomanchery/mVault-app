// This is the proxy function that all other functions will use.
const callProxy = async (service: string, args: any[] = []) => {
    const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, args }),
    });

    if (!response.ok) {
        throw new Error(`Proxy call failed for ${service}: ${response.statusText}`);
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

export const analyzeAccountCriticality = async (accountType: string, name: string): Promise<'High' | 'Medium' | 'Low'> => {
  try {
    const criticality = await callProxy("analyzeAccountCriticality", [accountType, name]);
    if (criticality === 'High' || criticality === 'Medium' || criticality === 'Low') {
      return criticality;
    }
    return 'Medium';
  } catch (error) {
    console.error("Error analyzing criticality:", error);
    return 'Medium';
  }
};


export const analyzeItemCriticality = async (title: string, content: string): Promise<'High' | 'Medium' | 'Low'> => {
    try {
        const criticality = await callProxy("analyzeItemCriticality", [title, content]);
        if (criticality === 'High' || criticality === 'Medium' || criticality === 'Low') {
            return criticality;
        }
        return 'Medium';
    } catch (error) {
        console.error("Error analyzing item criticality:", error);
        return 'Medium';
    }
}

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
