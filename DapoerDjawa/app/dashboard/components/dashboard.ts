"use server";

import { createClient } from "@/lib/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function getDashboardStats() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Unauthorized");
    }
    
    const { data: profile } = await supabase.from("users").select("role").eq("id_user", user.id).single();
    if (profile?.role !== "owner" && profile?.role !== "admin") {
      throw new Error("Forbidden");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const adminSupabase = createSupabaseClient(supabaseUrl, supabaseKey);

    // 1. Ambil jumlah total produk asli dari database
    const { count: totalProductsCount } = await adminSupabase
      .from("produk")
      .select("*", { count: "exact", head: true });

    const { data: orders, error } = await adminSupabase
      .from("orders")
      .select("id, grand_total, created_at, order_items(product_name, price, qty)")
      .eq("status", "delivered");

    const { data: rulesData } = await adminSupabase
      .from("apriori_rules")
      .select("product_a, product_b, support, confidence")
      .order("confidence", { ascending: false });

    const { data: variantsData, error: variantError } = await adminSupabase
      .from("produk_varian")
      .select("img, produk(nama_produk)");

    if (variantError) console.error("Error ambil relasi produk_varian:", variantError.message);
    if (error) return { success: false, error: "Gagal mengambil data analitik" };

    const totalProducts = totalProductsCount || 0;

    if (!orders || orders.length === 0) {
      return {
        success: true,
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts,
        chartData: { daily: [], weekly: [], monthly: [] },
        topProducts: [],
        activeRulesCount: 0,
        aprioriRules: [],
      };
    }

    const imageMap = new Map<string, string>();
    if (variantsData) {
      variantsData.forEach((variant: { img?: string | null; produk?: { nama_produk?: string } | { nama_produk?: string }[] | null }) => {
        const produkObj = Array.isArray(variant.produk) ? variant.produk[0] : variant.produk;
        const productName = produkObj?.nama_produk;

        if (productName && variant.img) {
          const cleanName = productName.trim().toLowerCase();
          if (!imageMap.has(cleanName)) {
            imageMap.set(cleanName, variant.img);
          }
        }
      });
    }

    let totalRevenue = 0;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

    const dailyMap = new Map<string, { dateLabel: string; revenue: number; rawDate: Date }>();
    const weeklyMap = new Map<string, { label: string; revenue: number; rawDate: Date }>();
    const monthlyMap = new Map<string, { label: string; revenue: number; rawDate: Date }>();
    const productCounts: Record<string, { nama: string; terjual: number; harga: string }> = {};

    orders.forEach((order) => {
      const revenue = Number(order.grand_total) || 0;
      totalRevenue += revenue;
      const date = new Date(order.created_at);

      const dayKey = date.toISOString().split("T")[0];
      const dayLabel = `${date.getDate()} ${monthNames[date.getMonth()]}`;
      if (!dailyMap.has(dayKey)) dailyMap.set(dayKey, { dateLabel: dayLabel, revenue: 0, rawDate: date });
      dailyMap.get(dayKey)!.revenue += revenue;

      const weekNum = Math.ceil(date.getDate() / 7);
      const weekKey = `${date.getFullYear()}-${date.getMonth()}-W${weekNum}`;
      const weekLabel = `M${weekNum} ${monthNames[date.getMonth()]}`;
      if (!weeklyMap.has(weekKey)) weeklyMap.set(weekKey, { label: weekLabel, revenue: 0, rawDate: date });
      weeklyMap.get(weekKey)!.revenue += revenue;

      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, { label: monthLabel, revenue: 0, rawDate: date });
      monthlyMap.get(monthKey)!.revenue += revenue;

      const items = order.order_items as unknown as Array<{ product_name: string; price: number | string; qty: number }>;
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const productName = item.product_name;
          const formattedPrice = `Rp ${new Intl.NumberFormat("id-ID").format(Number(item.price))}`;
          if (!productCounts[productName]) {
            productCounts[productName] = { nama: productName, terjual: 0, harga: formattedPrice };
          }
          productCounts[productName].terjual += Number(item.qty) || 0;
        });
      }
    });

    const daily = Array.from(dailyMap.values()).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime()).map((i) => ({ name: i.dateLabel, revenue: i.revenue }));
    const weekly = Array.from(weeklyMap.values()).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime()).map((i) => ({ name: i.label, revenue: i.revenue }));
    const monthly = Array.from(monthlyMap.values()).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime()).map((i) => ({ name: i.label, revenue: i.revenue }));

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.terjual - a.terjual)
      .slice(0, 5)
      .map((p) => ({ ...p, gambar: imageMap.get(p.nama.trim().toLowerCase()) }));

    const aprioriRules = (rulesData || []).map((rule) => ({
      ...rule,
      image_a: imageMap.get(rule.product_a.trim().toLowerCase()),
      image_b: imageMap.get(rule.product_b.trim().toLowerCase()),
    }));

    return {
      success: true,
      totalRevenue,
      totalOrders: orders.length,
      totalProducts,
      chartData: { daily, weekly, monthly },
      topProducts,
      activeRulesCount: aprioriRules.length,
      aprioriRules,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Dashboard Exception:", errorMessage);
    return { success: false, error: "Gagal memuat dashboard analitik" };
  }
}