"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, LogOut, Loader2 } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

type UserData = {
  name: string;
  email: string;
  role: string;
  photoURL?: string;
};

export default function UserProfile() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Mengambil data profile dari tabel users untuk mendapatkan role yang valid.
  // Query menggunakan email sesuai dengan relasi tabel saat ini.
  const loadUserProfile = useCallback(async (user: SupabaseUser) => {
    if (!user.email) return;

    try {
      const { data } = await supabase
        .from("users")
        .select("role, nama_user")
        .eq("email", user.email)
        .maybeSingle();

      setUserData({
        name: data?.nama_user || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Pengguna DapoerDjawa",
        email: user.email,
        role: data?.role || "user", // Role utama diverifikasi dan diambil dari database
        photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      });
    } catch {
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setIsLoading(false);
        router.replace("/login");
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (!session?.user) {
        setIsLoading(false);
        return router.replace("/login");
      }
      
      // Delay eksekusi query DB setelah auth callback selesai untuk menghindari race condition
      setTimeout(() => { if (isMounted) loadUserProfile(session.user); }, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, loadUserProfile]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.add({ type: "error", title: "Gagal Keluar", description: "Terjadi kesalahan saat logout. Silakan coba lagi." });
      setIsLoggingOut(false);
      return;
    }

    toast.add({ type: "success", title: "Berhasil Keluar", description: "Anda telah keluar dari akun." });
    router.replace("/login");
  };

  const getRoleBadgeStyle = (role: string) => {
    const r = role.toLowerCase();
    if (r === "owner") return "border-purple-200 bg-purple-50 text-purple-700";
    if (r === "admin") return "border-red-200 bg-red-50 text-red-600";
    return "border-green-200 bg-green-50 text-green-600";
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-xl md:p-8 animate-pulse">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gray-200" />
          <div className="mx-auto mb-3 h-6 w-48 rounded-md bg-gray-200" />
          <div className="mx-auto h-4 w-64 max-w-full rounded-md bg-gray-100" />
        </div>
        <div className="mb-8 space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-gray-200 pb-3 last:border-0 last:pb-0">
              <div className="h-5 w-5 shrink-0 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-gray-200" />
                <div className="h-5 w-40 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-14 w-full rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <p className="mb-4 text-sm text-gray-500">Sesi login tidak ditemukan.</p>
        <Button onClick={() => router.replace("/login")} className="bg-black text-white hover:bg-gray-800">Kembali ke Login</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">
      <div className="mb-8 text-center">
        {userData.photoURL ? (
          <div className="relative mx-auto mb-4 h-24 w-24">
            <Image src={userData.photoURL} alt={`Foto profil ${userData.name}`} fill sizes="96px" className="rounded-full border-4 border-gray-100 object-cover shadow-md" referrerPolicy="no-referrer" />
          </div>
        ) : (
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-gray-100 bg-gray-900 text-white shadow-md">
            <User className="h-12 w-12" />
          </div>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Profil Akun Anda</h1>
        <p className="mt-1 text-sm text-gray-500">Detail informasi akun DapoerDjawa aktif</p>
      </div>

      <div className="mb-8 space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <div className="flex items-center gap-4 border-b border-gray-200 pb-3">
          <User className="h-5 w-5 shrink-0 text-gray-400" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Nama Lengkap</p>
            <p className="wrap-break-word mt-0.5 text-base font-bold text-gray-900">{userData.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b border-gray-200 pb-3">
          <Mail className="h-5 w-5 shrink-0 text-gray-400" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Alamat Email</p>
            <p className="break-all mt-0.5 text-base font-semibold text-gray-900">{userData.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Shield className="h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Hak Akses / Role</p>
            <span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${getRoleBadgeStyle(userData.role)}`}>
              {userData.role}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button onClick={handleLogout} variant="destructive" disabled={isLoggingOut} className="flex w-full items-center justify-center gap-2 rounded-xl py-6 text-base font-bold">
          {isLoggingOut ? <><Loader2 className="h-5 w-5 animate-spin" /> Keluar...</> : <><LogOut className="h-5 w-5" /> Keluar dari Akun</>}
        </Button>
      </div>
    </div>
  );
}