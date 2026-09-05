"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  // Products / articles 都已改為 server store + API。
  // 跨裝置同步改由 *.queries.ts 的 30 秒輪詢處理，不再監聽 localStorage。

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
