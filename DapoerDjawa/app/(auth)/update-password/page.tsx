import type { Metadata } from "next";
import UpdatePasswordForm from "./components/UpdatePasswordForm";
import { Footer } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Update Password | DapoerDjawa",
  description: "Perbarui kata sandi akun DapoerDjawa Anda dengan aman dan mudah.",
  robots: { index: false, follow: false },
};

export default function UpdatePasswordPage() {
  return (
    <section className="flex min-h-screen w-full flex-col bg-gray-50 pt-20 text-base leading-normal tracking-normal text-gray-800 md:pt-24">
      <main className="my-6 flex w-full flex-1 items-center justify-center p-4 md:my-10 md:p-6">
        <UpdatePasswordForm />
      </main>
      <Footer />
    </section>
  );
}