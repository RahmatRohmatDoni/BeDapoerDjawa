"use client";

import React, { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const promoSchema = z.object({
  code: z.string().min(3, "Kode promo minimal 3 karakter").regex(/^[a-zA-Z0-9]+$/, "Kode promo tidak boleh mengandung spasi atau simbol"),
});

type AppliedPromo = { code: string; type: "fixed" | "percentage"; value: number; maxDiscount?: number | null };

interface CartSummaryProps {
  subtotal: number;
  cartCount: number;
  isCartLoading: boolean;
  onCheckout: (discountAmount: number, promoCode: string | null) => void;
  isCheckoutLoading: boolean;
}

export default function CartSummary({ subtotal, cartCount, isCartLoading, onCheckout, isCheckoutLoading }: CartSummaryProps) {
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  const checkPromoMutation = useMutation({
    mutationFn: async (code: string) => {
      // Promo dicek di sini untuk preview UI, namun validasi akhir tetap diurus backend saat checkout.
      const { data, error } = await supabase.from("promo_codes").select("*").eq("code", code.toUpperCase()).maybeSingle();
      
      if (error) throw new Error("Terjadi kesalahan sistem saat mengecek promo");
      if (!data) throw new Error("Maaf, kode promo tidak ditemukan.");
      if (!data.is_active) throw new Error("Maaf, kode promo ini sudah tidak aktif.");

      const now = new Date();
      if (data.start_date && new Date(data.start_date) > now) throw new Error("Maaf, kode promo belum bisa digunakan saat ini.");
      if (data.end_date && new Date(data.end_date) < now) throw new Error("Maaf, kode promo sudah kadaluarsa!");
      if (data.usage_limit !== null && (data.used_count || 0) >= data.usage_limit) throw new Error("Maaf, kuota batas penggunaan kode promo ini sudah habis.");
      if (data.min_order_value && subtotal < data.min_order_value) throw new Error(`Minimal belanja untuk promo ini adalah Rp${data.min_order_value.toLocaleString("id-ID")}`);

      return data;
    },
    onSuccess: (data) => {
      setAppliedPromo({
        code: data.code,
        type: data.discount_type === "nominal" ? "fixed" : "percentage",
        value: data.discount_value,
        maxDiscount: data.max_discount,
      });
      setPromoError("");
      toast.add({ type: "success", title: "Hore!", description: `Kode promo ${data.code} berhasil diterapkan.` });
    },
    onError: (error: Error) => {
      setPromoError(error.message);
      setAppliedPromo(null);
      toast.add({ type: "error", title: "Promo Tidak Valid", description: error.message });
    },
  });

  const handleApplyPromo = () => {
    const validation = promoSchema.safeParse({ code: promoInput });
    if (!validation.success) {
      const errorMsg = validation.error.issues[0].message;
      setPromoError(errorMsg);
      return toast.add({ type: "error", title: "Kode Promo Tidak Valid", description: errorMsg });
    }
    checkPromoMutation.mutate(validation.data.code);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const discountAmount = appliedPromo
    ? appliedPromo.type === "percentage"
      ? Math.min(subtotal * (appliedPromo.value / 100), appliedPromo.maxDiscount || Infinity)
      : appliedPromo.value
    : 0;

  const grandTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="sticky top-20 md:top-24 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <h2 className="mb-6 text-xl font-extrabold text-gray-900">Ringkasan Pesanan</h2>

      {isCartLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-10 w-full rounded-xl bg-gray-200" />
          <div className="h-8 w-2/3 rounded bg-gray-200" />
        </div>
      ) : (
        <>
          <div className="mb-6 space-y-4">
            <div className="flex justify-between text-sm md:text-base text-gray-600">
              <span>Subtotal ({cartCount} Produk)</span>
              <span className="font-semibold text-gray-900">Rp{subtotal.toLocaleString("id-ID")}</span>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label htmlFor="promo-code" className="mb-2 block text-sm font-bold text-gray-900">Kode Promo / Diskon</label>
              <div className="flex gap-2">
                <input
                  id="promo-code"
                  type="text"
                  placeholder="Contoh: LEBARAN"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  disabled={!!appliedPromo || checkPromoMutation.isPending}
                  className="w-full rounded-xl border border-gray-300 px-3 md:px-4 py-2.5 text-sm uppercase transition focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100"
                />
                {appliedPromo ? (
                  <Button type="button" onClick={handleRemovePromo} variant="destructive" className="shrink-0 rounded-xl px-4 py-5 font-bold">Hapus</Button>
                ) : (
                  <Button type="button" onClick={handleApplyPromo} disabled={checkPromoMutation.isPending || !promoInput.trim()} className="shrink-0 rounded-xl bg-black px-4 py-5 font-bold text-white hover:bg-gray-800">
                    {checkPromoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Terapkan"}
                  </Button>
                )}
              </div>
              {promoError && <p className="mt-2 text-xs font-semibold text-red-500">{promoError}</p>}
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm md:text-base font-medium text-red-500">
                <span>Potongan Promo {appliedPromo?.type === "percentage" && `(${appliedPromo.value}%)`}</span>
                <span>-Rp{discountAmount.toLocaleString("id-ID")}</span>
              </div>
            )}
          </div>

          <div className="mb-8 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-base md:text-lg font-bold text-gray-900">Total Tagihan</span>
              <span className="text-xl md:text-2xl font-extrabold text-gray-900">Rp{grandTotal.toLocaleString("id-ID")}</span>
            </div>
            <p className="mt-1 text-right text-[10px] md:text-xs text-gray-500">Termasuk pajak. Ongkos kirim dihitung saat checkout.</p>
          </div>
        </>
      )}

      <Button
        type="button"
        onClick={() => onCheckout(discountAmount, appliedPromo?.code || null)}
        disabled={cartCount === 0 || isCartLoading || isCheckoutLoading}
        className="w-full rounded-xl bg-black py-6 text-base md:text-lg font-bold text-white hover:bg-gray-800"
      >
        {isCheckoutLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Memproses...</> : "Lanjutkan Checkout"}
      </Button>
    </div>
  );
}