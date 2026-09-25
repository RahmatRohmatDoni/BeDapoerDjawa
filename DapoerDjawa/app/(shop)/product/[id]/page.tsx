import React from "react";
import { Metadata } from "next";
import { supabase } from "@/lib/supabase"; 
import { Footer } from "@/components/layout/Navbar"; 
import DetailClient from "./components/DetailClient"; 
import { STORE_NAME } from "@/lib/store-defaults";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!id) return { title: `URL Tidak Valid | ${STORE_NAME}` };

  const { data, error } = await supabase.from("produk").select("*").eq("id", id).single();
  if (error) console.error("Error saat menarik SEO Supabase:", error.message);
  if (!data) return { title: `Produk Tidak Ditemukan | ${STORE_NAME}` };
  
  return {
    title: `${data.nama_produk} | ${STORE_NAME}`,
    description: data.deskripsi ? `${data.deskripsi.slice(0, 150)}...` : `Kue kering premium dari ${STORE_NAME}`,
    openGraph: { images: [data.foto_2 || "/placeholder.png"] }
  };
}

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;

  // Optimasi query dengan Promise.all untuk mencegah waterfall request
  const [produkRes, varianRes, reviewsRes, relatedRes] = await Promise.all([
    supabase.from("produk").select("*").eq("id", productId).single(),
    supabase.from("produk_varian").select("*").eq("produk_id", productId),
    supabase.from("reviews").select("*").eq("produk_id", productId).order("created_at", { ascending: false }),
    supabase.from("produk").select("id, nama_produk").neq("id", productId).limit(5)
  ]);

  if (!produkRes.data) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Produk tidak ditemukan.</div>;
  }

  const product = {
    id: produkRes.data.id,
    nama_produk: produkRes.data.nama_produk,
    deskripsi: produkRes.data.deskripsi,
    foto_2: produkRes.data.foto_2, 
    variants: varianRes.data || [],
  };

  const relatedIds = (relatedRes.data || []).map(r => r.id);
  const { data: allVariants } = relatedIds.length > 0 
    ? await supabase.from("produk_varian").select("produk_id, price, img").in("produk_id", relatedIds)
    : { data: [] };

  const relatedProducts = (relatedRes.data || []).map(rp => {
    const variant = allVariants?.find(v => v.produk_id === rp.id);
    return {
      id: rp.id,
      name: rp.nama_produk,
      price: variant?.price || 0,
      image: variant?.img || "/placeholder.png"
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.nama_produk,
    "image": product.foto_2,
    "description": product.deskripsi,
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": product.variants.length > 0 ? Math.min(...product.variants.map(v => v.price)) : 0,
      "priceCurrency": "IDR"
    }
  };

  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <section className="min-h-screen bg-white work-sans selection:bg-[#111111] selection:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <main className="mx-auto max-w-360 px-4 md:px-6 pt-24 md:pt-32 pb-10 md:pb-16">
        <DetailClient 
          product={product} 
          initialReviews={reviewsRes.data || []} 
          relatedProducts={relatedProducts} 
        />
      </main>
      <Footer />
    </section>
  );
}