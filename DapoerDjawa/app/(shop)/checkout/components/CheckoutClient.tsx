"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Truck, CheckCircle, Loader2, AlertCircle, Search, Map } from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import { toast } from "@/components/ui/toast";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import FormField from "./FormField";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snap: any;
  }
}

// 1. TYPES & SCHEMAS
type DestinationResult = { id: string; name: string; label?: string };
type ShippingCourier = { id: string; name: string; price: number; estimasi: string; img: string };
type KomerceCostItem = {
  id?: string; code?: string; name?: string; description?: string; 
  cost?: number; price?: number; etd?: string; estimation?: string;
};

const checkoutSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").regex(/^[a-zA-Z\s]+$/, "Hanya boleh berisi huruf"),
  phone: z.string().min(10, "Minimal 10 angka").regex(/^[0-9]+$/, "Hanya masukkan angka"),
  postalCode: z.string().min(5, "Kode pos wajib 5 angka").regex(/^[0-9]{5}$/, "Harus 5 digit angka"),
  street: z.string().min(10, "Alamat terlalu singkat, lengkapi detail jalan/blok"),
  customerNote: z.string().optional(),
  destinationId: z.string().min(1, "Wajib memilih kecamatan tujuan"), 
  destinationLabel: z.string().min(1, "Wajib memilih kecamatan tujuan"),
  courierName: z.string().min(1, "Wajib memilih jasa kurir"),
  courierPrice: z.number().min(0),
});
type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// 2. MAIN COMPONENT
export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 600);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { register, handleSubmit, formState: { errors, isValid }, setValue, control } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange", 
    defaultValues: { name: "", phone: "", postalCode: "", street: "", customerNote: "", destinationId: "", destinationLabel: "", courierName: "", courierPrice: 0 },
  });

  const watchDestId = useWatch({ control, name: "destinationId" });
  const watchCourierPrice = useWatch({ control, name: "courierPrice" }) || 0;

  // FETCH: Data Order
  const { data: orderData, isLoading: isOrderLoading, isError } = useQuery({
    queryKey: ["draftOrder", orderId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Unauthenticated");

      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items (*, produk_varian (berat, tinggi, diameter))`)
        .eq("id", orderId)
        .eq("user_id", session.user.id) // PROTEKSI IDOR (V-005)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orderId, 
  });

  // LOGIC: Kalkulasi Dimensi Paket & Berat Toleransi
  let maxDiameter = 0;
  let totalItemHeight = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseWeight = orderData?.order_items?.reduce((acc: number, item: any) => {
    const { berat = 500, diameter = 12, tinggi = 5 } = item.produk_varian || {};
    maxDiameter = Math.max(maxDiameter, diameter);
    totalItemHeight += (tinggi * item.qty);
    return acc + (berat * item.qty);
  }, 0) || 1000;

  const totalWeight = baseWeight + 150; 
  const totalLength = (maxDiameter || 12) + 2; 
  const totalWidth = (maxDiameter || 12) + 2; 
  const totalHeight = (totalItemHeight || 5) + 3;

  // FETCH: Pencarian Wilayah / Destinasi
  const { data: searchResults, isFetching: isSearchingDest } = useQuery({
    queryKey: ["searchDest", debouncedKeyword],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/shipping/areas?search=${encodeURIComponent(debouncedKeyword)}`);
      const result = await res.json();
      return (result.data as DestinationResult[]) || [];
    },
    enabled: debouncedKeyword.length >= 3,
  });

  // FETCH: Harga Ongkos Kirim Dinamis
  const { data: dynamicCouriers, isFetching: isLoadingOngkir } = useQuery({
    queryKey: ["ongkir", watchDestId, totalWeight, totalLength, totalWidth, totalHeight],
    queryFn: async () => {
      const { data: { session: ratesSession } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/shipping/rates`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(ratesSession?.access_token ? { Authorization: `Bearer ${ratesSession.access_token}` } : {}),
        },
        body: JSON.stringify({ destination: watchDestId, weight: totalWeight, length: totalLength, width: totalWidth, height: totalHeight })
      });
      const result = await res.json();
      
      const domainMap: Record<string, string> = {
        jne: "jne.co.id", sicepat: "sicepat.com", jnt: "jet.co.id", ide: "idexpress.com",
        sap: "sap-express.id", ninja: "ninjaxpress.co", pos: "posindonesia.co.id"
      };

      return (result.data || []).map((item: KomerceCostItem) => {
        const rawEtd = item.estimation || item.etd || "";
        const formattedEtd = rawEtd.toLowerCase().replace(/hari|days|day/g, "").trim() === "0" 
          ? "Hari ini sampai (Same Day)" : `${rawEtd.replace(/hari|days|day/gi, "").trim()} hari ini sampai`;
        const courierCode = (item.code || 'jne').toLowerCase();
        
        return {
          id: item.id || item.code || Math.random().toString(),
          name: item.name || item.description || item.code || "Layanan Kurir",
          price: item.price || item.cost || 0,
          estimasi: formattedEtd || "Reguler", 
          img: `https://logos.hunter.io/${domainMap[courierCode] || `${courierCode}.co.id`}` 
        } as ShippingCourier;
      });
    },
    enabled: !!watchDestId, 
  });

  const handleSelectDestination = (dest: DestinationResult) => {
    const label = dest.label || dest.name;
    setValue("destinationId", dest.id, { shouldValidate: true });
    setValue("destinationLabel", label, { shouldValidate: true });
    setValue("courierName", "", { shouldValidate: true });
    setValue("courierPrice", 0, { shouldValidate: true });
    setSelectedCourierId(null);
    setKeyword(label);
    setShowDropdown(false);
  };

  // MUTATION: Proses Submit Form & Checkout Midtrans
  const paymentMutation = useMutation({
    mutationFn: async (formData: CheckoutFormValues) => {
      // Menggunakan endpoint backend untuk finalisasi order dan mencegah client-side manipulation
      const { data: { session: tokenSession } } = await supabase.auth.getSession();
      const accessToken = tokenSession?.access_token;
      
      const finalizeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/orders/${orderId}/finalize`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          shippingAddress: formData.street,
          shippingCity: formData.destinationLabel,
          shippingPostalCode: formData.postalCode,
          shippingCourier: formData.courierName,
          shippingCost: formData.courierPrice,
          customerNote: formData.customerNote,
          totalWeight,
          totalLength,
          totalWidth,
          totalHeight
        })
      });

      if (!finalizeRes.ok) {
        const finalizeErr = await finalizeRes.json();
        throw new Error(finalizeErr.error || finalizeErr.message || "Gagal memproses pesanan di server.");
      }

      // API Midtrans - Sekarang aman karena server sudah update grandTotal di backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/payment/tokenize`, {
        method: "POST", headers: { "Content-Type": "application/json", ...(tokenSession?.access_token ? { Authorization: `Bearer ${tokenSession.access_token}` } : {}) },
        body: JSON.stringify({
          order_id: orderData.id,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal mendapatkan token pembayaran");
      return result.token; 
    },
    onSuccess: (snapToken: string) => {
      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: async () => { toast.add({ type: "success", title: "Pembayaran Berhasil!" }); await queryClient.invalidateQueries({ queryKey: ["orderHistory"] }); router.push("/orders"); },
          onPending: async () => { toast.add({ type: "success", title: "Menunggu Pembayaran" }); await queryClient.invalidateQueries({ queryKey: ["orderHistory"] }); router.push("/orders"); },
          onError: () => toast.add({ type: "error", title: "Pembayaran Gagal" }),
          onClose: () => toast.add({ type: "error", title: "Pembayaran Dibatalkan" }),
        });
      } else {
        toast.add({ type: "error", title: "Midtrans belum dimuat." });
      }
    },
    onError: (error: Error) => toast.add({ type: "error", title: "Gagal Memproses", description: error.message }),
  });

  if (!orderId) {
    return (
      <div className="container mx-auto py-24 md:py-32 px-4 text-center text-red-500 font-medium flex flex-col items-center">
        <AlertCircle className="w-12 h-12 mb-4 text-red-400" />
        <p>Akses ditolak: ID Pesanan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 md:px-6 pt-24 lg:pt-32 pb-12 lg:pb-16 flex-1 w-full relative z-0">
      <Script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} strategy="lazyOnload" />

      <div className="mb-6 lg:mb-10 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">Lengkapi alamat pengiriman dan selesaikan pembayaranmu.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
        <div className="w-full lg:w-[65%] space-y-6 md:space-y-8">
          
          <form id="checkout-form" onSubmit={handleSubmit((data) => paymentMutation.mutate(data))} className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 md:mb-8 pb-4 border-b border-gray-100">
              <MapPin className="w-6 h-6 md:w-7 md:h-7 text-black" />
              <h2 className="text-lg md:text-xl font-semibold">Alamat Lengkap Penerima</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 md:gap-y-6">
              <FormField label="Nama Lengkap" name="name" register={register} errors={errors} placeholder="John Doe" />
              <FormField label="Nomor HP (WhatsApp)" name="phone" type="tel" register={register} errors={errors} placeholder="08123456789" />
              <FormField label="Kode Pos" name="postalCode" register={register} errors={errors} maxLength={5} placeholder="Contoh: 76114" />
              
              <div className="md:col-span-2">
                <FormField label="Alamat Jalan, No Rumah, RT/RW" name="street" register={register} errors={errors} isTextArea placeholder="Jl. Merdeka No. 123, Blok C..." />
              </div>

              <div className="md:col-span-2 relative">
                <label className="block text-sm font-semibold mb-1.5">Kecamatan / Kota Tujuan</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ketik minimal 3 huruf (misal: Cicendo)..." 
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setShowDropdown(true);
                      if (watchDestId) { setValue("destinationId", ""); setValue("destinationLabel", ""); }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-1 focus:ring-black transition-all ${
                      watchDestId ? "border-green-500 bg-green-50/50 text-green-900 font-medium" : errors.destinationId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {isSearchingDest && <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>}
                  {watchDestId && !isSearchingDest && <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><CheckCircle className="w-5 h-5 text-green-500" /></div>}
                </div>
                {errors.destinationId && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.destinationId.message}</p>}

                {showDropdown && keyword.length >= 3 && (
                  <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {isSearchingDest ? (
                      <li className="px-4 py-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /> Mencari wilayah...</li>
                    ) : searchResults?.length ? (
                      searchResults.map((res) => (
                        <li key={res.id} onClick={() => handleSelectDestination(res)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 text-sm flex items-center gap-3">
                          <Map className="w-4 h-4 text-gray-400 shrink-0" /> <span className="font-medium text-gray-800">{res.name || res.label}</span>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-4 text-center text-sm text-gray-500">Kecamatan tidak ditemukan. Coba ejaan lain.</li>
                    )}
                  </ul>
                )}
              </div>

              <div className="md:col-span-2">
                <FormField label={<span>Catatan Pesanan <span className="text-gray-400 font-normal">(Opsional)</span></span>} name="customerNote" register={register} errors={errors} isTextArea placeholder="Contoh: Tolong packing extra..." />
              </div>
            </div>
          </form>

          <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-5 md:mb-6 pb-4 border-b border-gray-100">
              <Truck className="w-6 h-6 md:w-7 md:h-7 text-black" />
              <h2 className="text-lg md:text-xl font-semibold">Pilih Jasa Kurir</h2>
            </div>
            
            {!watchDestId ? (
              <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-6 md:p-8 text-center text-gray-500 text-sm font-medium">Silakan cari dan pilih kecamatan tujuan terlebih dahulu.</div>
            ) : isLoadingOngkir ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 md:py-10 bg-gray-50/50 rounded-xl border border-gray-100"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /> <span className="text-sm text-gray-500 font-medium">Menghitung ongkos...</span></div>
            ) : dynamicCouriers?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4 max-h-96 overflow-y-auto pr-1 pb-1">
                {dynamicCouriers.map((courier: ShippingCourier) => (
                  <button 
                    key={courier.id} type="button" onClick={() => { setSelectedCourierId(courier.id); setValue("courierName", courier.name, { shouldValidate: true }); setValue("courierPrice", courier.price, { shouldValidate: true }); }}
                    className={`flex flex-col p-4 border-2 rounded-2xl w-full text-left transition duration-200 ${selectedCourierId === courier.id ? "border-black bg-gray-50/50 ring-1 ring-black shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/30"}`}
                  >
                    <div className="flex justify-between items-center mb-3 w-full">
                      <div className="relative w-16 h-10 bg-white border border-gray-200 rounded shrink-0 flex justify-center items-center overflow-hidden">
                        <Image src={courier.img} alt={courier.name} width={64} height={40} unoptimized className="w-full h-full object-contain p-1.5" />
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedCourierId === courier.id ? "border-black" : "border-gray-300"}`}>
                        {selectedCourierId === courier.id && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                      </div>
                    </div>
                    <p className="font-bold text-gray-900 pr-2 leading-tight">{courier.name}</p>
                    <p className="text-sm text-gray-500 mb-3 flex-1 mt-1">{courier.estimasi}</p>
                    <p className="text-lg font-extrabold text-gray-900 mt-auto">Rp{courier.price.toLocaleString("id-ID")}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">Maaf, tidak ada layanan kurir yang tersedia.</div>
            )}
            {errors.courierName && <p className="text-red-500 text-xs mt-3 font-medium text-center">{errors.courierName.message}</p>}
          </div>
        </div>

        <div className="w-full lg:w-[35%]">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-7 lg:sticky top-28 shadow-sm">
            <h2 className="uppercase tracking-wide font-bold text-gray-900 text-base md:text-lg mb-5 md:mb-6 pb-2 border-b border-gray-100">Ringkasan Pesanan</h2>
            
            {isOrderLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : isError ? (
              <p className="text-red-500 text-sm text-center">Gagal memuat data pesanan.</p>
            ) : (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm md:text-base text-gray-600">
                  <span>Total Produk ({orderData?.order_items?.length || 0} item)</span>
                  <span className="font-semibold text-gray-900">Rp{(orderData?.subtotal || 0).toLocaleString("id-ID")}</span>
                </div>
                
                {(orderData?.discount || 0) > 0 && (
                  <div className="flex justify-between text-sm md:text-base text-green-600 font-medium">
                    <span>Voucher Diskon</span><span>- Rp{(orderData?.discount || 0).toLocaleString("id-ID")}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm md:text-base text-gray-600">
                  <span>Biaya Pengiriman</span>
                  <span className={`font-semibold ${watchCourierPrice > 0 ? "text-gray-900" : "text-gray-400 font-normal italic"}`}>
                    {watchCourierPrice > 0 ? `Rp${watchCourierPrice.toLocaleString("id-ID")}` : "Belum dihitung"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-gray-900 border-t border-gray-200 pt-5 mt-4">
                  <span className="text-base md:text-lg font-bold">Total Bayar</span>
                  <span className="text-xl md:text-2xl font-bold text-gray-900">
                    Rp{((orderData?.subtotal || 0) - (orderData?.discount || 0) + watchCourierPrice).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 text-center mb-4 leading-relaxed px-1 md:px-2">
              Dengan melakukan pembayaran, Anda menyetujui <Link href="/terms-conditions" className="text-gray-800 font-semibold hover:underline">Syarat & Ketentuan</Link>.
            </p>

            <button type="submit" form="checkout-form" disabled={!isValid || !selectedCourierId || paymentMutation.isPending} className="w-full flex items-center justify-center gap-2.5 bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed">
              {paymentMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : <><CheckCircle className="w-5 h-5" /> Bayar Sekarang</>}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}