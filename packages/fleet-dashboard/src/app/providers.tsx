"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// Cast works around a @tanstack/react-query v5 + @types/react 19 type mismatch:
// QueryClientProvider's `children` type is resolved against a narrower
// ReactNode than the one `import { type ReactNode } from "react"` gives us, so
// passing children directly trips TS2322 in Next's production type check.
// See https://github.com/TanStack/query/issues/6444
const QCP = QueryClientProvider as unknown as React.FC<{
  client: QueryClient;
  children: ReactNode;
}>;

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QCP client={client}>{children}</QCP>;
}
