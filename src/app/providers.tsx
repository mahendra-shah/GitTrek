"use client";

import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

/**
 * Query keys that must NEVER be written to localStorage.
 *
 * "session"   — the user's logged-in state. If this were persisted, a stale
 *               cached value would be restored on the next page load, making
 *               the user appear logged-in after logout (or logged-out after
 *               login) until the staleTime window expires.
 *
 * "rateLimit" — depends on which token is active right now; a cached value
 *               from a previous session would show a wrong quota.
 *
 * All other queries (search results, badge data, etc.) are safe to persist
 * because they are pure data fetches not tied to auth state.
 */
const DO_NOT_PERSIST = new Set(["session", "rateLimit"]);

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute stale time
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    })
  );

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        dehydrateOptions: {
          // Only serialize queries whose first key element is NOT in the
          // blocked list. This prevents auth and rate-limit state from
          // being written to / read from localStorage.
          shouldDehydrateQuery: (query) => {
            const firstKey = query.queryKey[0];
            return defaultShouldDehydrateQuery(query) && typeof firstKey === "string" && !DO_NOT_PERSIST.has(firstKey);
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
