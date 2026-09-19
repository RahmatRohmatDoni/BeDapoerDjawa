import { Metadata } from "next";
import MainPageClient from "@/components/home/MainPageClient";
import { Footer } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "DapoerDjawa | Toko Kue Kering Premium Balikpapan",
  description: "Nikmati aneka kue kering premium khas rumahan dari DapoerDjawa Balikpapan. Tersedia Nastar, Kastengel, Putri Salju, dan varian cookies lezat lainnya.",
  keywords: ["kue kering balikpapan", "nastar premium", "dapoerdjawa", "toko kue balikpapan", "kue lebaran"],
  openGraph: {
    title: "DapoerDjawa - Toko Kue Kering Premium",
    description: "Aneka kue kering premium khas rumahan dari DapoerDjawa Balikpapan.",
    url: "https://dapoerdjawa.com",
    siteName: "DapoerDjawa",
    images: [{ url: "/logo.png", width: 800, height: 600 }],
    locale: "id_ID",
    type: "website",
  },
};

export default function MainPage() {
  return <MainPageClient />;
}

// Komponen helper skeleton
const Sk = ({ c }: { c: string }) => <div className={`bg-gray-200 animate-pulse ${c}`} />;

export function Loading() {
  return (
    <section className="bg-gray-50 pt-24 min-h-screen work-sans">
      <div className="container mx-auto px-4 md:px-0 max-w-[1600px] mb-8 md:mb-12">
        <Sk c="w-full h-48 md:h-120 rounded-xl md:rounded-2xl" />
      </div>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center pb-4 md:pb-6 border-b border-gray-300 mb-6 md:mb-10">
          <Sk c="h-6 md:h-8 w-32 md:w-44 rounded-xl" />
          <div className="flex gap-2 md:gap-3">
            <Sk c="w-8 h-8 md:w-10 md:h-10 rounded-full" />
            <Sk c="w-8 h-8 md:w-10 md:h-10 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 mb-12 md:mb-20">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-3 md:p-4 flex flex-col gap-3 md:gap-4 shadow-sm">
              <Sk c="w-full aspect-square rounded-lg md:rounded-xl" />
              <Sk c="h-4 md:h-5 w-3/4 rounded-md" />
              <Sk c="h-5 md:h-6 w-1/2 rounded-md mt-auto" />
            </div>
          ))}
        </div>
        <div className="py-10 md:py-16 border-t border-gray-200 max-w-4xl mx-auto">
          <Sk c="h-6 md:h-8 w-28 md:w-36 rounded-xl mb-4 md:mb-6" />
          <div className="space-y-2 md:space-y-3">
            <Sk c="h-3 md:h-4 w-full rounded-md" />
            <Sk c="h-3 md:h-4 w-full rounded-md" />
            <Sk c="h-3 md:h-4 w-4/5 rounded-md" />
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
}