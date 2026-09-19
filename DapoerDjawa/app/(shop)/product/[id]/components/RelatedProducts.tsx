import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface RelatedProduct { id: string; name: string; price: number; image: string; }
interface RelatedProductsProps { relatedProducts: RelatedProduct[]; }

export default function RelatedProducts({ relatedProducts }: RelatedProductsProps) {
  return (
    <div className="mt-8 md:mt-10 mb-12 md:mb-20">
      <h2 className="mb-6 md:mb-8 text-xl md:text-2xl font-bold text-[#111111]">Anda Mungkin Juga Suka</h2>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-6 lg:gap-6">
        {relatedProducts.map((p) => (
          <Link key={p.id} href={`/product/${p.id}`} className="group flex flex-col overflow-hidden rounded-xl md:rounded-[1.5rem] bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100">
            <div className="relative aspect-square overflow-hidden bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="flex flex-col p-3 md:p-5">
              <h3 className="mb-1 text-xs md:text-sm font-bold text-gray-800 truncate">{p.name}</h3>
              <p className="text-sm md:text-base font-bold text-[#111111]">Rp{p.price.toLocaleString("id-ID")}</p>
            </div>
          </Link>
        ))}

        <Link href="/" className="group flex flex-col items-center justify-center overflow-hidden rounded-xl md:rounded-[1.5rem] bg-gray-50 transition-all duration-300 hover:bg-gray-100 border border-gray-200 min-h-32 md:min-h-50">
          <div className="flex flex-col items-center justify-center p-3 md:p-4 text-center">
            <div className="bg-white p-3 md:p-4 rounded-full shadow-sm mb-2 md:mb-4 group-hover:scale-110 transition-transform">
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
            </div>
            <span className="font-bold text-xs md:text-sm text-gray-900 leading-tight">Lihat Semua<br />Produk</span>
          </div>
        </Link>
      </div>
    </div>
  );
}