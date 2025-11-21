import { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  return {
    statusCode: 404,
    body: "AI Service Not Available",
  };
};
