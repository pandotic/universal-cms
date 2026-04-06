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
import type {
  CHUserProfile,
  CHUserProgram,
  CHUserCredential,
  CHUserSavedJob,
  CHReminder,
  UserProgramStatus,
  ExperienceLevel,
  BudgetPreference,
  ProgramFormat,
} from "@/lib/types/careers";
import { inferCareerProfile } from "@/lib/services/onboarding-to-career";

const STORAGE_KEY = "esgsource_career_hub";

interface CareerHubState {
  profile: CHUserProfile | null;
  programs: CHUserProgram[];
  credentials: CHUserCredential[];
  savedJobs: CHUserSavedJob[];
  reminders: CHReminder[];
}

interface CareerHubContextType extends CareerHubState {
  // Profile
  updateCareerProfile: (updates: Partial<CHUserProfile>) => void;
  // Programs
  saveProgram: (programSlug: string) => void;
  updateProgramStatus: (
    programSlug: string,
    status: UserProgramStatus,
    dates?: Partial<
      Pick<
        CHUserProgram,
        | "date_started"
        | "target_completion_date"
        | "completion_date"
        | "exam_date"
        | "renewal_date"
        | "notes"
      >
    >,
  ) => void;
  removeProgram: (programSlug: string) => void;
  getTrackedProgram: (programSlug: string) => CHUserProgram | undefined;
  // Programs (proof)
  updateProgramProof: (programSlug: string, proofUrl: string | null) => void;
  // Credentials
  addCredential: (cred: Omit<CHUserCredential, "id" | "user_id">) => void;
  updateCredential: (id: string, updates: Partial<CHUserCredential>) => void;
  removeCredential: (id: string) => void;
  // Saved jobs
  saveJob: (job: Omit<CHUserSavedJob, "id" | "user_id" | "saved_at">) => void;
  removeJob: (id: string) => void;
  // Reminders
  addReminder: (reminder: Omit<CHReminder, "id" | "user_id" | "created_at">) => void;
  dismissReminder: (id: string) => void;
  undismissReminder: (id: string) => void;
  removeReminder: (id: string) => void;
  getActiveReminders: () => CHReminder[];
}

const CareerHubContext = createContext<CareerHubContextType | null>(null);

export function useCareerHub() {
  const ctx = useContext(CareerHubContext);
  if (!ctx) throw new Error("useCareerHub must be used within CareerHubProvider");
  return ctx;
}

