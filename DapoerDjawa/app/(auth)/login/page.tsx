import { Metadata } from "next";
import LoginForm from "./components/LoginForm";
import { Footer } from "@/components/layout/Navbar";
import { STORE_NAME } from "@/lib/store-defaults";

export const metadata: Metadata = {
  title: `Login | ${STORE_NAME}`,
  description: `Masuk ke akun ${STORE_NAME} Anda untuk mulai berbelanja kue kering premium khas Balikpapan.`,
};

export default function LoginPage() {
  return (
    <section className="flex min-h-screen w-full flex-col bg-gray-50 pt-20 md:pt-24 text-base leading-normal tracking-normal text-gray-800">
      <main className="my-6 flex w-full flex-1 items-center justify-center p-4 md:my-10 md:p-6">
        <LoginForm />
      </main>
      <Footer />
    </section>
  );
}