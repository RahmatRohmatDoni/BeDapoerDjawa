"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { History, X } from "lucide-react";
import HeroCarousel, { Banner } from "@/components/home/HeroCarousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CartList, { CartItem } from "./CartList";
import CartSummary from "./CartSummary";
import { motion } from "framer-motion";

type CartDatabaseItem = {
  id: string;
  qty: number;
  variant_id: string | null;
  produk_varian: { price: number; ukuran: string | null; img: string | null; produk: { nama_produk: string; deskripsi: string | null } | null } | null;
};

export default function CartClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Gunakan listener session agar state user tersinkronisasi realtime
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      setShowLoginDialog(!session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
      setShowLoginDialog(!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: cartItems = [], isLoading: isCartLoading } = useQuery<CartItem[]>({
    queryKey: ["cart", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("cart_items")
        .select(`id, qty, variant_id, produk_varian (price, ukuran, img, foto_2, produk (nama_produk, deskripsi))`)
        .eq("user_id", userId);

      if (error) throw error;
      return ((data as unknown as CartDatabaseItem[]) ?? []).map((item) => {
        const variant = item.produk_varian;
        return {
          id: item.id,
          variant_id: item.variant_id ?? "",
          name: variant?.produk?.nama_produk ?? "Produk",
          ukuran: variant?.ukuran ?? "Reguler",
          img: variant?.img || "/placeholder.jpg",
          price: Number(variant?.price ?? 0),
          qty: Number(item.qty ?? 1),
        };
      });
    },
    enabled: !!userId,
  });

  const { data: bannersData = [], isLoading: isBannerLoading } = useQuery<Banner[]>({
    queryKey: ["hero-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hero_banners").select("id, image_url, title, link_url, is_active, sort_order, created_at").eq("is_active", true).order("sort_order", { ascending: true });
      if (error) return toast.add({ type: "error", title: "Gagal Memuat Banner", description: "Banner promosi gagal dimuat." }), [];
      return data.map((item) => ({ id: item.id, img: item.image_url, alt: item.title || "Promo", link: item.link_url || "#" }));
    },
    staleTime: 300000, // 5 menit
  });

  const updateQtyMutation = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const item = cartItems.find((c) => c.id === id);
      if (!item || item.qty + delta < 1) return;
      const { error } = await supabase.from("cart_items").update({ qty: item.qty + delta }).eq("id", id).eq("user_id", userId);
      if (error) throw error;
    },
    onMutate: async ({ id, delta }) => {
      await queryClient.cancelQueries({ queryKey: ["cart", userId] });
      const previousCart = queryClient.getQueryData<CartItem[]>(["cart", userId]);
      queryClient.setQueryData<CartItem[]>(["cart", userId], (old = []) => 
        old.map((item) => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item)
      );
      return { previousCart };
    },
    onError: (_, __, context) => {
      if (context?.previousCart) queryClient.setQueryData(["cart", userId], context.previousCart);
      toast.add({ type: "error", title: "Gagal Mengubah Jumlah", description: "Pastikan koneksi internet stabil." });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["cart", userId] }),
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => (queryClient.invalidateQueries({ queryKey: ["cart", userId] }), toast.add({ type: "success", title: "Produk Dihapus" })),
    onError: () => toast.add({ type: "error", title: "Gagal Menghapus Produk" }),
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => (queryClient.invalidateQueries({ queryKey: ["cart", userId] }), toast.add({ type: "success", title: "Keranjang Dikosongkan" })),
  });

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.qty, 0);

  const checkoutMutation = useMutation({
    mutationFn: async ({ discountAmount, promoCode }: { discountAmount: number; promoCode: string | null }) => {
      if (!userId) throw new Error("User belum login.");

      const sessionData = await supabase.auth.getSession();
      const token = sessionData.data.session?.access_token;
      
      if (!token) throw new Error("Akses tidak sah. Silakan login kembali.");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          promoCode: promoCode || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal membuat pesanan");
      }

      return result.order_id;
    },
    onSuccess: (newOrderId) => {
      queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      toast.add({ type: "success", title: "Pesanan Disiapkan", description: "Mengarahkan ke pembayaran..." });
      router.push(`/checkout?order_id=${newOrderId}`);
    },
    onError: () => toast.add({ type: "error", title: "Gagal Memproses Checkout" }),
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }} 
      className="mx-auto w-full max-w-7xl px-4 py-6 md:py-12 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Shopping Cart</h1>
          <p className="mt-1 text-gray-500">Anda memiliki <span className="font-semibold text-gray-700">{cartItems.length}</span> produk</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => router.push("/orders")} className="flex-1 sm:flex-none gap-2 rounded-2xl shadow-sm">
            <History className="h-4 w-4" /> Riwayat Belanja
          </Button>
          {cartItems.length > 0 && (
            <Button variant="outline" onClick={() => clearCartMutation.mutate()} disabled={clearCartMutation.isPending} className="flex-1 sm:flex-none gap-2 rounded-2xl text-gray-500 shadow-sm hover:border-red-500 hover:text-red-600">
              <X className="h-4 w-4" /> {clearCartMutation.isPending ? "Menghapus..." : "Kosongkan Keranjang"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start gap-8 lg:flex-row">
        <div className="flex w-full flex-col gap-6 lg:w-2/3">
          <CartList items={cartItems} isLoading={isCartLoading} onUpdateQty={(id, delta) => updateQtyMutation.mutate({ id, delta })} onRemoveItem={(id) => removeItemMutation.mutate(id)} />
          {!isBannerLoading && bannersData.length > 0 && <div className="hidden lg:block w-full overflow-hidden rounded-2xl shadow-sm"><HeroCarousel banners={bannersData} /></div>}
        </div>
        <div className="w-full lg:w-1/3">
          <CartSummary subtotal={subtotal} cartCount={cartItems.length} isCartLoading={isCartLoading} onCheckout={(d, p) => checkoutMutation.mutate({ discountAmount: d, promoCode: p })} isCheckoutLoading={checkoutMutation.isPending} />
        </div>
      </div>

      {!isBannerLoading && bannersData.length > 0 && <div className="block lg:hidden w-full overflow-hidden rounded-2xl shadow-sm mt-8"><HeroCarousel banners={bannersData} /></div>}

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md w-[90vw] mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Anda belum login</DialogTitle>
            <DialogDescription>Silakan login terlebih dahulu untuk melihat keranjang belanja Anda.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button type="button" onClick={() => router.push("/login")} className="w-full">Menuju Halaman Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}