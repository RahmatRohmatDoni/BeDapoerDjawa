"use client";

import React from "react";
import HeroCarousel, { Banner } from "./HeroCarousel";
import ProductGrid, { Product } from "./ProductGrid";
import { Footer } from "../layout/Navbar";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

type Produk = { id: string; nama_produk: string; created_at?: string };
type ProdukVarian = { id: string; produk_id: string; price: number; img: string | null };
type MainPageData = { banners: Banner[]; products: Product[] };

// Query paralel untuk mencegah waterfall request
async function fetchMainPageData(): Promise<MainPageData> {
  const [bannerRes, produkRes, variantRes] = await Promise.all([
    supabase.from("hero_banners").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("produk").select("*").order("created_at", { ascending: true }),
    supabase.from("produk_varian").select("*"),
  ]);

  if (bannerRes.error) throw new Error(`Banner error: ${bannerRes.error.message}`);
  if (produkRes.error) throw new Error(`Produk error: ${produkRes.error.message}`);
  if (variantRes.error) throw new Error(`Varian error: ${variantRes.error.message}`);

  const banners = (bannerRes.data || []).map((b) => ({
    id: b.id,
    img: b.image_url,
    alt: b.title || "Hero Banner Dapoer Djawa",
    link: b.link_url,
  }));

  const products = (produkRes.data as Produk[] || []).map((p) => {
    const variants = (variantRes.data as ProdukVarian[] || []).filter((v) => v.produk_id === p.id);
    const minPrice = variants.length ? Math.min(...variants.map((v) => v.price)) : 0;
    return {
      id: p.id,
      name: p.nama_produk,
      price: minPrice,
      img: variants[0]?.img || "/placeholder.png",
      link: `/product/${p.id}`,
    };
  });

  return { banners, products };
}

export default function MainPageClient() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["mainPageData"],
    queryFn: fetchMainPageData,
    staleTime: 300000, // 5 menit
    refetchOnWindowFocus: false,
    retry: 2,
  });

  if (isLoading) return <MainPageLoading />;
  if (isError) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">😥</div>
          <h1 className="text-lg font-bold text-gray-900">Gagal Memuat Halaman</h1>
          <button onClick={() => refetch()} className="mt-4 px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
            Coba Lagi
          </button>
          {error instanceof Error && <p className="mt-4 text-xs text-gray-400">{error.message}</p>}
        </div>
      </main>
    );
  }

  const { banners = [], products = [] } = data || {};

  // Static JSON-LD untuk SEO, dipisah agar JSX lebih bersih
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: "DapoerDjawa",
    image: "https://dapoerdjawa.com/logo.png",
    "@id": "https://dapoerdjawa.com",
    url: "https://dapoerdjawa.com",
    telephone: "+628111222333",
    address: { "@type": "PostalAddress", streetAddress: "Perum BDS 2", addressLocality: "Balikpapan", addressRegion: "Kalimantan Timur", addressCountry: "ID" },
    description: "UMKM rumahan yang menyajikan kue kering premium di Balikpapan.",
    priceRange: "$$",
  };

  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <section className="bg-gray-50 text-gray-800 work-sans pt-24 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <style>{`html { scroll-behavior: smooth; }`}</style>

      <HeroCarousel banners={banners} />
      <ProductGrid products={products} />

      <section id="about" className="bg-white py-12 border-t border-gray-200 scroll-mt-20">
        <div className="container mx-auto px-5 max-w-4xl text-center md:text-left">
          <h2 className="uppercase font-bold text-gray-900 text-xl mb-4">About Us</h2>
          <p className="text-gray-600 text-base leading-relaxed mb-4 text-justify">
            Dapoer Djawa adalah UMKM rumahan yang bermula di Perum BDS 2, Balikpapan, pada awal 2020. Tanpa pabrik atau mesin canggih, operasional kami jalankan dengan ketekunan dalam menimbang, menguleni, dan memanggang adonan secara manual setiap hari.
          </p>
          <p className="text-gray-600 text-base leading-relaxed text-justify">
            Kini, pesanan telah meluas menjangkau lebih banyak pelanggan secara online. Pertumbuhan ini mendorong kami untuk terus bertransformasi menjadi lebih profesional dalam melayani Anda.
          </p>
        </div>
      </section>
      <Footer />
    </section>
  );
}

// Reusable Loading Component (Sederhana)
function MainPageLoading() {
  return <div className="min-h-screen pt-24 bg-gray-50 animate-pulse flex flex-col items-center"><div className="w-full h-48 bg-gray-200 mb-10" /><div className="w-1/2 h-8 bg-gray-200 rounded" /></div>;
}