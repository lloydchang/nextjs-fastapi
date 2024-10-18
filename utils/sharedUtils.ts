// File: utils/sharedUtils.ts

/**
 * Common utilities used across multiple files to avoid duplication
 */

export const createLogger = (namespace: string) => ({
    debug: (...args: any[]) => console.debug(`[${namespace}]`, ...args),
    error: (...args: any[]) => console.error(`[${namespace}]`, ...args),
    info: (...args: any[]) => console.info(`[${namespace}]`, ...args),
    warn: (...args: any[]) => console.warn(`[${namespace}]`, ...args),
  });
  
  export class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = 'ApiError';
      console.debug('sharedUtils.ts - ApiError created', { status, message });
    }
  }
  
  export const wait = (ms: number) => {
    console.debug('sharedUtils.ts - Waiting', { milliseconds: ms });
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  
  /**
   * Load a script dynamically only if it hasn't been loaded yet.
   */
  export const loadScript = (url: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      console.debug(`[SharedUtils] Attempting to load script: ${url}`);
  
      if (document.querySelector(`script[src="${url}"]`)) {
        console.info(`[SharedUtils] Script already loaded: ${url}`);
        resolve();
        return;
      }
  
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => {
        console.info(`[SharedUtils] Script loaded: ${url}`);
        resolve();
      };
      script.onerror = (err) => {
        console.error(`Failed to load script: ${url}`, err);
        reject(new Error(`Failed to load script: ${url}`));
      };
      document.body.appendChild(script);
    });
  };
  