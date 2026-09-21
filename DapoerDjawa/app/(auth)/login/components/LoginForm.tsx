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

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    // Mencegah form melakukan refresh halaman bawaan browser
    e.preventDefault();

    if (!email || !password) {
      return toast.add({ type: "error", title: "Ups, Perhatian!", description: "Email dan Password wajib diisi." });
    }

    setIsLoading(true);

    // Menggunakan auth bawaan Supabase untuk verifikasi kredensial
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.add({ type: "error", title: "Login Gagal", description: "Email atau Password salah." });
      setIsLoading(false);
      return;
    }

    toast.add({ type: "success", title: "Login Berhasil!", description: "Selamat datang kembali!" });
    router.push("/");
    // Tidak perlu setIsLoading(false) di sini karena halaman akan berpindah
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    // Redirect URL akan mengarahkan user kembali ke halaman utama setelah OAuth selesai di sisi Supabase
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });

    if (error) {
      console.error("Google Sign-In Error:", error);
      toast.add({ type: "error", title: "Login Gagal", description: "Terjadi kesalahan saat login Google." });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Login To Your Account</h1>
        <p className="text-sm text-gray-500">Enter your email below to login</p>
      </div>

      <form className="space-y-5" onSubmit={handleLogin}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="johndoe@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm text-gray-500 transition-colors hover:text-black hover:underline">
              Forgot your password?
            </Link>
          </div>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="mt-2 w-full bg-black text-white hover:bg-gray-800">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
        </Button>
      </form>

      <div className="relative my-6 text-center text-sm">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <span className="relative bg-white px-3 text-gray-500">Or</span>
      </div>

      <Button onClick={handleGoogleLogin} type="button" variant="outline" disabled={isLoading} className="flex w-full items-center justify-center gap-2">
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign In With Google
      </Button>

      <div className="mt-8 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-black hover:underline">Sign Up</Link>
      </div>
    </div>
  );
}