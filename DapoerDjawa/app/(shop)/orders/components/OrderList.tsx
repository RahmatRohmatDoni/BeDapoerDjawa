"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Package, CreditCard } from "lucide-react";
import type { Order } from "./HistoryClient";

type OrderListProps = { orders: Order[]; onOpenDetail: (order: Order) => void; };

const getStatusBadgeStyle = (status: string = "") => {
  const styles: Record<string, string> = {
    DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    SELESAI: "bg-emerald-100 text-emerald-800 border-emerald-200",
    SUCCESS: "bg-emerald-100 text-emerald-800 border-emerald-200",
    SHIPPED: "bg-blue-100 text-blue-800 border-blue-200",
    DIKIRIM: "bg-blue-100 text-blue-800 border-blue-200",
    PAID: "bg-indigo-100 text-indigo-800 border-indigo-200",
    DIPROSES: "bg-indigo-100 text-indigo-800 border-indigo-200",
    PENDING: "bg-orange-50 text-orange-700 border-orange-200",
    UNPAID: "bg-orange-50 text-orange-700 border-orange-200",
    "BELUM BAYAR": "bg-orange-50 text-orange-700 border-orange-200",
    DRAFT: "bg-orange-50 text-orange-700 border-orange-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    BATAL: "bg-red-100 text-red-800 border-red-200",
    FAILED: "bg-red-100 text-red-800 border-red-200",
  };
  return (styles[status.toUpperCase()] || "bg-gray-100 text-gray-700 border-gray-200") + " shadow-sm";
};

export default function OrderList({ orders, onOpenDetail }: OrderListProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {orders.map((order) => {
        const isUnpaid = ["draft", "pending", "unpaid"].includes(order.status?.toLowerCase() || "");
        return (
          <div key={order.id} className="border border-gray-200 rounded-2xl p-4 md:p-5 hover:border-gray-300 hover:shadow-md transition bg-white flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-start md:items-center mb-3">
                <div>
                  <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5 md:mb-1">No. Invoice</p>
                  <p className="font-bold text-gray-900 text-sm md:text-base">{order.invoice_number || `INV-${order.id.substring(0, 6).toUpperCase()}`}</p>
                </div>
                <span className={`text-[10px] sm:text-xs px-2.5 md:px-3 py-1 md:py-1.5 rounded-full font-extrabold uppercase tracking-widest text-center whitespace-nowrap ml-2 border ${getStatusBadgeStyle(order.status)}`}>{order.status || "SELESAI"}</span>
              </div>
              <div className="flex items-center gap-3 md:gap-4 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100">
                <div className="flex -space-x-3">
                  {order.order_items?.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center overflow-hidden z-10 shrink-0">
                      {item.product_image ? <Image src={item.product_image} alt={item.product_name} width={40} height={40} className="object-cover w-full h-full" /> : <Package className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />}
                    </div>
                  ))}
                </div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">{order.order_items?.length || 0} Produk</div>
              </div>
            </div>
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6 gap-3">
              <div className="text-left md:text-right">
                <p className="text-gray-500 font-medium text-[10px] md:text-xs mb-0.5 md:mb-1">Total Belanja</p>
                <p className="font-extrabold text-base md:text-lg text-gray-900">Rp{(order.grand_total || 0).toLocaleString("id-ID")}</p>
              </div>
              <div className="flex items-center gap-2">
                {isUnpaid && <Link href={`/checkout?order_id=${order.id}`} className="bg-black text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-gray-800 transition shadow-sm flex items-center gap-1.5 md:gap-2 shrink-0"><CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4" /> Bayar</Link>}
                <button type="button" onClick={() => onOpenDetail(order)} className="bg-white border border-gray-300 text-gray-700 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-1.5 md:gap-2 shrink-0"><Eye className="w-3.5 h-3.5 md:w-4 md:h-4" /> Detail</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}