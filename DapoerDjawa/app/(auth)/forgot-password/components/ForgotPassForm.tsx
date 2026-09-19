"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    // Validasi input di sisi klien sebelum melakukan request ke server
    if (!cleanEmail) {
      return toast.add({ type: "error", title: "Ups, Perhatian!", description: "Alamat email wajib diisi." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return toast.add({ type: "error", title: "Email Tidak Valid", description: "Silakan masukkan alamat email yang valid." });
    }

    setIsLoading(true);

    // Mengirimkan email reset menggunakan fungsi bawaan Supabase Auth
    // URL redirectTo membatasi kemana user diarahkan setelah mengklik link di email
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      toast.add({
        type: "error",
        title: "Pengiriman Gagal",
        description: "Gagal mengirimkan link reset password. Silakan coba lagi.",
      });
    } else {
      toast.add({
        type: "success",
        title: "Email Terkirim!",
        description: `Instruksi untuk mengatur ulang password telah dikirim ke ${cleanEmail}.`,
      });
      setEmail(""); // Kosongkan input hanya jika pengiriman berhasil
    }

    setIsLoading(false);
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Reset Password</h1>
        <p className="text-sm text-gray-500">Enter your email address to receive reset instructions</p>
      </div>

      <form className="space-y-5" onSubmit={handleResetPassword}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="johndoe@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" />
        </div>

        <Button type="submit" disabled={isLoading} className="mt-2 w-full bg-black text-white hover:bg-gray-800">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-black">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}