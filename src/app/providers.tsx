"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/lib/query-client";
import { articleKeys } from "@/shared/api/article.queries";
import { STORAGE_KEY } from "@/shared/api/article.repository";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => {
    // Products no longer use localStorage (served from the local API + JSON
    // file); cross-device updates for products are handled by polling in
    // product.queries.ts instead. Articles still use localStorage for now.
    function handleStorageChange(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        void queryClient.invalidateQueries({ queryKey: articleKeys.all });
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
