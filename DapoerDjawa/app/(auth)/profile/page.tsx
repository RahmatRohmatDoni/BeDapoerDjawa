import type { Metadata } from "next";
import UserProfile from "@/app/(auth)/profile/components/UserProfile";
import { Footer } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Profil Akun | DapoerDjawa",
  description: "Lihat informasi profil, alamat email, dan hak akses akun DapoerDjawa Anda.",
  robots: { index: false, follow: false },
};

export default function AfterLoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-gray-50 pt-20 text-gray-800 md:pt-24">
      <section className="flex w-full flex-1 items-center justify-center px-4 py-6 md:py-10">
        <UserProfile />
      </section>
      <Footer />
    </main>
  );
}