// File: components/state/hooks/useLocalStorage.ts

import { useCallback } from 'react';

export const useLocalStorage = (key: string) => {
  const getItem = useCallback(() => {
    try {
      const storedItem = localStorage.getItem(key);
      return storedItem ? JSON.parse(storedItem) : null;
    } catch (error) {
      console.error(`Failed to retrieve item from localStorage: ${key}`, error);
      return null;
    }
  }, [key]);

  const setItem = useCallback((value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set item in localStorage: ${key}`, error);
    }
  }, [key]);

  const removeItem = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item from localStorage: ${key}`, error);
    }
  }, [key]);

  return { getItem, setItem, removeItem };
};
