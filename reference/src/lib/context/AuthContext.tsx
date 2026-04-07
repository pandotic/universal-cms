"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type ExperienceLevel = "early_career" | "mid_career" | "senior_executive" | "career_switcher" | "student_academic";

export interface UserProfile {
  company?: string;
  jobTitle?: string;
  companySize?: "startup" | "smb" | "mid-market" | "enterprise" | "government" | "nonprofit";
  industry?: string;
  region?: string;
  linkedinUrl?: string;
  primaryInterest?: "reporting" | "compliance" | "data-ratings" | "consulting" | "investing" | "carbon" | "supply-chain" | "other";
  frameworksUsed?: string[];
  experienceLevel?: ExperienceLevel;
  solutionType?: "software" | "consulting" | "both" | "learning";
  specificNeeds?: string[];
  onboardingCompleted?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "email";
  profile: UserProfile;
}

interface AuthContextType {
  user: User | null;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loginWithGoogle: () => void;
  loginWithEmail: (email: string, name: string, company?: string, jobTitle?: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateUser: (updates: Partial<Pick<User, "name" | "email">>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const STORAGE_KEY = "esgsource_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old users without profile field
        if (!parsed.profile) parsed.profile = {};
        setUser(parsed);
      }
    } catch {}
  }, []);

  const persistUser = useCallback((u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  const loginWithGoogle = useCallback(() => {
    // Simulated Google OAuth — in production, this would redirect to Google
    const mockUser: User = {
      id: `g-${Date.now()}`,
      email: "user@gmail.com",
      name: "Google User",
      provider: "google",
      profile: {},
    };
    persistUser(mockUser);
    setIsLoginModalOpen(false);
  }, [persistUser]);

  const loginWithEmail = useCallback(
    (email: string, name: string, company?: string, jobTitle?: string) => {
      const u: User = {
        id: `e-${Date.now()}`,
        email,
        name: name || email.split("@")[0],
        provider: "email",
        profile: {
          ...(company ? { company } : {}),
          ...(jobTitle ? { jobTitle } : {}),
        },
      };
      persistUser(u);
      setIsLoginModalOpen(false);
    },
    [persistUser],
  );

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, profile: { ...prev.profile, ...updates } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const updateUser = useCallback(
    (updates: Partial<Pick<User, "name" | "email">>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const logout = useCallback(() => {
    persistUser(null);
  }, [persistUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        loginWithGoogle,
        loginWithEmail,
        updateProfile,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
