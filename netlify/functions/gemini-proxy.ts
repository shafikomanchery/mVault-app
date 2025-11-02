
import { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { service, args } = JSON.parse(event.body || "{}");

  if (!service) {
    return { statusCode: 400, body: "Missing service name" };
  }

  try {
    let result: any;

    // AI features are disabled. Returning mock data.
    switch (service) {
      case "generateStrongPassword":
        result = "MockPassword123!";
        break;
      
      case "analyzeAccountCriticality":
        result = 'Medium';
        break;
        
      case "analyzeItemCriticality":
        result = 'Medium';
        break;

      case "detectSensitiveData":
        result = 'None';
        break;

      case "prioritizeAccountsWithAI":
        const [accounts] = args;
        result = accounts.map((a: any) => a.id);
        break;

      case "optimizeTodoWithAI":
        result = [];
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
