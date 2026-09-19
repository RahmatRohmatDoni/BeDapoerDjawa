"use client";

import type { Session } from "@supabase/supabase-js";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AccessState = "checking" | "allowed" | "invalid";

export default function InvitePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Alur data: Menerima kode OTP/PKCE dari URL -> Tukar menjadi Session -> Validasi Hak Akses -> Tampilkan Form
  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      try {
        setAccessState("checking");
        setError("");

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        // 1. Handle PKCE Code: Menukar kode dari URL dengan sesi otentikasi
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw new Error("Link invitation kedaluwarsa atau tidak valid.");

          url.searchParams.delete("code");
          window.history.replaceState({}, document.title, url.toString());
        }

        // 2. Polling Sesi: Supabase terkadang membutuhkan waktu untuk me-resolve sesi di sisi client
        let session: Session | null = null;
        for (let attempt = 1; attempt <= 10; attempt++) {
          if (cancelled) return;
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            session = data.session;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (!session) throw new Error("Session tidak ditemukan. Buka ulang link invitation terbaru.");
        const authUser = session.user;
        if (!authUser.email) throw new Error("Email tidak ditemukan pada invitation.");

        // 3. Validasi Metadata: Pastikan link ini adalah invitation admin
        if (authUser.user_metadata?.invitation_type !== "admin_invitation") {
          throw new Error("Invitation admin tidak valid.");
        }

        // 4. Cek Database Profile: Pastikan user terdaftar di tabel users dan memiliki role admin
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("id_user, email, role")
          .eq("id_user", authUser.id)
          .maybeSingle();

        if (profileError || !profile) {
          throw new Error("Profile admin tidak ditemukan. Pastikan akun memiliki data pada table users.");
        }
        if (profile.role !== "admin") {
          throw new Error("Akun ini tidak memiliki hak akses admin.");
        }
        if (profile.email?.toLowerCase() !== authUser.email.toLowerCase()) {
          throw new Error("Email invitation tidak sesuai dengan profile akun.");
        }

        // Semua validasi berhasil
        if (!cancelled) {
          setEmail(authUser.email);
          setAccessState("allowed");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setAccessState("invalid");
          setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memverifikasi invitation.");
        }
      }
    };

    void verifySession();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    // Validasi Form Input
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirmPassword) return setError("Password dan konfirmasi password tidak sama.");

    try {
      setSaving(true);

      // Verifikasi ulang sesi sebelum menyimpan password untuk mencegah bypass
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.invitation_type !== "admin_invitation") {
        setAccessState("invalid");
        throw new Error("Session invalid. Silakan gunakan invitation terbaru.");
      }

      // Update password pada sistem auth Supabase
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message || "Gagal mengatur password.");

      setSuccess("Password berhasil dibuat. Mengarahkan ke dashboard...");
      setTimeout(() => router.replace("/"), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat membuat password.");
    } finally {
      setSaving(false);
    }
  };

  // Rendering berdasarkan state UI
  if (accessState === "checking") return <CheckingView />;
  if (accessState === "invalid") return <InvalidView error={error} />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-green-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Account</h1>
          <p className="mt-2 text-sm text-gray-500">Buat password untuk menyelesaikan pendaftaran akun admin Anda.</p>
        </div>

        <div className="mb-6">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
          <input id="email" type="email" value={email} disabled className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-600 outline-none" />
        </div>

        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">{error}</div>}
        {success && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-700">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">Password Baru</label>
            <input
              id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter" autoComplete="new-password" disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">Konfirmasi Password</label>
            <input
              id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Masukkan ulang password" autoComplete="new-password" disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
            />
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-700">Ketentuan password:</p>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-gray-500">
              <li>• Minimal 8 karakter</li>
              <li>• Password dan konfirmasi harus sama</li>
              <li>• Jangan bagikan password kepada orang lain</li>
            </ul>
          </div>

          <button type="submit" disabled={saving} className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Menyimpan Password..." : "Set Password"}
          </button>
        </form>
      </div>
    </main>
  );
}

// Local Components untuk merapikan return statement
function CheckingView() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          <p className="text-sm text-gray-600">Memverifikasi invitation...</p>
          <p className="text-center text-xs text-gray-400">Sedang memeriksa session dan akses administrator.</p>
        </div>
      </div>
    </main>
  );
}

function InvalidView({ error }: { error: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-red-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-7.82 14a2 2 0 001.74 3h15.58a2 2 0 001.74-3l-7.82-14a2 2 0 00-3.48 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Invitation Tidak Valid</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">{error || "Link invitation tidak valid atau sudah kedaluwarsa."}</p>
        <p className="mt-4 text-xs leading-5 text-gray-400">Jika Anda seharusnya menerima invitation sebagai admin, silakan minta Owner mengirimkan invitation baru.</p>
      </div>
    </main>
  );
}