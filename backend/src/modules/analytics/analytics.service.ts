import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.config';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private supabaseService: SupabaseService) {}

  async getDashboardStats() {
    try {
      const supabase = this.supabaseService.adminClient;

      // 1. Total produk
      const { count: totalProductsCount } = await supabase
        .from('produk')
        .select('*', { count: 'exact', head: true });

      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, grand_total, created_at, order_items(product_name, price, qty)')
        .eq('status', 'delivered');

      const { data: rulesData } = await supabase
        .from('apriori_rules')
        .select('product_a, product_b, support, confidence')
        .order('confidence', { ascending: false });

      const { data: variantsData, error: variantError } = await supabase
        .from('produk_varian')
        .select('img, produk(nama_produk)');

      if (variantError) this.logger.error('Error ambil relasi produk_varian:', variantError.message);
      if (error) return { success: false, error: 'Gagal mengambil data pesanan' };

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
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

      const dailyMap = new Map<string, { dateLabel: string; revenue: number; rawDate: Date }>();
      const weeklyMap = new Map<string, { label: string; revenue: number; rawDate: Date }>();
      const monthlyMap = new Map<string, { label: string; revenue: number; rawDate: Date }>();
      const productCounts: Record<string, { nama: string; terjual: number; harga: string }> = {};

      orders.forEach((order) => {
        const revenue = Number(order.grand_total) || 0;
        totalRevenue += revenue;
        const date = new Date(order.created_at);

        const dayKey = date.toISOString().split('T')[0];
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
            const formattedPrice = `Rp ${new Intl.NumberFormat('id-ID').format(Number(item.price))}`;
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
      const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
      this.logger.error('Dashboard Exception:', errorMessage);
      return { success: false, error: 'Gagal memuat dashboard analitik' };
    }
  }

  async generateAprioriRules(minSupport = 0.05, minConfidence = 0.3) {
    try {
      const supabase = this.supabaseService.adminClient;

      // 1. Tarik data order dan order_items yang sukses
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, order_items(product_name)')
        .eq('status', 'delivered');

      if (error) throw new Error(`Supabase error: ${error.message}`);
      if (!orders || orders.length === 0) return { success: true, totalRules: 0 };

      const numTransactions = orders.length;

      // 2. Bentuk "Keranjang Belanja" (Semua order)
      const allBaskets = orders.map((order) => {
        const items = order.order_items as unknown as Array<{ product_name: string }>;
        return Array.from(new Set(items.map((item) => item.product_name)));
      });

      // 3. Hitung Frekuensi Item Tunggal (Harus dari SEMUA transaksi)
      const itemFrequencies: Record<string, number> = {};
      allBaskets.forEach((basket) => {
        basket.forEach((item) => {
          itemFrequencies[item] = (itemFrequencies[item] || 0) + 1;
        });
      });

      // 4. Hitung Frekuensi Pasangan (Hanya perlu cek keranjang dengan > 1 item)
      const pairFrequencies: Record<string, number> = {};
      const validBaskets = allBaskets.filter((basket) => basket.length > 1);

      validBaskets.forEach((basket) => {
        for (let i = 0; i < basket.length; i++) {
          for (let j = i + 1; j < basket.length; j++) {
            const pair = [basket[i], basket[j]].sort();
            const pairKey = `${pair[0]}|${pair[1]}`;
            pairFrequencies[pairKey] = (pairFrequencies[pairKey] || 0) + 1;
          }
        }
      });

      // 5. Hitung Support & Confidence
      const rules: Array<{ product_a: string; product_b: string; support: number; confidence: number }> = [];

      for (const [pairKey, pairCount] of Object.entries(pairFrequencies)) {
        const support = pairCount / numTransactions;

        if (support >= minSupport) {
          const [itemA, itemB] = pairKey.split('|');

          const confAB = pairCount / itemFrequencies[itemA];
          if (confAB >= minConfidence) {
            rules.push({ product_a: itemA, product_b: itemB, support, confidence: confAB });
          }

          const confBA = pairCount / itemFrequencies[itemB];
          if (confBA >= minConfidence) {
            rules.push({ product_a: itemB, product_b: itemA, support, confidence: confBA });
          }
        }
      }

      // 5. Simpan Hasil ke Database
      if (rules.length > 0) {
        await supabase.from('apriori_rules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error: insertError } = await supabase.from('apriori_rules').insert(rules);
        if (insertError) throw new Error(insertError.message);
      }

      return { success: true, totalRules: rules.length };
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      this.logger.error('Apriori Error:', errMessage);
      return { success: false, error: 'Gagal generate rule apriori' };
    }
  }
}

