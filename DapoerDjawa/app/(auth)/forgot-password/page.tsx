import type { Metadata } from "next";
import ForgotPassForm from "@/app/(auth)/forgot-password/components/ForgotPassForm";
import { Footer } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Reset Password | DapoerDjawa",
  description: "Reset password akun DapoerDjawa dengan mudah. Masukkan alamat email Anda untuk menerima instruksi pengaturan ulang password.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <section className="flex min-h-screen w-full flex-col bg-gray-50 pt-20 text-base leading-normal tracking-normal text-gray-800 md:pt-24">
      <main className="my-6 flex w-full flex-1 items-center justify-center p-4 md:my-10 md:p-6">
        <ForgotPassForm />
      </main>
      <Footer />
    </section>
  );
}