// File: app/api/chat/utils/loggerHelper.ts

/**
 * Utility to get the filename and line number for logging.
 * It captures the call stack and identifies the caller file and line number.
 */
export const getCallerFile = () => {
    const oldStackTrace = Error.prepareStackTrace;
    try {
      const err = new Error();
      let callerFile: string | undefined;
      let currentFile: string | undefined;
  
      Error.prepareStackTrace = (_, stack) => stack;
      const stack = err.stack as unknown as NodeJS.CallSite[];
  
      // Iterate through stack frames to identify the correct caller
      for (const stackFrame of stack) {
        currentFile = stackFrame.getFileName();
        if (callerFile && currentFile !== callerFile) {
          // Return the file and line number of the calling file
          return `${stackFrame.getFileName()}:${stackFrame.getLineNumber()}`;
        }
        callerFile = currentFile;
      }
    } catch (e) {
      return undefined;
    } finally {
      Error.prepareStackTrace = oldStackTrace;
    }
  };
  