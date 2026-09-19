"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Eye, Package, Truck, MapPin, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";

interface OrderItem {
  id: string;
  qty: number;
  price: number;
  product_name?: string;
  ukuran?: string;
  produk_varian?: { // ---> PERBAIKAN: Mengambil dari tabel relasi
    img?: string;
  }; 
}

interface Order {
  id: string;
  invoice_number?: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_courier: string;
  shipping_cost: number;
  subtotal?: number;
  discount?: number; 
  grand_total: number;
  status: string;
  tracking_number: string | null; 
  biteship_order_id: string | null;
  order_items?: OrderItem[];
}

interface TrackingHistory {
  note: string;
  status: string;
  updated_at: string;
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isProcessingPickup, setIsProcessingPickup] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingHistory[] | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            qty,
            price,
            product_name,
            ukuran,
            produk_varian (
              img
            )
          )
        `) // ---> PERBAIKAN: Join tabel produk_varian untuk ambil img
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data as Order[]);
      } else if (error) {
        console.error("Gagal memuat pesanan:", error.message);
      }
      setIsLoading(false);
    };

    fetchOrders();
  }, [refreshKey]);

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "pending": return "bg-yellow-500 hover:bg-yellow-600";
      case "paid":
      case "lunas":
      case "settlement": return "bg-green-500 hover:bg-green-600";
      case "shipped": return "bg-blue-500 hover:bg-blue-600";
      case "delivered": return "bg-gray-800 hover:bg-gray-900";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    setTrackingData(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleRequestPickup = async (orderId: string) => {
    setIsProcessingPickup(true);
    const loadingToast = toast.loading("Meminta pickup ke Biteship...");

    try {
      const { data: { session: pickupSession } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/biteship/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(pickupSession?.access_token ? { Authorization: `Bearer ${pickupSession.access_token}` } : {}) },
        body: JSON.stringify({ orderId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal membuat pengiriman");

      const newTrackingNumber = result.tracking_number || result.resi;

      toast.success(`Pickup berhasil! Resi: ${newTrackingNumber}`, { id: loadingToast });
      
      if (selectedOrder) {
        setSelectedOrder({
          ...selectedOrder,
          status: "shipped",
          tracking_number: newTrackingNumber,
        });
      }

      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal request pickup";
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsProcessingPickup(false);
    }
  };

  const handleTrackPackage = async (trackingNumber: string) => {
    if (!selectedOrder) return;
    setIsTracking(true);

    try {
      const { data: { session: trackSession } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/biteship/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(trackSession?.access_token ? { Authorization: `Bearer ${trackSession.access_token}` } : {}) },
        body: JSON.stringify({
          resi: trackingNumber, 
          courier: selectedOrder.shipping_courier || "jne",
        }),
      });

      const result = await res.json();
      
      if (!res.ok || !result.success) throw new Error(result.error || "Gagal melacak paket");

      const history = result.history || [];
      setTrackingData(history);

      const isDelivered = history.some((item: TrackingHistory) => 
        (item.status || "").toLowerCase() === "delivered"
      );

      if (isDelivered && selectedOrder.status.toLowerCase() !== "delivered") {
        const { error } = await supabase
          .from("orders")
          .update({ status: "delivered" })
          .eq("id", selectedOrder.id);

        if (!error) {
          toast.success("Yeay! Paket ini terdeteksi sudah sampai (Delivered).");
          setSelectedOrder((prev) => prev ? { ...prev, status: "delivered" } : null);
          setOrders((prev) => 
            prev.map((o) => o.id === selectedOrder.id ? { ...o, status: "delivered" } : o)
          );
        }
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal melacak paket";
      toast.error(errorMessage);
    } finally {
      setIsTracking(false);
    }
  };

  const isOrderPaid = (status: string) => {
    const s = (status || "").toLowerCase();
    return s === "paid" || s === "lunas" || s === "settlement";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daftar Pesanan</h2>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Penerima</TableHead>
              <TableHead>Kurir</TableHead>
              <TableHead>Total Tagihan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Memuat data pesanan...</p>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-gray-500">
                  Belum ada pesanan masuk.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50">
                  <TableCell className="text-sm">
                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-gray-900">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.customer_phone}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm uppercase font-medium">{order.shipping_courier || "-"}</span>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    Rp {(order.grand_total || 0).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openModal(order)} className="gap-2">
                      <Eye className="w-4 h-4" /> Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
            
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  Detail Pesanan
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-mono">ID: {selectedOrder.id}</p>
              </div>
              <Badge className={`${getStatusColor(selectedOrder.status)} text-white px-3 py-1 text-sm`}>
                {selectedOrder.status.toUpperCase()}
              </Badge>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Penerima</h4>
                  <p className="font-semibold text-gray-900">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Alamat Pengiriman
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedOrder.shipping_address}<br/>
                    <span className="font-medium text-gray-800">{selectedOrder.shipping_city}</span>
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Ekspedisi
                  </h4>
                  <p className="font-bold text-blue-900 uppercase">{selectedOrder.shipping_courier || "Belum dipilih"}</p>
                  {selectedOrder.tracking_number && (
                    <p className="text-sm font-mono text-blue-700 mt-1">Resi: {selectedOrder.tracking_number}</p>
                  )}
                </div>

                {isOrderPaid(selectedOrder.status) && (
                  <Button 
                    onClick={() => handleRequestPickup(selectedOrder.id)} 
                    disabled={isProcessingPickup}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    {isProcessingPickup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                    Request Pickup
                  </Button>
                )}

                {selectedOrder.tracking_number && (
                  <Button 
                    onClick={() => handleTrackPackage(selectedOrder.tracking_number!)}
                    disabled={isTracking}
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-2 font-semibold"
                  >
                    {isTracking ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    Lacak Paket
                  </Button>
                )}
              </div>

              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div className="border rounded-xl p-4 bg-white">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Item Produk</h4>
                  <div className="divide-y">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                        
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                            {/* ---> PERBAIKAN: Memanggil item.produk_varian?.img */}
                            {item.produk_varian?.img ? ( 
                              <Image
                                src={item.produk_varian.img} 
                                alt={item.product_name || "Produk"} 
                                fill
                                sizes="48px"
                                className="object-cover" 
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{item.product_name || "Produk"}</p>
                            {item.ukuran && <p className="text-xs text-gray-500">Varian: {item.ukuran}</p>}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{item.qty} x Rp {item.price.toLocaleString("id-ID")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {trackingData && (
                <div className="border rounded-xl p-4 bg-white animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Riwayat Perjalanan Paket</h4>
                  <div className="space-y-4">
                    {trackingData.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Belum ada riwayat pergerakan paket.</p>
                    ) : (
                      trackingData.map((track, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? "bg-blue-500" : "bg-gray-300"}`} />
                            {idx !== trackingData.length - 1 && <div className="w-px h-full bg-gray-200 my-1" />}
                          </div>
                          <div className="pb-2">
                            <p className={`text-sm font-medium ${idx === 0 ? "text-gray-900" : "text-gray-600"}`}>
                              {track.note}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> 
                              {new Date(track.updated_at).toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 border-b pb-2">Ringkasan Pesanan</h4>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal Produk</span>
                    <span className="font-medium text-gray-900">
                      Rp {((selectedOrder.grand_total || 0) - (selectedOrder.shipping_cost || 0) + (selectedOrder.discount || 0)).toLocaleString("id-ID")}
                    </span>
                  </div>
                  
                  {(selectedOrder.discount || 0) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Voucher Diskon</span>
                      <span className="font-medium text-green-600">
                        - Rp {selectedOrder.discount!.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Ongkos Kirim</span>
                    <span className="font-medium text-gray-900">
                      Rp {(selectedOrder.shipping_cost || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t mt-2">
                    <span>Total Bayar</span>
                    <span>Rp {(selectedOrder.grand_total || 0).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 border-t flex justify-end bg-gray-50 rounded-b-2xl">
              <Button variant="outline" onClick={closeModal} className="w-full sm:w-auto">
                Tutup Panel
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}