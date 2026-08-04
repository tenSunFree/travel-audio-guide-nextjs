import { QueryClient } from "@tanstack/react-query";

// Create the QueryClient via a factory function (not a singleton) — the recommended Next.js App Router pattern.
// This prevents sharing the same QueryClient instance across different server-side requests.
// The actual single instance is created in `app/providers.tsx` using `useState(() => createQueryClient())`.
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  });
}
