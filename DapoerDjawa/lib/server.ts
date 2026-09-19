import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Menginisialisasi Supabase client untuk digunakan di sisi server (Server Components, API, Server Actions).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            // Melakukan set/update session cookie untuk otentikasi lintas request[cite: 21].
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Error handling kosong: Server Component (saat tahap rendering) tidak selalu memiliki akses tulis ke cookie[cite: 21].
          }
        },
      },
    }
  );
}