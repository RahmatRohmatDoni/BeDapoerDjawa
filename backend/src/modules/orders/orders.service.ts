import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.config';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private supabaseService: SupabaseService) {}

  async checkout(userId: string, promoCode?: string) {
    const supabase = this.supabaseService.adminClient;

    // 1. Ambil cart_items milik user ini beserta relasi harganya
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('id, qty, variant_id, produk_varian(price, ukuran, img, produk(nama_produk))')
      .eq('user_id', userId);

    if (cartError) throw new BadRequestException('Gagal memuat keranjang.');
    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestException('Keranjang Anda kosong.');
    }

    // 2. Hitung subtotal berdasarkan harga yang ada di database
    let subtotal = 0;
    const itemsToInsert: any[] = [];

    for (const item of cartItems) {
      const variant = item.produk_varian as any;
      if (!variant) throw new BadRequestException('Varian produk tidak ditemukan');

      const price = Number(variant.price || 0);
      const qty = Number(item.qty || 1);
      
      subtotal += price * qty;

      itemsToInsert.push({
        variant_id: item.variant_id,
        qty: qty,
        price: price,
        ukuran: variant.ukuran || 'Reguler',
        product_name: variant.produk?.nama_produk || 'Produk',
        product_image: variant.img || '/placeholder.jpg'
      });
    }

    // 3. Validasi dan aplikasikan promo code (Server-Side Validation)
    let discountAmount = 0;
    if (promoCode) {
      const { data: promo, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .maybeSingle();

      if (promoError) throw new BadRequestException('Gagal memvalidasi promo.');
      
      if (!promo) {
        throw new BadRequestException('Kode promo tidak ditemukan.');
      }
      
      if (!promo.is_active) {
        throw new BadRequestException('Kode promo sudah tidak aktif.');
      }
      
      const now = new Date();
      if (promo.start_date && new Date(promo.start_date) > now) {
        throw new BadRequestException('Kode promo belum bisa digunakan.');
      }
      if (promo.end_date && new Date(promo.end_date) < now) {
        throw new BadRequestException('Kode promo sudah kadaluarsa.');
      }
      if (promo.usage_limit !== null && (promo.used_count || 0) >= promo.usage_limit) {
        throw new BadRequestException('Kuota promo sudah habis.');
      }
      if (promo.min_order_value && subtotal < promo.min_order_value) {
        throw new BadRequestException(`Minimal belanja untuk promo ini adalah Rp${promo.min_order_value}`);
      }

      // Hitung diskon
      if (promo.discount_type === 'nominal') {
        discountAmount = promo.discount_value;
      } else {
        const calculatedDiscount = subtotal * (promo.discount_value / 100);
        discountAmount = promo.max_discount ? Math.min(calculatedDiscount, promo.max_discount) : calculatedDiscount;
      }
    }

    const grandTotal = Math.max(0, subtotal - discountAmount);

    // 4. Generate Invoice aman
    const randomSuffix = crypto.randomInt(100, 999);
    const invoiceNumber = `INV-${Date.now()}-${randomSuffix}`;

    // 5. Insert ke tabel orders
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        subtotal: subtotal,
        grand_total: grandTotal,
        shipping_cost: 0,
        discount: discountAmount,
        status: 'draft',
        invoice_number: invoiceNumber,
      })
      .select('id')
      .single();

    if (orderError) {
      this.logger.error('Failed to create order', orderError);
      throw new BadRequestException('Gagal membuat pesanan.');
    }

    // 6. Insert ke tabel order_items
    const orderItemsPayload = itemsToInsert.map(item => ({
      order_id: orderData.id,
      ...item
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload);

    if (itemsError) {
      this.logger.error('Failed to insert order items', itemsError);
      // Optional: rollback order creation? Since it's draft, we could just let it be or delete it.
      await supabase.from('orders').delete().eq('id', orderData.id);
      throw new BadRequestException('Gagal memproses item pesanan.');
    }

    // 7. Bersihkan cart_items milik user ini
    const { error: clearCartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (clearCartError) {
      this.logger.warn(`Gagal menghapus cart_items untuk user ${userId}`);
    }

    // 8. Jika ada promo, increment usage limit via RPC (hanya jika transaksi sukses sejauh ini)
    if (promoCode) {
      await supabase.rpc('increment_promo_usage', { p_promo_code: promoCode.toUpperCase() });
    }

    return { success: true, order_id: orderData.id };
  }

  async finalizeOrder(orderId: string, userId: string, payload: any) {
    const supabase = this.supabaseService.adminClient;

    // 1. Fetch order and verify ownership
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) throw new BadRequestException('Pesanan tidak ditemukan');
    if (order.user_id !== userId) throw new BadRequestException('Akses ditolak (Bukan pesanan Anda)');
    if (order.status !== 'draft') throw new BadRequestException('Pesanan sudah diproses');

    // 2. Validate shipping cost
    const shippingCost = Number(payload.shippingCost) || 0;
    if (shippingCost < 0) throw new BadRequestException('Biaya pengiriman tidak valid');

    // 3. Calculate grand total securely on server
    const subtotal = Number(order.subtotal || 0);
    const discount = Number(order.discount || 0);
    const grandTotal = Math.max(0, subtotal - discount + shippingCost);

    // 4. Update order with secure values
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        shipping_address: payload.shippingAddress,
        shipping_city: payload.shippingCity,
        shipping_postal_code: payload.shippingPostalCode,
        shipping_courier: payload.shippingCourier,
        shipping_cost: shippingCost,
        grand_total: grandTotal,
        customer_note: payload.customerNote,
        status: 'pending',
        total_weight: payload.totalWeight,
        total_length: payload.totalLength,
        total_width: payload.totalWidth,
        total_height: payload.totalHeight
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      this.logger.error('Failed to update order finalization', updateError);
      throw new BadRequestException('Gagal menyimpan detail pengiriman');
    }

    // 5. Update user profile information synchronously
    await supabase
      .from('users')
      .update({
        nama_user: payload.customerName,
        no_hp: payload.customerPhone,
        alamat: payload.shippingAddress
      })
      .eq('id_user', userId);

    return { success: true, order: updatedOrder };
  }
}
