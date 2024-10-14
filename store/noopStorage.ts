// File: store/noopStorage.ts

// Asynchronous version of noopStorage (for environments that need async storage)
const asyncNoopStorage = {
  getItem: (_key: string) => Promise.resolve(null),
  setItem: (_key: string, _value: string) => Promise.resolve(),
  removeItem: (_key: string) => Promise.resolve(),
};

// Synchronous version of noopStorage (for environments that need sync storage)
const syncNoopStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => undefined,
  removeItem: (_key: string) => undefined,
};

// Export both versions conditionally (you can select which one based on your context)
const noopStorage = typeof window === 'undefined' ? syncNoopStorage : asyncNoopStorage;

export default noopStorage;
