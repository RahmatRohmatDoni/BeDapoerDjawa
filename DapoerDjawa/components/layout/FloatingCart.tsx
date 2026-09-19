"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingCart() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);

  // Jangan tampilkan di halaman checkout, keranjang, login, atau dashboard
  const hideOnPaths = ["/cart", "/checkout", "/login", "/dashboard"];
  const shouldHide = hideOnPaths.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: cartCount = 0 } = useQuery({
    queryKey: ["cartCount", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data, error } = await supabase
        .from("cart_items")
        .select("qty")
        .eq("user_id", userId);

      if (error) return 0;
      return (data || []).reduce((total, item) => total + (item.qty || 0), 0);
    },
    enabled: !!userId && !shouldHide,
    refetchInterval: 5000, // Polling ringan tiap 5 detik untuk sync
  });

  if (shouldHide || cartCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-6 right-6 z-[60] md:hidden"
      >
        <Link href="/cart" className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-xl hover:bg-gray-800 hover:shadow-2xl transition-all active:scale-95 border-2 border-white">
          <ShoppingBag className="h-6 w-6" />
          <motion.div 
            key={cartCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md border-2 border-white"
          >
            {cartCount > 99 ? "99+" : cartCount}
          </motion.div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}

