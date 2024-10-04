// File: app/api/chat/services/serveAmazonBedrockTitan.ts

/**
 * Sends a POST request to the Amazon Bedrock Titan endpoint and retrieves the response.
 * @param endpoint - The local Amazon Bedrock Titan API endpoint.
 * @param prompt - The text prompt to send to the Bedrock Titan model.
 * @param model - The model name to use for generation.
 * @returns The generated text from the Amazon Bedrock Titan model.
 */
export async function generateFromAmazonBedrockTitan(endpoint: string, prompt: string, model: string): Promise<string> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model }),
      });
  
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Amazon Bedrock Titan Server responded with status: ${response.status} - ${response.statusText}. Body: ${errorBody}`);
      }
  
      const responseBody = await response.json();
      return responseBody.text.trim();
    } catch (error) {
      console.error('Error generating content from Amazon Bedrock Titan:', error);
      throw error;
    }
  }
  