"use server";

import { createClient } from "@/lib/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function generateAprioriRules(minSupport = 0.05, minConfidence = 0.3) {
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

    // Gunakan service role BUKAN untuk user, melainkan untuk kalkulasi agregasi apriori yang butuh akses penuh tanpa terhambat RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const adminSupabase = createSupabaseClient(supabaseUrl, supabaseKey);

    // 1. Tarik data order dan order_items yang sukses
    const { data: orders, error } = await adminSupabase
      .from("orders")
      .select("id, order_items(product_name)")
      .eq("status", "delivered");

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!orders || orders.length === 0) return { success: true, totalRules: 0 };

    const numTransactions = orders.length;

    // 2. Bentuk "Keranjang Belanja" (Daftar produk unik per transaksi)
    const baskets = orders.map((order) => {
      const items = order.order_items as unknown as Array<{ product_name: string }>;
      // Gunakan Set untuk menghapus duplikat produk dalam 1 transaksi (qty tidak dihitung dalam Apriori)
      return Array.from(new Set(items.map((item) => item.product_name)));
    }).filter((basket) => basket.length > 1); // Abaikan transaksi yang hanya beli 1 produk

    // 3. Hitung Frekuensi
    const itemFrequencies: Record<string, number> = {};
    const pairFrequencies: Record<string, number> = {};

    baskets.forEach((basket) => {
      // Hitung kemunculan 1 produk
      basket.forEach((item) => {
        itemFrequencies[item] = (itemFrequencies[item] || 0) + 1;
      });

      // Hitung kemunculan kombinasi 2 produk
      for (let i = 0; i < basket.length; i++) {
        for (let j = i + 1; j < basket.length; j++) {
          const pair = [basket[i], basket[j]].sort(); // Sortir agar A-B sama dengan B-A
          const pairKey = `${pair[0]}|${pair[1]}`;
          pairFrequencies[pairKey] = (pairFrequencies[pairKey] || 0) + 1;
        }
      }
    });

    // 4. Hitung Support & Confidence
    const rules = [];

    for (const [pairKey, pairCount] of Object.entries(pairFrequencies)) {
      const support = pairCount / numTransactions;
      
      // Jika kombinasi sering dibeli melebihi batas minimum Support
      if (support >= minSupport) {
        const [itemA, itemB] = pairKey.split("|");

        // Hitung Confidence A -> B (Jika beli A, seberapa sering beli B)
        const confAB = pairCount / itemFrequencies[itemA];
        if (confAB >= minConfidence) {
          rules.push({ product_a: itemA, product_b: itemB, support, confidence: confAB });
        }

        // Hitung Confidence B -> A (Jika beli B, seberapa sering beli A)
        const confBA = pairCount / itemFrequencies[itemB];
        if (confBA >= minConfidence) {
          rules.push({ product_a: itemB, product_b: itemA, support, confidence: confBA });
        }
      }
    }

    // 5. Simpan Hasil ke Database
    if (rules.length > 0) {
      // Hapus aturan lama (hapus semua data di tabel)
      await adminSupabase.from("apriori_rules").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      // Masukkan aturan baru
      const { error: insertError } = await adminSupabase.from("apriori_rules").insert(rules);
      if (insertError) throw new Error(insertError.message);
    }

    return { success: true, totalRules: rules.length };

  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
    console.error("Apriori Error:", errMessage);
    return { success: false, error: errMessage };
  }
}