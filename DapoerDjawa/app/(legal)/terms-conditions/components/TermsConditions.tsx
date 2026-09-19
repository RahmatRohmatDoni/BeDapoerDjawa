"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsConditions() {
  return (
    <section className="work-sans min-h-screen w-full bg-gray-50 pb-16 text-base leading-normal tracking-normal text-gray-800 selection:bg-[#111111] selection:text-white">
      {/* 
        Injeksi font Work Sans khusus untuk halaman ini.
        Catatan: Untuk optimasi Next.js (menghindari render-blocking), 
        disarankan memindahkan ini menggunakan next/font/google di layout.tsx.
      */}
      <style>{`
        @import url('https://fonts.googleapis.com/css?family=Work+Sans:200,400,600&display=swap'); 
        .work-sans { font-family: 'Work Sans', sans-serif; }
      `}</style>

      <main className="container mx-auto w-full max-w-3xl px-6 pt-24">
        {/* Tombol Navigasi Kembali */}
        <Link 
          href="/" 
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
        </Link>

        {/* Kontainer Utama Syarat & Ketentuan */}
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm md:p-12">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Syarat & Ketentuan</h1>
          <p className="mb-8 border-b border-gray-100 pb-8 text-sm text-gray-500">Pembaruan Terakhir: Agustus 2026</p>

          <div className="space-y-8 text-gray-600">
            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-900">1. Ketentuan Umum</h2>
              <p className="leading-relaxed">
                Selamat datang di Dapoer Djawa. Dengan mengakses dan menggunakan layanan kami, Anda dianggap telah membaca, memahami, dan menyetujui seluruh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui syarat-syarat ini, Anda dipersilakan untuk tidak menggunakan layanan kami.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-900">2. Akun Pengguna</h2>
              <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                <li>Pengguna bertanggung jawab penuh atas kerahasiaan data akun dan kata sandi.</li>
                <li>Dapoer Djawa tidak bertanggung jawab atas kerugian yang ditimbulkan akibat kelalaian pengguna dalam menjaga keamanan akun.</li>
                <li>Kami berhak memblokir atau menghapus akun jika ditemukan indikasi kecurangan atau pelanggaran hukum.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-900">3. Pemesanan dan Pembayaran</h2>
              <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                <li>Harga yang tertera di situs dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
                <li>Pesanan baru akan diproses setelah pembayaran berhasil dikonfirmasi oleh sistem atau tim kami.</li>
                <li>Jika produk kehabisan stok setelah pembayaran dilakukan, kami akan menghubungi Anda untuk menawarkan opsi penggantian produk atau pengembalian dana (refund) 100%.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-900">4. Pengiriman Barang</h2>
              <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                <li>Waktu pengiriman bergantung pada estimasi pihak kurir yang dipilih oleh pelanggan saat checkout.</li>
                <li>Keterlambatan, kehilangan, atau kerusakan yang terjadi selama proses pengiriman oleh pihak ekspedisi berada di luar tanggung jawab Dapoer Djawa, namun kami akan membantu proses klaim ke pihak kurir.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </section>
  );
}