function generateId(): string {
  return `ch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CareerHubProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<CareerHubState>({
    profile: null,
    programs: [],
    credentials: [],
    savedJobs: [],
    reminders: [],
  });

  // Load from localStorage on mount / user change
  useEffect(() => {
    if (!user) {
      setState({ profile: null, programs: [], credentials: [], savedJobs: [], reminders: [] });
      return;
    }
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        setState(JSON.parse(stored));
      } else {
        // Initialize default profile
        const defaultProfile: CHUserProfile = {
          user_id: user.id,
          current_role_slug: null,
          target_role_slug: null,
          experience_level: null,
          region: null,
          budget_preference: "moderate",
          free_only_preference: false,
          preferred_learning_format: null,
          career_goal_summary: null,
        };
        setState({
          profile: defaultProfile,
          programs: [],
          credentials: [],
          savedJobs: [],
          reminders: [],
        });
      }
    } catch {
      // Ignore parse errors
    }
  }, [user]);

  // Auto-sync from onboarding profile when onboarding completes
  useEffect(() => {
    if (!user?.profile?.onboardingCompleted) return;
    // Only sync if career profile has no current role set (first-time sync)
    if (state.profile?.current_role_slug) return;

    inferCareerProfile(user.profile).then((inferred) => {
      setState((prev) => {
        const updated = {
          ...prev,
          profile: prev.profile
            ? { ...prev.profile, ...inferred }
            : ({ user_id: user.id, ...inferred, preferred_learning_format: null } as CHUserProfile),
        };
        if (user) {
          localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(updated));
        }
        return updated;
      });
    });
  }, [user?.profile?.onboardingCompleted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist on state change
  const persist = useCallback(
    (next: CareerHubState) => {
      if (user) {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(next));
      }
    },
    [user],
  );

  const updateCareerProfile = useCallback(
    (updates: Partial<CHUserProfile>) => {
      setState((prev) => {
        const next = {
          ...prev,
          profile: prev.profile
            ? { ...prev.profile, ...updates }
            : ({ user_id: user?.id ?? "", ...updates } as CHUserProfile),
        };
        persist(next);
        return next;
      });
    },
    [user, persist],
  );

  const saveProgram = useCallback(
    (programSlug: string) => {
      setState((prev) => {
        if (prev.programs.some((p) => p.program_slug === programSlug)) return prev;
        const program: CHUserProgram = {
          id: generateId(),
          user_id: user?.id ?? "",
          program_slug: programSlug,
          status: "saved",
          date_started: null,
          target_completion_date: null,
          completion_date: null,
          exam_date: null,
          renewal_date: null,
          notes: null,
        };
        const next = { ...prev, programs: [...prev.programs, program] };
        persist(next);
        return next;
      });
    },
    [user, persist],
  );

  const updateProgramStatus = useCallback(
    (
      programSlug: string,
      status: UserProgramStatus,
      dates?: Partial<Pick<CHUserProgram, "date_started" | "target_completion_date" | "completion_date" | "exam_date" | "renewal_date" | "notes">>,
    ) => {
      setState((prev) => {
        const next = {
          ...prev,
          programs: prev.programs.map((p) =>
            p.program_slug === programSlug ? { ...p, status, ...dates } : p,
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeProgram = useCallback(
    (programSlug: string) => {
      setState((prev) => {
        const next = {
          ...prev,
          programs: prev.programs.filter((p) => p.program_slug !== programSlug),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateProgramProof = useCallback(
    (programSlug: string, proofUrl: string | null) => {
      setState((prev) => {
        const next = {
          ...prev,
          programs: prev.programs.map((p) =>
            p.program_slug === programSlug
              ? { ...p, uploaded_proof_url: proofUrl }
              : p,
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const getTrackedProgram = useCallback(
    (programSlug: string) => {
      return state.programs.find((p) => p.program_slug === programSlug);
    },
    [state.programs],
  );

  const addCredential = useCallback(
    (cred: Omit<CHUserCredential, "id" | "user_id">) => {
      setState((prev) => {
        const credential: CHUserCredential = {
          ...cred,
          id: generateId(),
          user_id: user?.id ?? "",
        };
        const next = { ...prev, credentials: [...prev.credentials, credential] };
        persist(next);
        return next;
      });
    },
    [user, persist],
  );

  const updateCredential = useCallback(
    (id: string, updates: Partial<CHUserCredential>) => {
      setState((prev) => {
        const next = {
          ...prev,
          credentials: prev.credentials.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeCredential = useCallback(
    (id: string) => {
      setState((prev) => {
        const next = {
          ...prev,
          credentials: prev.credentials.filter((c) => c.id !== id),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const saveJob = useCallback(
    (job: Omit<CHUserSavedJob, "id" | "user_id" | "saved_at">) => {
      setState((prev) => {
        if (job.url && prev.savedJobs.some((j) => j.url === job.url)) return prev;
        const saved: CHUserSavedJob = {
          ...job,
          id: generateId(),
          user_id: user?.id ?? "",
          saved_at: new Date().toISOString(),
        };
        const next = { ...prev, savedJobs: [...prev.savedJobs, saved] };
        persist(next);
        return next;
      });
    },
    [user, persist],
  );

  const removeJob = useCallback(
    (id: string) => {
      setState((prev) => {
        const next = {
          ...prev,
          savedJobs: prev.savedJobs.filter((j) => j.id !== id),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const addReminder = useCallback(
    (reminder: Omit<CHReminder, "id" | "user_id" | "created_at">) => {
      setState((prev) => {
        const newReminder: CHReminder = {
          ...reminder,
          id: generateId(),
          user_id: user?.id ?? "",
          created_at: new Date().toISOString(),
        };
        const next = { ...prev, reminders: [...(prev.reminders ?? []), newReminder] };
        persist(next);
        return next;
      });
    },
    [user, persist],
  );

  const dismissReminder = useCallback(
    (id: string) => {
      setState((prev) => {
        const next = {
          ...prev,
          reminders: (prev.reminders ?? []).map((r) =>
            r.id === id ? { ...r, is_dismissed: true } : r,
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const undismissReminder = useCallback(
    (id: string) => {
      setState((prev) => {
        const next = {
          ...prev,
          reminders: (prev.reminders ?? []).map((r) =>
            r.id === id ? { ...r, is_dismissed: false } : r,
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeReminder = useCallback(
    (id: string) => {
      setState((prev) => {
        const next = {
          ...prev,
          reminders: (prev.reminders ?? []).filter((r) => r.id !== id),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const getActiveReminders = useCallback(() => {
    const now = new Date();
    return (state.reminders ?? []).filter(
      (r) => !r.is_dismissed && new Date(r.remind_at) <= now,
    );
  }, [state.reminders]);

  return (
    <CareerHubContext.Provider
      value={{
        ...state,
        updateCareerProfile,
        saveProgram,
        updateProgramStatus,
        updateProgramProof,
        removeProgram,
        getTrackedProgram,
        addCredential,
        updateCredential,
        removeCredential,
        saveJob,
        removeJob,
        addReminder,
        dismissReminder,
        undismissReminder,
        removeReminder,
        getActiveReminders,
      }}
    >
      {children}
    </CareerHubContext.Provider>
  );
}
