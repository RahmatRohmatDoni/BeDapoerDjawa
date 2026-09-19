import DashboardClient from "@/app/dashboard/components/DashboardClient";

export const metadata = {
  title: "Dashboard | Dapoer Djawa",
  description: "Panel manajemen produk dan pesanan Dapoer Djawa.",
};

async function fetchDashboardStats() {
  try {
    // Server-side fetch ke backend NestJS — perlu service role key karena tidak ada user session di SSR
    // Untuk sementara, kirim initial stats kosong dan biarkan client-side fetch
    return {
      success: true,
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      chartData: { daily: [], weekly: [], monthly: [] },
      topProducts: [],
      activeRulesCount: 0,
      aprioriRules: [],
    };
  } catch {
    return {
      success: false,
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      chartData: { daily: [], weekly: [], monthly: [] },
      topProducts: [],
      activeRulesCount: 0,
      aprioriRules: [],
    };
  }
}

export default async function DashboardPage() {
  const stats = await fetchDashboardStats();
  return (
    <main className="w-full bg-gray-50 min-h-screen">
      <DashboardClient
        initialStats={
          stats as unknown as Parameters<typeof DashboardClient>[0]["initialStats"]
        }
      />
    </main>
  );
}