"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type StoreSettings = Record<string, string>;

const StoreSettingsContext = createContext<StoreSettings>({});

const DEFAULTS: StoreSettings = {
  store_name: "DapoerDjawa",
  store_tagline: "Toko Kue Kering Premium Balikpapan",
  store_description: "Toko kue kering yang menyediakan berbagai pilihan cookies dan kue berkualitas.",
  store_logo_url: "/logo.png",
  store_domain: "https://dapoerdjawa.com",
  contact_whatsapp: "62895383270632",
  contact_instagram: "https://instagram.com/_dapoer_djawa",
  contact_tiktok: "https://tiktok.com/@dapoer_djawa",
  contact_address: "Jl. Nuri IV, Perum BDS 2 Blok J1/38, Gunung Bahagia, Balikpapan Selatan",
  contact_phone: "+628111222333",
  about_text: "",
  seo_title: "DapoerDjawa",
  seo_keywords: "",
  footer_copyright: "© 2026 DapoerDjawa. All rights reserved.",
};

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/settings/store`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object" && !data.error) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <StoreSettingsContext.Provider value={settings}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
