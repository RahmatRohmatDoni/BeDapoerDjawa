"use client";

import { Role, Tab } from "@/types/dashboard";

interface SidebarProps {
  role: Role;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

// Konfigurasi item navigasi berdasarkan role pengguna.
// Didefinisikan di luar komponen agar tidak di-re-create pada setiap re-render.
const NAV_ITEMS: { id: Tab; label: string; roles: Role[] }[] = [
  { id: "overview", label: "Ringkasan", roles: ["owner"] },
  { id: "orders", label: "Pesanan", roles: ["owner", "admin"] },
  { id: "products", label: "Katalog Produk", roles: ["owner", "admin"] },
  { id: "settings", label: "Pengaturan Toko", roles: ["owner"] },
];

export default function Sidebar({ role, activeTab, setActiveTab }: SidebarProps) {
  return (
    // Penambahan `h-fit` dan `self-start` mengunci tinggi sidebar sebatas kontennya
    // dan mencegah flexbox parent memanjangkannya ke bawah secara otomatis.
    <aside className="h-fit self-start w-full md:w-64 flex-shrink-0 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      {/* Informasi role aktif pengguna */}
      <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Role Sesi</p>
        <p className="text-sm font-bold text-gray-800 capitalize">{role}</p>
      </div>

      <nav className="flex md:flex-col gap-1 overflow-x-auto">
        {/* Filtering menu UI di client-side sesuai dengan role pengguna yang aktif */}
        {NAV_ITEMS
          .filter((item) => item.roles.includes(role))
          .map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
      </nav>
    </aside>
  );
}