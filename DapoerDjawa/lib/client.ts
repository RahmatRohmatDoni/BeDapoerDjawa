import { createBrowserClient } from "@supabase/ssr";

// Menginisialisasi Supabase client secara aman untuk digunakan di sisi browser (Client Components)[cite: 20].
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}