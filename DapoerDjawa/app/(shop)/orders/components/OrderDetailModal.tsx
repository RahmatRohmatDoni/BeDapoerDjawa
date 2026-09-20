"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon, MapPin, Truck, Loader2, Clock, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import type { Order, TrackingHistory } from "./HistoryClient";

type OrderDetailModalProps = { order: Order | null; open: boolean; onOpenChange: (open: boolean) => void; };

export default function OrderDetailModal({ order, open, onOpenChange }: OrderDetailModalProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingHistory[] | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) { setTrackingData(null); setTrackingError(null); setIsTracking(false); }
    onOpenChange(isOpen);
  };

  const handleTrackPackage = async () => {
    if (!order?.tracking_number) return;
    setIsTracking(true); setTrackingError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/biteship/tracking`, {
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ resi: order.tracking_number, courier: order.shipping_courier || "jne" }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Gagal mengambil data pelacakan.");
      setTrackingData(result.history || []);
    } catch (error: unknown) {
      // Menggunakan tipe unknown dan memeriksa instance Error
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat melacak paket.";
      setTrackingError(errorMessage);
    } finally {
      setIsTracking(false);
    }
  };

  if (!order) return null;

  const isUnpaid = ["draft", "pending", "unpaid"].includes(order.status?.toLowerCase() || "");

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === "PAID") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "SHIPPED") return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "DELIVERED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (isUnpaid) return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw]! sm:w-[90vw]! md:w-[85vw]! lg:w-[80vw]! max-w-6xl! max-h-[90vh]! p-0! gap-0! overflow-hidden bg-white rounded-2xl md:rounded-3xl">
        <DialogHeader className="px-4 sm:px-6 md:px-10 py-4 md:py-6 border-b border-gray-100">
          <DialogTitle className="text-lg sm:text-xl md:text-3xl font-bold text-gray-900 text-left">Detail Pesanan</DialogTitle>
          <p className="text-xs md:text-base text-gray-500 mt-1 md:mt-2 text-left flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
            <span>Invoice: <span className="font-mono font-semibold text-gray-800">{order.invoice_number || `INV-${order.id.substring(0, 6).toUpperCase()}`}</span></span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold w-fit uppercase border ${getStatusColor(order.status || "")}`}>{order.status || "SELESAI"}</span>
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] bg-gray-50/40 px-4 sm:px-6 md:px-8 lg:px-10 py-4 md:py-6">
          {order.tracking_number && (
            <section className="mb-5 md:mb-6">
              <div className="bg-blue-50/50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h4 className="text-[10px] md:text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Truck className="w-3.5 h-3.5 md:w-4 md:h-4" /> Informasi Pengiriman</h4>
                  <p className="font-bold text-sm md:text-base text-blue-900 uppercase">Kurir: {order.shipping_courier || "-"}</p>
                  <p className="text-xs md:text-sm font-mono text-blue-700 mt-1">Resi: {order.tracking_number}</p>
                </div>
                <button onClick={handleTrackPackage} disabled={isTracking} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white w-full md:w-auto px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition shadow-sm flex items-center justify-center gap-2">
                  {isTracking ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />} {isTracking ? "Melacak..." : "Lacak Paket"}
                </button>
              </div>

              {trackingError && <div className="mt-3 p-3 md:p-4 bg-red-50 text-red-600 rounded-xl text-xs md:text-sm border border-red-100">{trackingError}</div>}

              {trackingData && (
                <div className="mt-3 md:mt-4 p-4 md:p-5 bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-xs md:text-sm font-bold text-gray-900 mb-4 border-b pb-3">Riwayat Perjalanan Paket</h4>
                  <div className="space-y-4">
                    {trackingData.length === 0 ? <p className="text-xs md:text-sm text-gray-500 italic">Belum ada riwayat pergerakan paket.</p> : trackingData.map((track, idx) => (
                      <div key={idx} className="flex gap-3 md:gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${idx === 0 ? "bg-blue-500 ring-4 ring-blue-50" : "bg-gray-300"}`} />
                          {idx !== trackingData.length - 1 && <div className="w-px h-full bg-gray-200 my-1.5" />}
                        </div>
                        <div className="pb-3">
                          <p className={`text-xs md:text-sm font-medium ${idx === 0 ? "text-gray-900" : "text-gray-600"}`}>{track.note}</p>
                          <p className="text-[10px] md:text-xs text-gray-400 flex items-center gap-1.5 mt-1"><Clock className="w-3 h-3" /> {new Date(track.updated_at).toLocaleString("id-ID")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section>
            <h4 className="text-sm md:text-lg font-bold text-gray-900 mb-3 md:mb-4">Daftar Produk ({order.order_items?.length || 0})</h4>
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="hidden lg:grid grid-cols-[minmax(300px,1fr)_120px_170px_170px] gap-6 px-6 py-4 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-600">Produk</span><span className="text-sm font-bold text-gray-600">Jumlah</span><span className="text-sm font-bold text-gray-600">Harga Satuan</span><span className="text-sm font-bold text-gray-600 text-right">Subtotal</span>
              </div>
              {order.order_items?.map((item, index) => {
                const subtotal = (item.qty || 0) * (item.price || 0);
                return (
                  <div key={item.id} className={`px-4 sm:px-6 py-4 md:py-6 ${index !== (order.order_items?.length || 1) - 1 ? "border-b border-gray-100" : ""}`}>
                    <div className="hidden lg:grid grid-cols-[minmax(300px,1fr)_120px_170px_170px] gap-6 items-center">
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.product_image ? <Image src={item.product_image} alt={item.product_name} width={80} height={80} className="w-full h-full object-cover" /> : <ImageIcon className="w-7 h-7 text-gray-300" />}
                        </div>
                        <div className="min-w-0"><p className="font-bold text-gray-900 text-lg">{item.product_name}</p>{item.ukuran && <span className="inline-block mt-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-xs font-semibold">{item.ukuran}</span>}</div>
                      </div>
                      <div><p className="font-bold text-gray-900">{item.qty} pcs</p></div><div><p className="font-semibold text-gray-800">Rp{(item.price || 0).toLocaleString("id-ID")}</p></div><div className="text-right"><p className="font-extrabold text-gray-900 text-lg">Rp{subtotal.toLocaleString("id-ID")}</p></div>
                    </div>
                    <div className="lg:hidden">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.product_image ? <Image src={item.product_image} alt={item.product_name} width={80} height={80} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-gray-300" />}
                        </div>
                        <div className="flex-1 min-w-0"><p className="font-bold text-gray-900 text-sm sm:text-lg">{item.product_name}</p>{item.ukuran && <span className="inline-block mt-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold">{item.ukuran}</span>}<p className="mt-1.5 text-xs sm:text-sm text-gray-600"><span className="font-bold text-gray-900">{item.qty} pcs</span> <span className="mx-1">×</span> <span>Rp{(item.price || 0).toLocaleString("id-ID")}</span></p></div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center"><span className="text-xs sm:text-sm text-gray-500 font-medium">Subtotal</span><span className="font-extrabold text-sm sm:text-base text-gray-900">Rp{subtotal.toLocaleString("id-ID")}</span></div>
                    </div>
                  </div>
                );
              })}
              {(!order.order_items || order.order_items.length === 0) && <div className="py-8 text-center text-sm text-gray-500">Tidak ada produk pada pesanan ini.</div>}
            </div>
          </section>

          <section className="mt-5 md:mt-6">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 md:p-7">
              <div className="flex justify-between items-center gap-4 py-1.5 md:py-2"><span className="text-xs md:text-sm text-gray-600 font-medium">Subtotal Produk</span><span className="text-sm md:text-base font-bold text-gray-800 whitespace-nowrap">Rp{(order.subtotal || 0).toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between items-center gap-4 py-1.5 md:py-2"><span className="text-xs md:text-sm text-gray-600 font-medium">Ongkos Kirim</span><span className="text-sm md:text-base font-bold text-gray-800 whitespace-nowrap">Rp{(order.shipping_cost || 0).toLocaleString("id-ID")}</span></div>
              {(order.discount || 0) > 0 && <div className="flex justify-between items-center gap-4 py-1.5 md:py-2"><span className="text-xs md:text-sm text-gray-600 font-medium">Diskon Promo</span><span className="text-sm md:text-base font-bold text-red-500 whitespace-nowrap">- Rp{(order.discount || 0).toLocaleString("id-ID")}</span></div>}
              <div className="mt-3 md:mt-4 pt-3 md:pt-5 border-t border-gray-200 flex justify-between items-center gap-4"><span className="font-bold text-gray-900 text-sm md:text-lg">Total Pembayaran</span><span className="font-black text-lg md:text-2xl text-gray-900 whitespace-nowrap">Rp{(order.grand_total || 0).toLocaleString("id-ID")}</span></div>
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row justify-end mt-5 md:mt-6 pb-2 gap-3">
            <button type="button" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto px-6 py-2.5 md:py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 active:scale-[0.98] transition shadow-sm">Tutup</button>
            {isUnpaid && <Link href={`/checkout?order_id=${order.id}`} className="w-full sm:w-auto px-6 py-2.5 md:py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 active:scale-[0.98] transition shadow-sm flex items-center justify-center gap-2"><CreditCard className="w-4 h-4" /> Lanjutkan Pembayaran</Link>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}