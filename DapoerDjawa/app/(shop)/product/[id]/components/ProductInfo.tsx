import React from "react";
import { Minus, Plus, Star, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";

export interface ProductVariant { id: string; ukuran: string; price: number; stok: number; img: string | null; foto_2?: string | null; }
export interface ProductDisplay { id: string; nama_produk: string; deskripsi: string; foto_2: string | null; variants: ProductVariant[]; }

interface ProductInfoProps {
  product: ProductDisplay;
  selectedVariant: ProductVariant | null;
  setSelectedVariant: (variant: ProductVariant) => void;
  setReviewVariantId: (id: string) => void;
  qty: number;
  setQty: (qty: number) => void;
  isAddingToCart: boolean;
  handleAddToCart: () => void;
  averageRating: string;
  reviewCount: number;
}

export default function ProductInfo({
  product, selectedVariant, setSelectedVariant, setReviewVariantId,
  qty, setQty, isAddingToCart, handleAddToCart, averageRating, reviewCount,
}: ProductInfoProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-12 md:mb-20 items-start">
      <motion.div 
        className="w-full lg:w-1/2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="relative w-full aspect-square overflow-hidden rounded-2xl md:rounded-[2rem] bg-[#F5F5F5] shadow-sm group">
          <Image 
            src={product.foto_2 || selectedVariant?.foto_2 || "/placeholder.png"} 
            alt={product.nama_produk} 
            fill 
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
          />
        </div>
      </motion.div>

      <motion.div 
        className="w-full lg:w-1/2 flex flex-col justify-start lg:pt-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        <h1 className="mb-2 md:mb-3 text-3xl md:text-5xl font-extrabold text-[#111111] tracking-tight">{product.nama_produk}</h1>
        <p className="mb-4 md:mb-6 text-2xl md:text-3xl font-bold text-[#111111]">Rp{selectedVariant?.price.toLocaleString("id-ID") || 0}</p>

        <div className="mb-6 md:mb-8 flex items-center gap-3">
          <div className="flex text-[#FACC15]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`h-4 w-4 md:h-5 md:w-5 ${star <= Math.round(Number(averageRating)) ? "fill-current" : "text-gray-200"}`} />
            ))}
          </div>
          <span className="text-xs md:text-sm font-medium text-[#666666]">{averageRating}/5 ({reviewCount} Ulasan)</span>
        </div>

        <div className="mb-6 md:mb-8">
          <h3 className="text-[10px] md:text-xs font-bold text-gray-900 mb-3 md:mb-4 uppercase tracking-widest">Pilih Ukuran</h3>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {product.variants.map((v) => (
              <Button
                key={v.id}
                variant={selectedVariant?.id === v.id ? "default" : "outline"}
                onClick={() => { setSelectedVariant(v); setReviewVariantId(v.id); }}
                className={`px-4 py-3 md:px-6 md:py-6 rounded-xl md:rounded-2xl font-bold transition-all text-xs md:text-sm border-2 ${
                  selectedVariant?.id === v.id ? "bg-[#111111] border-[#111111] text-white hover:bg-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900"
                }`}
              >
                {v.ukuran}
              </Button>
            ))}
          </div>
        </div>

        <p className="mb-4 md:mb-6 text-xs md:text-sm font-semibold text-[#DC2626]">Ketersediaan: Stok Terbatas (Tersisa {selectedVariant?.stok || 0} Toples)</p>
        <p className="mb-8 md:mb-10 text-sm md:text-base leading-relaxed text-[#666666] text-justify whitespace-pre-wrap">{product.deskripsi}</p>

        <div className="mb-8 md:mb-10 flex flex-row items-center gap-4 md:gap-6">
          <span className="text-sm md:text-base font-bold text-gray-900">Jumlah:</span>
          <div className="flex h-12 w-36 md:h-12 md:w-36 items-center rounded-xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
            <button onClick={() => setQty(Math.max(0, qty - 1))} className="flex h-full w-12 md:w-12 items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors active:bg-gray-200">
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex h-full flex-1 items-center justify-center border-x-2 border-gray-200 text-base md:text-lg font-bold text-[#111111] bg-gray-50">{qty}</div>
            <button onClick={() => setQty(qty + 1)} className="flex h-full w-12 md:w-12 items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors active:bg-gray-200">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={selectedVariant?.stok === 0 || isAddingToCart}
          className="h-14 md:h-16 w-full rounded-xl md:rounded-2xl bg-[#111111] text-xs md:text-sm font-bold uppercase tracking-[0.15em] text-white transition-transform active:scale-[0.98] hover:bg-black hover:shadow-xl disabled:bg-gray-300 disabled:active:scale-100"
        >
          {isAddingToCart ? <><Loader2 className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5 animate-spin" /> MEMPROSES...</> : <><ShoppingCart className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" /> TAMBAHKAN KE KERANJANG</>}
        </Button>
      </motion.div>
    </div>
  );
}