export type Role = "admin" | "owner";
export type Tab = "overview" | "products" | "orders" | "settings";

export interface UserProfile {
  id_user: string;
  email: string;
  role: Role;
  nama_user?: string;
}

export interface ProductVariant {
  id: string;
  produk_id: string;
  raw_name: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  weight: number;
  tinggi: number;
  diameter: number;
  image_url: string | null;
  foto_2: string | null;
  size: string;
}

export interface OrderItem {
  id: string;
  qty: number;
  price: number;
  product_name?: string;
  ukuran?: string;
  produk_varian?: {
    img?: string;
  };
}

export interface Order {
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
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | string;
  tracking_number: string | null;
  biteship_order_id: string | null;
  order_items?: OrderItem[];
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: "nominal" | "percentage" | string;
  discount_value: number;
  max_discount?: number | null;
  min_order_value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  used_count: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface OrderRow {
  id: string;
  invoice_number: string | null;
  user_id: string | null;
  status: string | null;
  subtotal: number | string | null;
  discount: number | string | null;
  shipping_cost: number | string | null;
  grand_total: number | string | null;
  shipping_courier: string | null;
  shipping_address: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  biteship_order_id: string | null;
  shipment_requested_at: string | null;
  total_weight: number | null;
  total_length: number | null;
  total_width: number | null;
  total_height: number | null;
}

