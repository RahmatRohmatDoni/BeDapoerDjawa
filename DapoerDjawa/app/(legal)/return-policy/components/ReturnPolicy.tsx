"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function ReturnPolicy() {
  return (
    <section className="min-h-screen w-full bg-gray-50 pb-16 text-base leading-normal tracking-normal text-gray-800 selection:bg-[#111111] selection:text-white work-sans">
      {/* 
        Menyisipkan font spesifik halaman. 
        Catatan: Idealnya ini dipindahkan ke layout.tsx menggunakan next/font/google 
        agar tidak memicu peringatan render blocking dari Next.js.
      */}
      <style>{`
        @import url('https://fonts.googleapis.com/css?family=Work+Sans:200,400,600&display=swap'); 
        .work-sans { font-family: 'Work Sans', sans-serif; }
      `}</style>

      <main className="container mx-auto w-full max-w-3xl px-6 pt-24">
        {/* Navigasi kembali */}
        <Link 
          href="/" 
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
        </Link>

        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm md:p-12">
          {/* Header Konten */}
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Kebijakan Pengembalian</h1>
          <p className="mb-8 border-b border-gray-100 pb-8 text-sm text-gray-500">Pembaruan Terakhir: Agustus 2026</p>

          {/* Kotak Peringatan Penting */}
          <div className="mb-8 flex gap-3 rounded-xl border border-orange-100 bg-orange-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <p className="text-sm leading-relaxed text-orange-800">
              <strong>Penting:</strong> Kami mewajibkan pelanggan untuk melampirkan <strong>Video Unboxing</strong> tanpa jeda saat paket pertama kali dibuka sebagai syarat mutlak untuk klaim barang rusak atau kurang.
            </p>
          </div>

          {/* Detail Kebijakan */}
          <div className="space-y-8 text-gray-600">
            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-900">1. Syarat Pengembalian Barang</h2>
              <p className="mb-3 leading-relaxed">Anda dapat mengajukan pengembalian barang atau dana (refund) dengan kondisi berikut:</p>
              <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                <li>Produk yang diterima dalam keadaan cacat pabrik atau rusak sebelum digunakan.</li>
                <li>Produk yang diterima tidak sesuai dengan pesanan (salah varian, salah ukuran, atau pesanan kurang).</li>
                <li>Batas maksimal pengajuan komplain adalah <strong>2x24 jam</strong> sejak status resi dinyatakan &quot;Terkirim / Delivered&quot;.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-900">2. Barang yang Tidak Dapat Dikembalikan</h2>
              <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                <li>Produk yang rusak akibat kesalahan penggunaan atau kelalaian pihak pembeli.</li>
                <li>Produk makanan/minuman yang kemasannya sudah dibuka (kecuali terbukti basi/berjamur saat kemasan masih tersegel).</li>
                <li>Produk yang dibeli dalam masa promo <em>Clearance Sale</em> atau cuci gudang (kecuali dinyatakan lain).</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-900">3. Prosedur Pengembalian (Retur)</h2>
              <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
                <li>Hubungi Customer Service kami via WhatsApp dengan menyertakan Nomor Pesanan.</li>
                <li>Kirimkan bukti berupa <strong>Foto Label Pengiriman</strong> dan <strong>Video Unboxing</strong> utuh tanpa proses potong (edit).</li>
                <li>Tunggu konfirmasi dari tim kami (maksimal 1x24 jam kerja).</li>
                <li>Jika disetujui, kami akan memberikan alamat untuk pengiriman retur. Biaya ongkos kirim retur akibat kesalahan kami (salah kirim/cacat) akan ditanggung oleh Dapoer Djawa.</li>
              </ol>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-900">4. Proses Pengembalian Dana (Refund)</h2>
              <p className="leading-relaxed">
                Jika Anda memilih pengembalian dana, dana akan ditransfer kembali ke rekening atau e-wallet Anda maksimal <strong>2-3 hari kerja</strong> setelah barang retur kami terima di gudang dan selesai melewati proses pengecekan.
              </p>
            </section>
          </div>
        </div>
      </main>
    </section>
  );
}