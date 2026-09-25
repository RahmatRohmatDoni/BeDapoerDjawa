import React from "react";
import { Metadata } from "next";
import CartClient from "./components/CartClient";
import { Footer } from "@/components/layout/Navbar";
import { STORE_NAME } from "@/lib/store-defaults";

export const metadata: Metadata = {
  title: `Keranjang Belanja | ${STORE_NAME}`,
  description: `Kelola pesanan kue favorit Anda di keranjang belanja ${STORE_NAME} sebelum melanjutkan ke halaman pembayaran yang aman.`,
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <section className="bg-gray-50 text-gray-800 min-h-screen flex flex-col pt-20 md:pt-24">
      <main className="flex-1 w-full flex flex-col">
        <CartClient />
      </main>
      <Footer />
    </section>
  );
}