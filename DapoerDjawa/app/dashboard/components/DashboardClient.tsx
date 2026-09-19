"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "./Sidebar";
import OverviewTab from "./tabs/OverviewTab";
import ProductsTab from "./tabs/ProductsTab";
import OrdersTab from "./tabs/OrdersTab";
import SettingsTab from "./tabs/SettingsTab";

export interface DashboardStats {
  success: boolean;
  totalRevenue?: number;
  totalOrders?: number;
  totalProducts?: number; // Properti baru
  chartData?: {
    daily?: { name: string; revenue: number }[];
    weekly?: { name: string; revenue: number }[];
    monthly?: { name: string; revenue: number }[];
  };
  topProducts?: { nama: string; terjual: number; harga: string; gambar?: string }[];
  activeRulesCount?: number;
  aprioriRules?: Array<{
    product_a: string;
    product_b: string;
    support: number;
    confidence: number;
    image_a?: string;
    image_b?: string;
  }>;
  error?: string;
}

interface DashboardClientProps {
  initialStats: DashboardStats;
}

type Role = "admin" | "owner";

type Tab = "overview" | "products" | "orders" | "settings";

export default function DashboardClient({ initialStats }: DashboardClientProps) {
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isMounted) router.replace("/login");
          return;
        }

        const email = session.user.email;
        if (!email) {
          if (isMounted) router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("role")
          .eq("email", email)
          .maybeSingle();

        if (profileError || !profile) {
          if (isMounted) router.replace("/login");
          return;
        }

        if (profile.role !== "admin" && profile.role !== "owner") {
          if (isMounted) router.replace("/login");
          return;
        }

        if (!isMounted) return;

        const userRole = profile.role as Role;
        setRole(userRole);

        if (userRole === "owner") {
          setActiveTab("overview");
        } else {
          setActiveTab("orders");
        }
      } catch (error) {
        console.error("Terjadi kesalahan saat memeriksa akses dashboard:", error);
        if (isMounted) router.replace("/login");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void checkAccess();
    return () => { isMounted = false; };
  }, [router]);

  const handleSetActiveTab = (tab: string) => {
    if (!role) return;
    const requestedTab = tab as Tab;

    if (role === "admin") {
      if (requestedTab === "products" || requestedTab === "orders") {
        setActiveTab(requestedTab);
        return;
      }
      setActiveTab("orders");
      return;
    }

    if (role === "owner") {
      if (
        requestedTab === "overview" ||
        requestedTab === "products" ||
        requestedTab === "orders" ||
        requestedTab === "settings"
      ) {
        setActiveTab(requestedTab);
        return;
      }
      setActiveTab("overview");
    }
  };

  if (isLoading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500 font-medium flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          Memeriksa akses keamanan...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 pt-24 md:pt-32 pb-16 flex flex-col md:flex-row gap-4 md:gap-8">
      <Sidebar
        role={role}
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
      />

      <div className="flex-1 flex flex-col min-h-0 w-full">
        {activeTab === "overview" && role === "owner" && <OverviewTab initialStats={initialStats} />}
        {activeTab === "products" && (role === "owner" || role === "admin") && <ProductsTab />}
        {activeTab === "orders" && (role === "owner" || role === "admin") && <OrdersTab />}
        {activeTab === "settings" && role === "owner" && <SettingsTab />}
      </div>
    </div>
  );
}