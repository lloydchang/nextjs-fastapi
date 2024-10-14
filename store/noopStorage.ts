// File: store/noopStorage.ts

// No-op storage for SSR environments that simulates async methods by returning resolved promises.
const noopStorage = {
  getItem: (_key: string) => Promise.resolve(null),
  setItem: (_key: string, _value: string) => Promise.resolve(),
  removeItem: (_key: string) => Promise.resolve(),
};

export default noopStorage;
