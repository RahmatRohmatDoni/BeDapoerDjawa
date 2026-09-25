"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { type Session } from "@supabase/supabase-js"; // Tambahan import tipe Session
import { useStoreSettings } from "@/lib/store-settings-context";

// =========================================================
// TYPES
// =========================================================

type UserRole = "owner" | "admin" | "user";

type DatabaseUser = {
  role: UserRole | null;
};

// =========================================================
// SOCIAL MEDIA & FOOTER
// =========================================================

export const Footer = () => {
  const storeSettings = useStoreSettings();
  
  const socialLinks = [
    { href: storeSettings.contact_instagram || "#", img: "/instagram.png", alt: `Instagram ${storeSettings.store_name}` },
    { href: storeSettings.contact_tiktok || "#", img: "/tiktok.png", alt: `TikTok ${storeSettings.store_name}` },
    { href: `https://wa.me/${storeSettings.contact_whatsapp}` || "#", img: "/wa.png", alt: `WhatsApp ${storeSettings.store_name}` },
  ];

  return (
    <footer className="mt-auto w-full border-t border-gray-200 bg-gray-50 py-10">
      <div className="container mx-auto flex flex-col items-center justify-between px-6 md:flex-row">
        <p className="mb-4 text-center text-sm text-gray-600 md:mb-0 md:text-left">
          {storeSettings.footer_copyright}
        </p>
        <div className="flex items-center gap-6">
          {socialLinks.map(({ href, img, alt }) => (
            <a key={alt} href={href} target="_blank" rel="noopener noreferrer" aria-label={alt} className="transition-transform hover:scale-110">
              <Image src={img} alt={alt} width={32} height={32} className="h-8 w-8" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

// =========================================================
// NAVBAR
// =========================================================

export default function Navbar() {
  const storeSettings = useStoreSettings();
  const [auth, setAuth] = useState({ isLoggedIn: false, canAccessDashboard: false });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Perbaikan: Mengganti (session: any) menjadi (session: Session | null)
    const updateAuth = async (session: Session | null) => {
      if (!session?.user) {
        if (isMounted) setAuth({ isLoggedIn: false, canAccessDashboard: false });
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("email", session.user.email)
          .maybeSingle<DatabaseUser>();

        if (error) throw error;

        const role = data?.role?.toLowerCase() || "user";
        
        if (isMounted) {
          setAuth({
            isLoggedIn: true,
            canAccessDashboard: role === "owner" || role === "admin",
          });
        }
      } catch (error) {
        console.error("Gagal mengambil status login/role:", error);
        if (isMounted) setAuth({ isLoggedIn: true, canAccessDashboard: false }); 
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => updateAuth(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateAuth(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <nav id="header" className="fixed top-0 z-50 w-full bg-white/95 py-3 md:py-5 shadow-sm backdrop-blur-lg transition-all duration-300">
      <div className="container relative mx-auto flex w-full flex-wrap items-center justify-between px-4 md:px-6">

        {/* KIRI: HAMBURGER & MENU */}
        <div className="z-20 flex flex-1 items-center justify-start">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="block cursor-pointer rounded-lg p-2 text-gray-700 hover:bg-gray-100 hover:text-black md:hidden transition-colors"
            aria-label="Toggle Menu"
            aria-expanded={isMenuOpen}
          >
            <div className="relative h-5 w-6">
              <span className={`absolute left-0 block h-0.5 w-full bg-current transition-all duration-300 ${isMenuOpen ? "top-2 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-2 block h-0.5 w-full bg-current transition-all duration-300 ${isMenuOpen ? "opacity-0" : "opacity-100"}`} />
              <span className={`absolute left-0 block h-0.5 w-full bg-current transition-all duration-300 ${isMenuOpen ? "top-2 -rotate-45" : "top-4"}`} />
            </div>
          </button>

          <ul className="hidden md:flex flex-row items-center gap-8 text-sm font-semibold text-gray-600">
            <li><Link href="/#shop" className="transition duration-200 hover:text-black">Shop</Link></li>
            <li><Link href="/#about" className="transition duration-200 hover:text-black">About</Link></li>
          </ul>
        </div>

        {/* MENU MOBILE OVERLAY */}
        <div 
          className={`absolute left-0 top-full -z-10 w-full transform border-b border-gray-100 bg-white/95 px-4 pb-6 pt-4 shadow-lg backdrop-blur-lg transition-all duration-300 ease-in-out md:hidden ${
            isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0 pointer-events-none"
          }`}
        >
          <ul className="flex flex-col items-center gap-6 text-base font-semibold text-gray-700">
            <li className="w-full">
              <Link href="/#shop" onClick={() => setIsMenuOpen(false)} className="block w-full rounded-xl bg-gray-50 py-3 text-center transition hover:bg-gray-100 hover:text-black">
                Shop
              </Link>
            </li>
            <li className="w-full">
              <Link href="/#about" onClick={() => setIsMenuOpen(false)} className="block w-full rounded-xl bg-gray-50 py-3 text-center transition hover:bg-gray-100 hover:text-black">
                About
              </Link>
            </li>
          </ul>
        </div>

        {/* TENGAH: LOGO */}
        <div className="absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
            <Image src={storeSettings.store_logo_url || "/logo.png"} alt={`Logo ${storeSettings.store_name}`} width={40} height={40} priority className="h-9 w-auto md:h-11 drop-shadow-sm" />
            <span className="hidden whitespace-nowrap text-xl font-extrabold tracking-tight text-gray-900 sm:block md:text-2xl">{storeSettings.store_name}</span>
          </Link>
        </div>

        {/* KANAN: ICONS */}
        <div className="z-20 flex flex-1 items-center justify-end gap-1 md:gap-3">
          
          {auth.canAccessDashboard && (
            <Link href="/dashboard" className="rounded-full p-2.5 text-gray-600 transition-all hover:bg-gray-100 hover:text-black active:scale-95" title="Dashboard Analytics" aria-label="Dashboard Analytics">
              <svg className="fill-current" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
              </svg>
            </Link>
          )}

          <Link href={auth.isLoggedIn ? "/profile" : "/login"} className="rounded-full p-2.5 text-gray-600 transition-all hover:bg-gray-100 hover:text-black active:scale-95" title={auth.isLoggedIn ? "Profil Akun" : "Masuk / Daftar"} aria-label={auth.isLoggedIn ? "Profil Akun" : "Masuk atau Daftar"}>
            <svg className="fill-current" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="7" r="3" fill="none" />
              <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5S14.757 2 12 2zM12 10c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3S13.654 10 12 10zM21 21v-1c0-3.859-3.141-7-7-7h-4c-3.86 0-7 3.141-7 7v1h2v-1c0-2.757 2.243-5 5-5h4c2.757 0 5 2.243 5 5v1H21z" />
            </svg>
          </Link>

          <Link href="/cart" className="rounded-full p-2.5 text-gray-600 transition-all hover:bg-gray-100 hover:text-black active:scale-95" title="Keranjang Belanja" aria-label="Keranjang Belanja">
            <svg className="fill-current" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21,7H7.462L5.91,3.586C5.748,3.229,5.392,3,5,3H2v2h2.356L9.09,15.414C9.252,15.771,9.608,16,10,16h8c.4,0 .762-.238 .919-.606l3-7c.133-.309 .101-.663-.084-.944C21.649,7.169,21.336,7,21,7zM17.341,14h-6.697L8.371,9h11.112L17.341,14z" />
              <circle cx="10.5" cy="18.5" r="1.5" />
              <circle cx="17.5" cy="18.5" r="1.5" />
            </svg>
          </Link>
          
        </div>
      </div>
    </nav>
  );
}