"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/lib/query-client";
import { articleKeys } from "@/shared/api/article.queries";
import { STORAGE_KEY } from "@/shared/api/article.repository";
import { productKeys } from "@/shared/api/product.queries";
import { PRODUCT_STORAGE_KEY } from "@/shared/api/product.repository";

export function Providers({ children }: { children: ReactNode }) {
  // useState ensures each browser tab creates its own QueryClient instance and instances are not shared between users.
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => {
    // The native storage event only fires when localStorage is changed in another tab (not the same tab),
    // which matches our desired behavior: when another tab saves, this tab refreshes automatically.
    // Operations within the same tab already call invalidateQueries from each mutation, so this event is not relied upon for that.
    function handleStorageChange(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        void queryClient.invalidateQueries({ queryKey: articleKeys.all });
      }
      if (event.key === PRODUCT_STORAGE_KEY) {
        void queryClient.invalidateQueries({ queryKey: productKeys.all });
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
