"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import OrderList from "./OrderList";
import OrderDetailModal from "./OrderDetailModal";

export type OrderItem = { id: string; product_name: string; qty: number; price: number; product_image: string; ukuran: string; };
export type Order = { id: string; invoice_number: string; status: string; grand_total: number; created_at: string; shipping_cost?: number; discount?: number; subtotal?: number; tracking_number?: string | null; shipping_courier?: string; order_items?: OrderItem[]; };
export type TrackingHistory = { note: string; status: string; updated_at: string; };

// Mengambil order secara server-secure. Pastikan RLS di Supabase aktif.
const fetchOrderHistory = async (): Promise<Order[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Order[]) || [];
};

export default function HistoryClient() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, isError, error } = useQuery({
    queryKey: ["orderHistory"],
    queryFn: fetchOrderHistory,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    // INFO: Sebaiknya channel ini dibatasi dengan filter user_id jika Supabase Realtime tidak menerapkan RLS secara default untuk event public.
    const channel = supabase.channel("realtime-orders")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["orderHistory"] });
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <div>
      <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
        <Link href="/cart" className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100 transition shadow-sm shrink-0">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Riwayat Belanja</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1 font-medium">Lacak pesanan dan lihat riwayat transaksimu di sini.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-100 shadow-sm">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-20 rounded-full" /></div>
                  <div className="flex items-center gap-3"><div className="flex -space-x-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-10 w-10 rounded-full" /></div><Skeleton className="h-4 w-32" /></div>
                </div>
                <div className="flex flex-row md:flex-col justify-between md:items-end gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  <Skeleton className="h-6 w-32 md:w-24" />
                  <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-10 text-red-500 font-medium text-sm md:text-base">Gagal memuat riwayat pesanan: {(error as Error)?.message || "Terjadi kesalahan"}</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Belum Ada Pesanan</h3>
            <p className="text-sm md:text-base text-gray-500 mb-6 px-4">Kamu belum pernah melakukan transaksi. Yuk, mulai belanja!</p>
            <Link href="/#shop" className="bg-black text-white px-6 py-3 rounded-xl text-sm md:text-base font-semibold hover:bg-gray-800 transition shadow-md">Belanja Sekarang</Link>
          </div>
        ) : (
          <OrderList orders={orders} onOpenDetail={setSelectedOrder} />
        )}
      </div>

      <OrderDetailModal order={selectedOrder} open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)} />
    </div>
  );
}