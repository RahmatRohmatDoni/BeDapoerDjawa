import React from "react";
import { Footer } from "@/components/layout/Navbar";

export default function Loading() {
  return (
    <section className="min-h-screen bg-white work-sans">
      <main className="mx-auto max-w-360 px-4 md:px-6 pt-24 md:pt-32 pb-10 md:pb-16">
        
        {/* 1. PRODUCT DETAIL SKELETON */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 mb-12 md:mb-20 items-start">
          <div className="w-full lg:w-1/2">
            <div className="w-full aspect-square rounded-2xl md:rounded-[2rem] bg-gray-200 animate-pulse" />
          </div>

          <div className="w-full lg:w-1/2 flex flex-col justify-start lg:pt-4">
            <div className="h-10 md:h-12 w-3/4 bg-gray-200 animate-pulse rounded-xl mb-4" />
            <div className="h-8 md:h-10 w-1/3 bg-gray-200 animate-pulse rounded-xl mb-6 md:mb-8" />
            <div className="h-6 w-1/4 bg-gray-200 animate-pulse rounded-lg mb-8 md:mb-10" />

            <div className="mb-8 md:mb-10">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded-md mb-4" />
              <div className="flex gap-2 md:gap-3">
                {/* Looping untuk varian skeleton */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 md:h-16 w-20 md:w-24 bg-gray-200 animate-pulse rounded-xl md:rounded-2xl" />
                ))}
              </div>
            </div>

            <div className="space-y-2 md:space-y-3 mb-8 md:mb-10">
              <div className="h-4 w-full bg-gray-200 animate-pulse rounded-md" />
              <div className="h-4 w-full bg-gray-200 animate-pulse rounded-md" />
              <div className="h-4 w-4/5 bg-gray-200 animate-pulse rounded-md" />
              <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded-md" />
            </div>

            <div className="h-14 md:h-16 w-full bg-gray-200 animate-pulse rounded-xl md:rounded-2xl mt-auto" />
          </div>
        </div>

        <hr className="mb-10 md:mb-16 border-gray-100" />

        {/* 2. REVIEWS SKELETON */}
        <div className="mb-12 md:mb-20">
          <div className="h-6 md:h-8 w-40 md:w-48 bg-gray-200 animate-pulse rounded-xl mb-6 md:mb-8" />
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
            <div className="w-full lg:w-1/3 h-64 md:h-80 bg-gray-100 animate-pulse rounded-2xl md:rounded-[2rem]" />
            <div className="w-full lg:w-2/3 space-y-4 md:space-y-6">
               <div className="w-full h-24 md:h-32 bg-gray-50 animate-pulse rounded-2xl md:rounded-[2rem]" />
               <div className="w-full h-24 md:h-32 bg-gray-50 animate-pulse rounded-2xl md:rounded-[2rem]" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </section>
  );
}