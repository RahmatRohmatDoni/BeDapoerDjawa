import type { Metadata } from "next";
import SignUpForm from "@/app/(auth)/register/components/SignUpForm";
import { Footer } from "@/components/layout/Navbar";
import { STORE_NAME } from "@/lib/store-defaults";

export const metadata: Metadata = {
  title: `Sign Up | ${STORE_NAME}`,
  description: `Buat akun ${STORE_NAME} untuk menikmati kemudahan berbelanja berbagai pilihan kue dan cookies khas ${STORE_NAME}.`,
  keywords: [STORE_NAME, `Daftar ${STORE_NAME}`, `Sign Up ${STORE_NAME}`, "cookies", "kue", "toko kue"],
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-20 md:pt-24">
      <main className="flex flex-1 items-center justify-center px-4 py-6 md:py-12">
        <SignUpForm />
      </main>
      <Footer />
    </div>
  );
}