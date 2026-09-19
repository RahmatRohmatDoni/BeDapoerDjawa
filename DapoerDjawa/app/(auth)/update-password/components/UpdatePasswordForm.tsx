"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Memverifikasi hash fragment URL (dari email) untuk mencegah akses langsung tanpa token recovery valid
  useEffect(() => {
    const checkTimeout = setTimeout(() => {
      const hash = window.location.hash;

      if (hash.includes("error_code=otp_expired")) {
        toast.add({ type: "error", title: "Link Kedaluwarsa", description: "Link reset password ini sudah tidak berlaku. Silakan minta link baru." });
        return router.replace("/forgot-password");
      }

      if (!hash.includes("type=recovery")) {
        toast.add({ type: "error", title: "Akses Ditolak", description: "Halaman ini hanya dapat diakses melalui link reset password yang valid." });
        return router.replace("/login");
      }
      
      setIsAuthorized(true);
    }, 0);

    return () => clearTimeout(checkTimeout);
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      return toast.add({ type: "error", title: "Kolom Kosong", description: "Harap isi kata sandi baru dan konfirmasinya." });
    }
    if (password.length < 6) {
      return toast.add({ type: "error", title: "Kata Sandi Lemah", description: "Kata sandi harus terdiri dari minimal 6 karakter." });
    }
    if (password !== confirmPassword) {
      return toast.add({ type: "error", title: "Kata Sandi Tidak Cocok", description: "Kata sandi baru dan konfirmasi kata sandi tidak sama." });
    }

    setIsLoading(true);

    // Update password memvalidasi sesi secara otomatis menggunakan token recovery dari URL
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.add({ type: "error", title: "Gagal Mengubah Sandi", description: error.message || "Gagal mengubah kata sandi. Silakan coba lagi." });
      setIsLoading(false);
      return;
    }

    toast.add({ type: "success", title: "Berhasil!", description: "Kata sandi Anda telah diperbarui. Silakan login kembali." });
    setPassword("");
    setConfirmPassword("");

    setTimeout(() => router.replace("/login"), 1000);
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="mt-4 text-sm text-gray-500">Memverifikasi akses keamanan...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Buat Kata Sandi Baru</h1>
        <p className="text-sm text-gray-500">Silakan masukkan kata sandi baru untuk akun Anda.</p>
      </div>

      <form className="space-y-5" onSubmit={handleUpdatePassword}>
        <div className="space-y-2">
          <Label htmlFor="password">Kata Sandi Baru</Label>
          <Input id="password" name="password" type="password" placeholder="Minimal 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Ketik ulang kata sandi baru" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" />
        </div>

        <Button type="submit" disabled={isLoading} className="mt-4 w-full bg-black text-white hover:bg-gray-800">
          {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Menyimpan...</> : "Simpan Kata Sandi"}
        </Button>
      </form>
    </div>
  );
}