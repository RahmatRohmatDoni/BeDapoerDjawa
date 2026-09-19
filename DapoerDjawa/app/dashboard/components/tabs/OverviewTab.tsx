"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TrendingUp, ShoppingBag, Package, Box, Download, Sparkles, RefreshCw, ArrowUpRight, ChevronDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";

type TimeFrame = "daily" | "weekly" | "monthly";

interface ChartDataItem {
  name: string;
  revenue: number;
}

interface OverviewTabProps {
  initialStats: {
    totalRevenue?: number;
    totalOrders?: number;
    totalProducts?: number;
    chartData?: {
      daily?: ChartDataItem[];
      weekly?: ChartDataItem[];
      monthly?: ChartDataItem[];
    };
    topProducts?: Array<{ nama: string; terjual: number; harga: string; gambar?: string }>;
    activeRulesCount?: number;
    aprioriRules?: Array<{
      product_a: string;
      product_b: string;
      support: number;
      confidence: number;
      image_a?: string;
      image_b?: string;
    }>;
  };
}

interface JsPDFCustom extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export default function OverviewTab({ initialStats }: OverviewTabProps) {
  const router = useRouter();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("monthly");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState(initialStats);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch dashboard stats dari backend NestJS
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/analytics/dashboard`, {
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data);
        }
      } catch (err) {
        console.error("Gagal memuat statistik dashboard:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const {
    totalRevenue = 0,
    totalOrders = 0,
    totalProducts = 0,
    chartData,
    topProducts = [],
    activeRulesCount = 0,
    aprioriRules = [],
  } = stats;

  const [isLoadingApriori, setIsLoadingApriori] = useState(false);
  const [currentRulesCount, setCurrentRulesCount] = useState(activeRulesCount);
  const [showAprioriResults, setShowAprioriResults] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getActiveChartData = (): ChartDataItem[] => {
    if (!chartData) return [];
    if (Array.isArray(chartData)) return chartData;
    return chartData[timeFrame] || [];
  };

  const activeChart = getActiveChartData();

  const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const summaryCards = [
    {
      title: "Total Pendapatan",
      value: formatRupiah(totalRevenue),
      subtext: "Omset berhasil lunas",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      badge: "+12.5%",
      badgeColor: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Pesanan Sukses",
      value: totalOrders.toLocaleString("id-ID"),
      subtext: "Transaksi delivered",
      icon: ShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      badge: "Selesai",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      title: "Aturan Bundling",
      value: currentRulesCount.toString(),
      subtext: "Pola paket Apriori",
      icon: Package,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      badge: "Aktif",
      badgeColor: "bg-amber-100 text-amber-700",
    },
    {
      title: "Total Produk",
      value: totalProducts.toString(),
      subtext: "Katalog varian toko",
      icon: Box,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      badge: "Siap Jual",
      badgeColor: "bg-purple-100 text-purple-700",
    },
  ];

  const handleRunApriori = async () => {
    setIsLoadingApriori(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/analytics/apriori`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ minSupport: 0.05, minConfidence: 0.3 }),
      });
      const res = await response.json();
      if (res.success && typeof res.totalRules === "number") {
        setCurrentRulesCount(res.totalRules);
        setShowAprioriResults(true);
        toast.success(`Berhasil! Ditemukan ${res.totalRules} rekomendasi bundling terbaru.`);
        
        // Refresh the page data so the newly generated rules appear in aprioriRules
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/analytics/dashboard`, {
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData);
        }
      } else {
        toast.error(`Gagal memproses rekomendasi: ${res.error}`);
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses data.");
    } finally {
      setIsLoadingApriori(false);
    }
  };

  const handleExportPDF = (mode: TimeFrame) => {
    setShowExportMenu(false);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const printDate = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date());

    const periodLabelMap: Record<TimeFrame, string> = {
      daily: "Harian",
      weekly: "Mingguan",
      monthly: "Bulanan"
    };
    const periodText = periodLabelMap[mode];

    const periodChartData = chartData?.[mode] || [];
    const periodRevenue = periodChartData.length > 0 
      ? periodChartData.reduce((acc, curr) => acc + (curr.revenue || 0), 0)
      : totalRevenue;

    // Header Background
    doc.setFillColor(30, 41, 59); // Slate-800 for a more professional look
    doc.rect(0, 0, pageWidth, 35, "F");
    
    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(`LAPORAN KINERJA DAPOER DJAWA`, 14, 20);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text(`Periode: ${periodText} | Dicetak: ${printDate}`, 14, 28);

    // Summary Section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Eksekutif", 14, 48);

    autoTable(doc, {
      startY: 52,
      theme: "grid",
      head: [["Total Pendapatan", "Pesanan Sukses", "Total Varian Produk", "Bundling Aktif"]],
      body: [[
        formatRupiah(periodRevenue),
        `${totalOrders} Transaksi`,
        `${totalProducts} Item`,
        `${currentRulesCount} Paket`
      ]],
      styles: { fontSize: 11, cellPadding: 6, font: "helvetica", halign: "center", lineColor: [226, 232, 240], lineWidth: 0.5 },
      headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
      bodyStyles: { textColor: [15, 23, 42], fontStyle: "bold", fontSize: 12 },
    });

    let finalY = (doc as JsPDFCustom).lastAutoTable.finalY + 15;

    // Rincian Transaksi
    if (periodChartData.length > 0) {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Rincian Transaksi (${periodText})`, 14, finalY);

      const chartRows = periodChartData.map((item) => [
        item.name,
        formatRupiah(item.revenue),
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [[mode === "daily" ? "Tanggal" : mode === "weekly" ? "Minggu" : "Bulan", "Pendapatan Bersih"]],
        body: chartRows,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.1 },
        headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        bodyStyles: { textColor: [51, 65, 85] },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { fontStyle: "bold", halign: "right", textColor: [5, 150, 105] },
        },
      });

      finalY = (doc as JsPDFCustom).lastAutoTable.finalY + 15;
    }

    // Peringkat Produk Terlaris
    if (finalY > pageHeight - 60) {
      doc.addPage();
      finalY = 20;
    }

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Peringkat Produk Terlaris (Top 5)", 14, finalY);

    const topProductsData = topProducts.map((p, index) => [
      `#${index + 1}`,
      p.nama,
      `${p.terjual} pcs`,
      p.harga,
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [["Peringkat", "Nama Produk", "Total Terjual", "Harga Satuan"]],
      body: topProductsData,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      bodyStyles: { textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { fontStyle: "bold", halign: "center", cellWidth: 30 },
        1: { cellWidth: "auto" },
        2: { fontStyle: "bold", halign: "center", cellWidth: 40 },
        3: { halign: "right", cellWidth: 45 },
      },
    });

    // Apriori Rules
    if (aprioriRules.length > 0) {
      finalY = (doc as JsPDFCustom).lastAutoTable.finalY + 15;
      
      if (finalY > pageHeight - 60) {
        doc.addPage();
        finalY = 20;
      }

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Rekomendasi Bundling (Berdasarkan Pola Belanja)", 14, finalY);

      const aprioriData = aprioriRules.slice(0, 10).map((r, i) => [
        `Paket ${i + 1}`,
        `${r.product_a}  +  ${r.product_b}`,
        `${(r.confidence * 100).toFixed(0)}%`,
        `${(r.support * 100).toFixed(1)}%`
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [["ID Paket", "Kombinasi Produk (Item A + Item B)", "Tingkat Keyakinan", "Porsi Transaksi"]],
        body: aprioriData,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.1 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        bodyStyles: { textColor: [51, 65, 85] },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 30, halign: "center" },
          1: { cellWidth: "auto" },
          2: { fontStyle: "bold", halign: "center", textColor: [5, 150, 105], cellWidth: 45 },
          3: { halign: "center", cellWidth: 40 },
        },
      });
    }

    doc.save(`Laporan_DapoerDjawa_${periodText}_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Container Toast untuk menampilkan notifikasi */}
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Ringkasan Bisnis</h2>
          <p className="text-sm text-gray-500">Pantau performa penjualan dan hasil rekomendasi algoritma Apriori.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunApriori}
            disabled={isLoadingApriori}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50 active:scale-95"
          >
            {isLoadingApriori ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isLoadingApriori ? "Memproses..." : "Rekomendasi Bundling"}
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              <Download className="h-4 w-4" />
              Cetak PDF
              <ChevronDown className={`h-4 w-4 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-40 origin-top-right overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg outline-none z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase">Pilih Periode</div>
                <button 
                  onClick={() => handleExportPDF("daily")} 
                  className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  Laporan Harian
                </button>
                <button 
                  onClick={() => handleExportPDF("weekly")} 
                  className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  Laporan Mingguan
                </button>
                <button 
                  onClick={() => handleExportPDF("monthly")} 
                  className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  Laporan Bulanan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className={`relative overflow-hidden rounded-2xl border ${stat.borderColor} bg-white p-5 shadow-xs transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${stat.badgeColor}`}>
                  {stat.badge}
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500">{stat.title}</p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{stat.value}</h3>
                <p className="mt-1 text-[11px] text-gray-400">{stat.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Grafik Pendapatan Penjualan</h3>
              <p className="text-xs text-gray-500">Tren statistik pemasukan berdasarkan rentang waktu terpilih</p>
            </div>
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              {(["daily", "weekly", "monthly"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTimeFrame(mode)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    timeFrame === mode ? "bg-white text-amber-700 shadow-xs" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {mode === "daily" ? "Harian" : mode === "weekly" ? "Mingguan" : "Bulanan"}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeChart} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(val) => (Number(val) >= 1000000 ? `Rp${Number(val) / 1000000}M` : `Rp${Number(val) / 1000}k`)}
                  dx={-5}
                />
                <Tooltip
                  formatter={(value) => [formatRupiah(Number(value ?? 0)), "Pendapatan"]}
                  labelStyle={{ color: "#1f2937", fontWeight: "bold" }}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #f3f4f6", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.05)" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorPendapatan)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <h3 className="mb-1 text-lg font-bold text-gray-900">Produk Terlaris</h3>
          <p className="mb-6 text-xs text-gray-500">Peringkat 5 kue favorit pembeli</p>
          <div className="space-y-5">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product.nama} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xs font-extrabold text-amber-700">
                      #{index + 1}
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shadow-xs">
                      {product.gambar ? (
                        <Image src={product.gambar} alt={product.nama} width={44} height={44} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-gray-400">{product.nama.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{product.nama}</p>
                      <p className="text-xs font-medium text-gray-400">{product.harga}</p>
                    </div>
                  </div>
                  <div className="ml-2 text-right whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">{product.terjual}</span>
                    <span className="ml-1 text-xs text-gray-500">pcs</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Belum ada data penjualan.</p>
            )}
          </div>
        </div>
      </div>

      {showAprioriResults && aprioriRules.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-xs">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Rekomendasi Bundling Aktif (Hasil Apriori)</h3>
              <p className="text-xs text-gray-500">Strategi paket produk otomatis dari riwayat transaksi</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aprioriRules.slice(0, 6).map((rule, idx) => (
              <div key={idx} className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 transition-all hover:border-amber-200 hover:bg-amber-50">
                <div className="text-xs font-bold tracking-wide text-amber-700 uppercase">Paket Bundling #{idx + 1}</div>
                <div className="my-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-xs">
                    {rule.image_a ? (
                      <Image src={rule.image_a} alt={rule.product_a} width={48} height={48} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-base font-bold text-amber-700">{rule.product_a.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 text-xs font-bold">+</div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-xs">
                    {rule.image_b ? (
                      <Image src={rule.image_b} alt={rule.product_b} width={48} height={48} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-base font-bold text-amber-700">{rule.product_b.charAt(0)}</span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {rule.product_a} <span className="text-amber-600">+</span> {rule.product_b}
                </div>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>
                    <span className="font-bold text-emerald-600">{(rule.confidence * 100).toFixed(0)}%</span> pembeli <strong>{rule.product_a}</strong> juga membeli <strong>{rule.product_b}</strong>.
                  </p>
                  <p className="text-[10px] text-gray-400">*Muncul di {(rule.support * 100).toFixed(1)}% total transaksi.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}