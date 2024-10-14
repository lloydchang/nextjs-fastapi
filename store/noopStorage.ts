// File: store/noopStorage.ts

// No-op storage for SSR environments that simulates async methods by returning resolved promises.
const noopStorage = {
  getItem: (_key: string) => Promise.resolve(null),  // Always return a resolved promise with `null`
  setItem: (_key: string, _value: string) => Promise.resolve(),  // Return a resolved promise
  removeItem: (_key: string) => Promise.resolve(),  // Return a resolved promise
};

export default noopStorage;
