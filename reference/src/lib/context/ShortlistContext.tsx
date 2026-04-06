"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface ShortlistContextType {
  shortlist: Set<string>;
  toggle: (entityId: string) => void;
  isShortlisted: (entityId: string) => boolean;
  clear: () => void;
  count: number;
}

const ShortlistContext = createContext<ShortlistContextType | null>(null);

export function useShortlist() {
  const ctx = useContext(ShortlistContext);
  if (!ctx) throw new Error("useShortlist must be used within ShortlistProvider");
  return ctx;
}

const STORAGE_KEY = "esgsource_shortlist";

export function ShortlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shortlist, setShortlist] = useState<Set<string>>(new Set());

  // Load shortlist from localStorage (keyed by user if logged in)
  useEffect(() => {
    try {
      const key = user ? `${STORAGE_KEY}_${user.id}` : STORAGE_KEY;
      const stored = localStorage.getItem(key);
      if (stored) {
        setShortlist(new Set(JSON.parse(stored)));
      } else {
        setShortlist(new Set());
      }
    } catch {}
  }, [user]);

  const persist = useCallback(
    (next: Set<string>) => {
      setShortlist(next);
      try {
        const key = user ? `${STORAGE_KEY}_${user.id}` : STORAGE_KEY;
        localStorage.setItem(key, JSON.stringify([...next]));
      } catch {}
    },
    [user],
  );

  const toggle = useCallback(
    (entityId: string) => {
      setShortlist((prev) => {
        const next = new Set(prev);
        if (next.has(entityId)) {
          next.delete(entityId);
        } else {
          next.add(entityId);
        }
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const isShortlisted = useCallback((entityId: string) => shortlist.has(entityId), [shortlist]);

  const clear = useCallback(() => persist(new Set()), [persist]);

  return (
    <ShortlistContext.Provider
      value={{ shortlist, toggle, isShortlisted, clear, count: shortlist.size }}
    >
      {children}
    </ShortlistContext.Provider>
  );
}
