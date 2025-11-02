
import { Handler } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { service, args } = JSON.parse(event.body || "{}");

  if (!service) {
    return { statusCode: 400, body: "Missing service name" };
  }

  try {
    // FIX: Use process.env.API_KEY per coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    let result: any;

    switch (service) {
      case "generateStrongPassword":
        const pwResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Generate a strong, secure password with a mix of uppercase letters, lowercase letters, numbers, and special characters. The password should be exactly 16 characters long. Do not include any explanation, just output the password itself.',
        });
        // FIX: Per coding guidelines, use .text directly to extract text content.
        result = pwResponse.text;
        break;
      
      case "analyzeAccountCriticality":
        const [accountType, name] = args;
        const accCritResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the account type "${accountType}" and name "${name}", classify its baseline criticality for a user as 'High', 'Medium', or 'Low'. For example, bank and primary email accounts are High. Social media or secondary services are Medium. Subscriptions or forums are Low. Respond with only one word: High, Medium, or Low.`,
        });
        // FIX: Per coding guidelines, use .text directly to extract text content.
        result = accCritResponse.text;
        break;
        
      case "analyzeItemCriticality":
        const [itemTitle, itemContent] = args;
        const itemCritResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following item and classify its criticality as 'High', 'Medium', or 'Low' based on potential sensitivity. High might include financial details, secrets, or urgent deadlines. Medium could be important plans or work-related notes. Low would be personal reminders or casual thoughts. Title: "${itemTitle}", Content: "${itemContent}". Respond with only one word: High, Medium, or Low.`,
        });
        // FIX: Per coding guidelines, use .text directly to extract text content.
        result = itemCritResponse.text;
        break;

      case "detectSensitiveData":
        const [content] = args;
        const sensitiveResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Scan the following text for sensitive information like passwords, credit card numbers, social security numbers, or API keys. If any are found, describe the type of sensitive information found in a brief warning sentence (e.g., "This note appears to contain a credit card number."). If no sensitive data is found, respond with "None". Text: "${content}"`,
        });
        // FIX: Per coding guidelines, use .text directly to extract text content.
        result = sensitiveResponse.text;
        break;

      case "prioritizeAccountsWithAI":
        const [accounts] = args;
        const prioResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Here is a list of user accounts. Prioritize them based on importance and security sensitivity (e.g., financial/email > work/social > entertainment/shopping). Return a JSON array of the account IDs, ordered from most to least important. Accounts: ${JSON.stringify(accounts.map((a: any) => ({ id: a.id, name: a.name, type: a.accountType })))}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        });
        result = JSON.parse(prioResponse.text.trim());
        break;

      case "optimizeTodoWithAI":
        const [task] = args;
        const todoResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Break down the following task into smaller, actionable sub-tasks. Task: "${task}". Return a JSON array of strings representing the sub-tasks. For example, for "Plan a vacation", you might return ["Research destinations", "Book flights", "Reserve hotel"].`,
            config: {
                responseMimeType: 'application/json',
                 responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        });
        result = JSON.parse(todoResponse.text.trim());
        break;

      default:
        throw new Error(`Unknown service: ${service}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An internal error occurred." }),
    };
  }
};
