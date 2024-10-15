// File: components/utils/localStorage.ts

export const localStorageUtil = {
    setItem: (key: string, value: string): void => {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          console.warn('Local storage quota exceeded. Attempting to clear some storage...');
          // Strategy to handle quota exceeded:
          // Here you could either clear all of localStorage or selectively remove less important keys
          try {
            window.localStorage.clear();
          } catch (clearError) {
            console.error('Failed to clear localStorage:', clearError);
          }
        } else {
          console.error('Error setting item in localStorage:', e);
        }
      }
    },
  
    getItem: (key: string): string | null => {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.error('Error getting item from localStorage:', e);
        return null;
      }
    },
  
    removeItem: (key: string): void => {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.error('Error removing item from localStorage:', e);
      }
    }
  };
  