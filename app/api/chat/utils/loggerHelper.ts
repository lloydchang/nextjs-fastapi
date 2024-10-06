// File: app/api/chat/utils/loggerHelper.ts

/**
 * Utility to get the filename and line number for logging.
 * Captures the call stack and identifies the caller file and line number.
 */
export const getCallerFile = (): string => {
    const oldStackTrace = Error.prepareStackTrace;
    try {
      const err = new Error();
      let callerFile: string | undefined;
      let currentFile: string | undefined;
  
      Error.prepareStackTrace = (_, stack) => stack;
      const stack = err.stack as unknown as NodeJS.CallSite[];
  
      for (const stackFrame of stack) {
        currentFile = stackFrame.getFileName();
        if (callerFile && currentFile !== callerFile && currentFile) {
          return `${stackFrame.getFileName()}:${stackFrame.getLineNumber()}`;
        }
        callerFile = currentFile;
      }
    } catch (e) {
      return 'unknown:0';
    } finally {
      Error.prepareStackTrace = oldStackTrace;
    }
  };
  