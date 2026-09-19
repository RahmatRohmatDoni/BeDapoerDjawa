"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export interface Product {
  id: string;
  name: string;
  price: number;
  img: string;
  link: string;
}

const SORT_OPTIONS = [
  { id: "asc", label: "Termurah - Termahal", iconPath: "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" },
  { id: "desc", label: "Termahal - Termurah", iconPath: "M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" }
];

export default function ProductGrid({ products }: { products: Product[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortOrder, setSortOrder] = useState(""); 
  const [showSort, setShowSort] = useState(false);

  // Optimasi filter & sorting dalam satu useMemo agar lebih ringkas
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => sortOrder === "asc" ? a.price - b.price : sortOrder === "desc" ? b.price - a.price : 0);
  }, [products, searchQuery, sortOrder]);

  return (
    <section id="shop" className="bg-gray-50 pt-10 md:pt-16 pb-12 scroll-mt-20 min-h-[60vh]">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* HEADER SHOP */}
        <div className="flex items-center justify-between pb-4 md:pb-6 border-b border-gray-300 mb-6 md:mb-10 gap-2">
          <div className="flex-1 w-full">
            {showSearch ? (
              <Input
                autoFocus
                placeholder="Cari produk..."
                className="w-full sm:max-w-md rounded-xl shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            ) : (
              <h2 className="uppercase font-bold text-gray-900 text-lg md:text-2xl">Our Products</h2>
            )}
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Tombol Filter Harga */}
            <Button variant={showSort ? "secondary" : "ghost"} size="icon" className="rounded-full w-8 h-8 md:w-10 md:h-10" onClick={() => setShowSort(!showSort)}>
              <svg className="fill-current w-5 h-5 md:w-6 md:h-6 text-gray-600" viewBox="0 0 24 24"><path d="M7 11H17V13H7zM4 7H20V9H4zM10 15H14V17H10z" /></svg>
            </Button>

            {/* Dropdown Filter */}
            {showSort && (
              <div className="absolute top-12 right-0 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl z-20 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                  <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Urutkan Harga</p>
                </div>
                <div className="p-1.5 flex flex-col gap-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button 
                      key={opt.id}
                      onClick={() => { setSortOrder(opt.id); setShowSort(false); }} 
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-all ${sortOrder === opt.id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={opt.iconPath} /></svg>
                      {opt.label}
                    </button>
                  ))}
                  {sortOrder && (
                    <button onClick={() => setSortOrder("")} className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 flex items-center gap-2 mt-1">
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tombol Search */}
            <Button variant={showSearch ? "secondary" : "ghost"} size="icon" className="rounded-full w-10 h-10 md:w-12 md:h-12 transition-transform active:scale-95" onClick={() => { setShowSearch(!showSearch); if(showSearch) setSearchQuery(""); }}>
              <svg className="fill-current w-5 h-5 md:w-6 md:h-6 text-gray-600" viewBox="0 0 24 24">
                {showSearch ? <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /> : <path d="M10,18c1.846,0,3.543-0.635,4.897-1.688l4.396,4.396l1.414-1.414l-4.396-4.396C17.365,13.543,18,11.846,18,10 c0-4.411-3.589-8-8-8s-8,3.589-8,8S5.589,18,10,18z M10,4c3.309,0,6,2.691,6,6s-2.691,6-6,6s-6-2.691-6-6S6.691,4,10,4z" />}
              </svg>
            </Button>
          </div>
        </div>

        {/* GRID PRODUK & EMPTY STATE */}
        {filteredProducts.length > 0 ? (
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
          >
            {filteredProducts.map((p) => (
              <motion.div 
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                }}
              >
                <Link href={p.link} className="group flex flex-col h-full bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 hover:-translate-y-1">
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    <Image src={p.img} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-4 md:p-5 flex flex-col grow">
                    <h3 className="text-sm md:text-lg font-semibold text-gray-900 line-clamp-2 mb-2">{p.name}</h3>
                    <p className="text-base md:text-xl font-extrabold text-gray-900 mt-auto">
                      {p.price > 0 ? `Rp${p.price.toLocaleString("id-ID")}` : "Belum Diatur"}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl py-16 px-4 text-center">
            <div className="text-5xl mb-4">🍩</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Produk tidak ditemukan</h3>
            <p className="text-gray-500 mb-6 max-w-md">Maaf, kami tidak dapat menemukan produk yang cocok dengan pencarian <strong>&quot;{searchQuery}&quot;</strong>.</p>
            <Button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="rounded-xl px-6">Hapus Pencarian</Button>
          </div>
        )}

      </div>
    </section>
  );
}