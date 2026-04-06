"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import type { AssessmentResult, SavedAssessment } from "@/lib/types/assessment";

const STORAGE_KEY = "esgsource_assessments";

interface AssessmentState {
  assessments: SavedAssessment[];
}

interface AssessmentContextType extends AssessmentState {
  saveAssessment: (result: AssessmentResult) => SavedAssessment;
  deleteAssessment: (id: string) => void;
  togglePublic: (id: string) => void;
  getLatestAssessment: () => SavedAssessment | null;
  getAssessmentById: (id: string) => SavedAssessment | undefined;
  getAssessmentByShareSlug: (slug: string) => SavedAssessment | undefined;
  isLoggedIn: boolean;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
}

function generateId(): string {
  return `esg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateShareSlug(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AssessmentState>({ assessments: [] });

  // Load from localStorage on mount / user change
  useEffect(() => {
    if (!user) {
      // Load anonymous assessments
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setState(JSON.parse(stored));
        } else {
          setState({ assessments: [] });
        }
      } catch {
        setState({ assessments: [] });
      }
      return;
    }
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        setState(JSON.parse(stored));
      } else {
        // Migrate anonymous assessments to user account
        try {
          const anonStored = localStorage.getItem(STORAGE_KEY);
          if (anonStored) {
            const anonState = JSON.parse(anonStored) as AssessmentState;
            if (anonState.assessments.length > 0) {
              setState(anonState);
              localStorage.setItem(`${STORAGE_KEY}_${user.id}`, anonStored);
              localStorage.removeItem(STORAGE_KEY);
              return;
            }
          }
        } catch {
          // Ignore migration errors
        }
        setState({ assessments: [] });
      }
    } catch {
      setState({ assessments: [] });
    }
  }, [user]);

  // Persist on state change
  const persist = useCallback(
    (next: AssessmentState) => {
      const key = user ? `${STORAGE_KEY}_${user.id}` : STORAGE_KEY;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // localStorage full or unavailable
      }
    },
    [user],
  );

  const saveAssessment = useCallback(
    (result: AssessmentResult): SavedAssessment => {
      const saved: SavedAssessment = {
        ...result,
        id: generateId(),
        isPublic: false,
        shareSlug: generateShareSlug(),
      };

      setState((prev) => {
        const next = {
          assessments: [saved, ...prev.assessments],
        };
        persist(next);
        return next;
      });

      return saved;
    },
    [persist],
  );

  const deleteAssessment = useCallback(
    (id: string) => {
      setState((prev) => {
        const next = {
          assessments: prev.assessments.filter((a) => a.id !== id),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const togglePublic = useCallback(
    (id: string) => {
      setState((prev) => {
        const next = {
          assessments: prev.assessments.map((a) =>
            a.id === id ? { ...a, isPublic: !a.isPublic } : a,
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const getLatestAssessment = useCallback(() => {
    return state.assessments.length > 0 ? state.assessments[0] : null;
  }, [state.assessments]);

  const getAssessmentById = useCallback(
    (id: string) => {
      return state.assessments.find((a) => a.id === id);
    },
    [state.assessments],
  );

  const getAssessmentByShareSlug = useCallback(
    (slug: string) => {
      return state.assessments.find((a) => a.shareSlug === slug && a.isPublic);
    },
    [state.assessments],
  );

  return (
    <AssessmentContext.Provider
      value={{
        assessments: state.assessments,
        saveAssessment,
        deleteAssessment,
        togglePublic,
        getLatestAssessment,
        getAssessmentById,
        getAssessmentByShareSlug,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}
