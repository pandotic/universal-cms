"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/context/AuthContext";
import { ShortlistProvider } from "@/lib/context/ShortlistContext";
import { CareerHubProvider } from "@/lib/context/CareerHubContext";
import { AssessmentProvider } from "@/lib/context/AssessmentContext";
import { AnalyticsContextProvider } from "@/lib/analytics";
import { LoginModal } from "@/components/auth/LoginModal";
import { ThemeProvider } from "@/lib/context/ThemeContext";

interface AnalyticsProviderConfig {
  provider: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

interface ProvidersProps {
  children: ReactNode;
  analyticsProviders?: AnalyticsProviderConfig[];
}

export function Providers({ children, analyticsProviders = [] }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ShortlistProvider>
          <CareerHubProvider>
            <AssessmentProvider>
              <AnalyticsContextProvider providers={analyticsProviders}>
                {children}
                <LoginModal />
              </AnalyticsContextProvider>
            </AssessmentProvider>
          </CareerHubProvider>
        </ShortlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
