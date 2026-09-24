"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export interface Banner {
  id: string | number;
  img: string;
  alt: string;
  link?: string | null;
}

export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners?.length) return null;

  return (
    <div className="carousel relative container mx-auto px-4 md:px-0 max-w-[1600px]">
      <div className="carousel-inner relative w-full rounded-xl shadow-md bg-gray-100 flex items-center justify-center overflow-hidden">
        {banners.map((c, index) => {
          const isActive = index === currentSlide;
          
          const ImageElement = (
            <div className="relative w-full aspect-[16/9] md:aspect-[21/9]">
              <Image 
                src={c.img} 
                alt={c.alt} 
                fill 
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover" 
              />
            </div>
          );

          const isValidInternalOrHttps = (url: string) => url.startsWith('/') || /^https:\/\//i.test(url);
          const safeLink = c.link && isValidInternalOrHttps(c.link) ? c.link : null;

          return (
            <div key={c.id} className={`w-full transition-opacity duration-700 ${isActive ? "relative opacity-100 z-10" : "absolute top-0 left-0 opacity-0 z-0 pointer-events-none"}`}>
              {safeLink ? <Link href={safeLink} className="w-full block">{ImageElement}</Link> : <div className="w-full block">{ImageElement}</div>}
            </div>
          );
        })}

        {banners.length > 1 && (
          <>
            <Button variant="outline" size="icon" onClick={() => setCurrentSlide((p) => (p - 1 + banners.length) % banners.length)} className="w-8 h-8 absolute left-2 rounded-full bg-white/80 z-20">‹</Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentSlide((p) => (p + 1) % banners.length)} className="w-8 h-8 absolute right-2 rounded-full bg-white/80 z-20">›</Button>
            <div className="absolute bottom-3 flex justify-center gap-2 z-20 w-full">
              {banners.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-2 rounded-full transition-all ${idx === currentSlide ? "bg-gray-900 w-6" : "bg-gray-400 w-2"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}