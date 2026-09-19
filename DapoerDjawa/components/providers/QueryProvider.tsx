"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryProvider({ children }: { children: ReactNode }) {
  // Inisialisasi QueryClient di dalam useState menggunakan lazy initial state 
  // agar instance tidak terbuat ulang (re-create) pada setiap re-render komponen.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Optimasi performa: Data dianggap fresh selama 1 menit untuk mengurangi request API redundan.
            staleTime: 60 * 1000,
            // Mencegah trigger fetch otomatis yang tidak perlu saat user berpindah tab browser.
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}