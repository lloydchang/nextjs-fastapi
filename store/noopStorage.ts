// File: store/noopStorage.ts

const noopStorage = {
  getItem() {
    return null;
  },
  setItem() {},
  removeItem() {},
};

export default noopStorage;
