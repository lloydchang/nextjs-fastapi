// File: app/api/chat/utils/config.ts

/**
 * Application configuration interface.
 */
export interface AppConfig {
  logsInResponse: boolean;
  rateLimitEnabled: boolean;
  primaryModel: string;
  fallbackModel: string;
  googleCredentials: string | undefined;
  googleModel: string | undefined;
  googleProject: string | undefined;
  googleLocation: string | undefined;
  llamaEndpoint: string | undefined;
}

/**
 * Fetches and returns the application configuration based on environment variables.
 * @returns {AppConfig} - Configuration object for the application.
 */
export const getConfig = (): AppConfig => {
  return {
    logsInResponse: process.env.LOGS_IN_RESPONSE === 'true',
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true',
    primaryModel: process.env.DEFAULT_MODEL || '',
    fallbackModel: process.env.FALLBACK_MODEL || '',
    googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleModel: process.env.GOOGLE_GEMINI_MODEL,
    googleProject: process.env.GOOGLE_CLOUD_PROJECT,
    googleLocation: process.env.GOOGLE_VERTEX_AI_LOCATION,
    llamaEndpoint: process.env.LOCAL_LLAMA_ENDPOINT,
  };
};
