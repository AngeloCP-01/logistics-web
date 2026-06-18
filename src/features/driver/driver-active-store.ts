import { create } from "zustand";

const KEY = "driver.activeOrderId";

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

interface DriverActiveState {
  activeOrderId: string | null;
  setActive: (id: string) => void;
  clearActive: () => void;
}

export const useDriverActiveStore = create<DriverActiveState>((set) => ({
  activeOrderId: read(),
  setActive: (id) => {
    try {
      localStorage.setItem(KEY, id);
    } catch {
      // ignore unavailable storage (private mode / SSR); in-memory state still updates
    }
    set({ activeOrderId: id });
  },
  clearActive: () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    set({ activeOrderId: null });
  },
}));
