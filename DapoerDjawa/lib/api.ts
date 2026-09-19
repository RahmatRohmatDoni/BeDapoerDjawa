/**
 * HTTP Client wrapper untuk komunikasi frontend → backend NestJS.
 * Otomatis menyertakan Supabase access token pada setiap request.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper untuk mendapatkan Supabase session token dari browser
async function getAccessToken(): Promise<string | null> {
  try {
    // Import dinamis agar tidak circular dependency
    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export async function api<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Attach Supabase token jika tidak di-skip
  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || `API Error: ${response.status}`);
  }

  return data as T;
}

// Convenience methods
export const apiGet = <T = unknown>(endpoint: string, options?: Omit<ApiOptions, 'method'>) =>
  api<T>(endpoint, { ...options, method: 'GET' });

export const apiPost = <T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) =>
  api<T>(endpoint, { ...options, method: 'POST', body });

