"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export type CartItem = { id: string; variant_id: string; name: string; ukuran: string; img: string; price: number; qty: number; };

interface CartListProps {
  items: CartItem[];
  isLoading: boolean;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

export default function CartList({ items, isLoading, onUpdateQty, onRemoveItem }: CartListProps) {
  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        {[1, 2, 3].map((key) => (
          <div key={key} className="flex flex-col md:flex-row md:items-center p-4 border border-gray-100 rounded-3xl bg-white shadow-sm gap-4 md:gap-0">
            <div className="flex items-center gap-5 flex-1">
              <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shrink-0" />
              <div className="w-full space-y-2"><Skeleton className="h-5 w-full max-w-50" /><Skeleton className="h-4 w-2/3 max-w-30" /></div>
            </div>
            <div className="flex items-center justify-between md:w-auto md:gap-6 w-full">
              <Skeleton className="w-28 h-10 rounded-full" />
              <div className="flex items-center justify-end gap-4 w-auto md:w-44"><Skeleton className="h-6 w-20 md:w-24" /><Skeleton className="w-10 h-10 rounded-full shrink-0" /></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm py-12 md:py-16 px-4 text-center">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4"><ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-gray-300" /></div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Keranjang Belanja Kosong</h3>
        <p className="text-sm md:text-base text-gray-500 mb-6">Yuk, mulai pilih kue favoritmu sekarang!</p>
        <Link href="/#shop" className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition">Mulai Belanja</Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden md:flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4 gap-5">
        <div className="flex-1">Produk</div>
        <div className="flex items-center md:gap-6">
          <div className="w-32 text-center">Kuantitas</div>
          <div className="flex items-center justify-end gap-4 w-auto md:w-44"><div className="text-right flex-1 md:w-32">Total Harga</div><div className="w-10 shrink-0" /></div>
        </div>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col md:flex-row md:items-center p-4 border border-gray-100 rounded-3xl bg-white shadow-sm hover:shadow-md transition-shadow gap-4 md:gap-0">
            <div className="flex items-center gap-4 md:gap-5 flex-1">
              <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                <Image src={item.img} alt={item.name} fill sizes="(max-width: 768px) 80px, 96px" className="object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1 truncate">{item.name}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-gray-500 font-medium text-sm md:text-base">Rp{item.price.toLocaleString("id-ID")}</p>
                  {item.ukuran && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-semibold">{item.ukuran}</span>}
                </div>
              </div>
            </div>
            <div className="h-px w-full bg-gray-100 md:hidden my-1" />
            <div className="flex items-center justify-between md:w-auto md:gap-6 w-full">
              <div className="w-auto md:w-32 flex justify-center">
                <div className="flex items-center justify-between border border-gray-200 rounded-full p-1 w-28 md:w-32 bg-gray-50">
                  <button onClick={() => onUpdateQty(item.id, -1)} className="w-8 h-8 md:w-9 md:h-9 flex justify-center items-center rounded-full bg-white shadow-sm text-gray-600 hover:text-black hover:bg-gray-100 transition active:scale-95"><Minus className="w-3 h-3 md:w-4 md:h-4" /></button>
                  <span className="font-bold text-gray-900 text-sm md:text-base">{item.qty}</span>
                  <button onClick={() => onUpdateQty(item.id, 1)} className="w-8 h-8 md:w-9 md:h-9 flex justify-center items-center rounded-full bg-white shadow-sm text-gray-600 hover:text-black hover:bg-gray-100 transition active:scale-95"><Plus className="w-3 h-3 md:w-4 md:h-4" /></button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 md:gap-4 w-auto md:w-44">
                <div className="text-right flex-1 md:w-32">
                  <span className="md:hidden text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Total</span>
                  <span className="font-bold text-gray-900 text-base md:text-lg">Rp{(item.price * item.qty).toLocaleString("id-ID")}</span>
                </div>
                <button onClick={() => onRemoveItem(item.id)} className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0 active:scale-95" title="Hapus Produk"><X className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}