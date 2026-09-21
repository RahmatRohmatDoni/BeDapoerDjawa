"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Hanya menerima input berupa huruf dan spasi untuk mencegah karakter tidak valid
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (/^[a-zA-Z\s]*$/.test(e.target.value)) setName(e.target.value);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      return toast.add({ title: "Pendaftaran Gagal", description: "Semua kolom wajib diisi.", type: "error" });
    }
    if (password.length < 6) {
      return toast.add({ title: "Password Lemah", description: "Password minimal terdiri dari 6 karakter.", type: "error" });
    }

    setIsLoading(true);

    // Menyisipkan metadata (full_name) pada saat registrasi, data ini masuk ke tabel auth.users Supabase
    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: cleanName } },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      const isRegistered = msg.includes("already registered") || msg.includes("already exists");

      if (!isRegistered) console.error("Sign Up Error:", error);

      toast.add({
        title: isRegistered ? "Email Sudah Terdaftar" : "Pendaftaran Gagal",
        description: isRegistered ? "Email ini sudah memiliki akun. Silakan langsung Login." : error.message,
        type: "error",
      });
      
      setIsLoading(false);
      return;
    }

    toast.add({ title: "Pendaftaran Berhasil!", description: "Akun Anda berhasil dibuat. Silakan login.", type: "success" });
    
    // Jeda 1 detik agar pengguna sempat membaca notifikasi sukses sebelum dipindahkan ke halaman login
    setTimeout(() => router.push("/login"), 1000);
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });

    if (error) {
      console.error("Google Sign-In Error:", error);
      toast.add({ title: "Pendaftaran Google Gagal", description: "Proses pendaftaran dengan Google dibatalkan atau bermasalah.", type: "error" });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Create An Account</h1>
        <p className="text-sm text-gray-500">Enter your details below to create your account</p>
      </div>

      <form className="space-y-5" onSubmit={handleSignUp}>
        <div className="space-y-2">
          <Label htmlFor="fullname">Full Name</Label>
          <Input id="fullname" type="text" placeholder="John Doe" value={name} onChange={handleNameChange} disabled={isLoading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="johndoe@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Minimal 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="mt-2 w-full bg-black text-white hover:bg-gray-800">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign Up"}
        </Button>
      </form>

      <div className="relative my-6 text-center text-sm">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <span className="relative bg-white px-3 text-gray-500">Or</span>
      </div>

      <Button onClick={handleGoogleSignup} type="button" variant="outline" disabled={isLoading} className="flex w-full items-center justify-center gap-2">
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign In With Google
      </Button>

      <div className="mt-8 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-black hover:underline">Login</Link>
      </div>
    </div>
  );
}