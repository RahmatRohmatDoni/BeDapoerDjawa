import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import FloatingCart from "@/components/layout/FloatingCart";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toast";
import QueryProvider from "@/components/providers/QueryProvider";
import { STORE_NAME, STORE_DESCRIPTION, STORE_DOMAIN } from "@/lib/store-defaults";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const inter = Inter({ subsets: ["latin"] });

// Base fallback metadata. Template dihapus agar SEO bisa manual per halaman.
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production" ? STORE_DOMAIN : "http://localhost:3000"
  ),
  title: STORE_NAME,
  description: STORE_DESCRIPTION,
  keywords: [STORE_NAME, "toko kue", "kue kering", "cookies"],
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={cn("font-sans", geist.variable)}
      data-scroll-behavior="smooth" 
    >
      <body className={`${inter.className} font-normal text-gray-800 antialiased overflow-y-scroll`} suppressHydrationWarning>
        <QueryProvider>
          <Navbar /> 
          {children}
          <FloatingCart />
          <Toaster /> 
        </QueryProvider>
      </body>
    </html>
  );
}