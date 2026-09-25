import React from "react";
import { Metadata } from "next";
import { Footer } from "@/components/layout/Navbar";
import HistoryClient from "./components/HistoryClient";
import { STORE_NAME } from "@/lib/store-defaults";

export const metadata: Metadata = {
  title: `Riwayat Pesanan | ${STORE_NAME}`,
  description: "Lacak pesanan dan lihat riwayat transaksimu dengan mudah dan aman.",
};

export default function OrdersPage() {
  return (
    <section className="bg-gray-50 text-gray-800 min-h-screen flex flex-col">
      <main className="container mx-auto max-w-5xl px-4 sm:px-6 pt-24 md:pt-32 pb-16 flex-1">
        <HistoryClient />
      </main>
      <Footer />
    </section>
  );
}