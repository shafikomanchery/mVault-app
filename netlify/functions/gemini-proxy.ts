import { Handler } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

// The API_KEY should be set in the Netlify build & deploy environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
const model = 'gemini-2.5-flash';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { service, args } = JSON.parse(event.body || "{}");

  if (!service) {
    return { statusCode: 400, body: "Missing service name" };
  }

  if (!process.env.API_KEY) {
     return {
      statusCode: 500,
      body: JSON.stringify({ error: "API_KEY is not configured in the server environment." }),
    };
  }

  try {
    let result: any;

    switch (service) {
      case "generateStrongPassword": {
        const response = await ai.models.generateContent({
          model,
          contents: "Generate a strong, random 16-character password with a mix of uppercase letters, lowercase letters, numbers, and symbols. Provide only the password, with no explanation or surrounding text.",
        });
        result = response.text.trim();
        break;
      }

      case "detectSensitiveData": {
        const [content] = args;
        const response = await ai.models.generateContent({
          model,
          contents: `Analyze the following text. If it contains any personally identifiable information (PII) like names, addresses, phone numbers, social security numbers, credit card numbers, or other sensitive data, identify the type of sensitive data (e.g., "Phone Number", "Credit Card Number"). If there is no sensitive data, respond with the single word 'None'. Text: "${content}"`,
        });
        result = response.text.trim();
        break;
      }
      
      case "prioritizeAccountsWithAI": {
        const [accounts] = args;
        if (!accounts || accounts.length === 0) {
          result = [];
          break;
        }
        const response = await ai.models.generateContent({
            model,
            contents: `You are an expert security and productivity assistant. I will provide you with a JSON array of account objects. Analyze these accounts based on their type (e.g., 'bank', 'email' are high priority) and name. Your task is to return a JSON array of just the account 'id' strings, ordered from most important to least important. Do not provide any explanation or other text. Here are the accounts: ${JSON.stringify(accounts)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        result = JSON.parse(response.text); 
        break;
      }

      case "optimizeTodoWithAI": {
        const [task] = args;
        const response = await ai.models.generateContent({
            model,
            contents: `You are a productivity assistant. Break down the following task into a concise list of actionable subtasks. Return a JSON array of strings, where each string is a subtask. Do not provide any explanation or other text. Task: "${task}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        result = JSON.parse(response.text);
        break;
      }

      default:
        throw new Error(`Unknown service: ${service}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "An internal error occurred." }),
    };
  }
};