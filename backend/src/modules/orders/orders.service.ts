import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.config';
import { ShippingService } from '../shipping/shipping.service';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private supabaseService: SupabaseService,
    private shippingService: ShippingService,
  ) {}

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

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Fetch order & verify ownership + status
    // ═══════════════════════════════════════════════════════════════
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) throw new BadRequestException('Pesanan tidak ditemukan');
    if (order.user_id !== userId) throw new BadRequestException('Akses ditolak (Bukan pesanan Anda)');
    if (order.status !== 'draft') throw new BadRequestException('Pesanan sudah diproses');

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: SERVER-SIDE — Hitung berat & dimensi dari DB
    // Tidak trust apapun dari client untuk weight/dimensions
    // ═══════════════════════════════════════════════════════════════
    const { data: orderItems, error: itemsErr } = await supabase
      .from('order_items')
      .select('qty, variant_id, produk_varian(berat, tinggi, diameter)')
      .eq('order_id', orderId);

    if (itemsErr) {
      this.logger.error('Failed to fetch order items for weight calc', itemsErr);
      throw new BadRequestException('Gagal menghitung dimensi paket');
    }

    if (!orderItems || orderItems.length === 0) {
      throw new BadRequestException('Pesanan tidak memiliki item');
    }

    let baseWeight = 0;
    let maxDiameter = 0;
    let totalItemHeight = 0;

    for (const item of orderItems) {
      const variant = item.produk_varian as any;
      const berat = Number(variant?.berat) || 300;
      const diameter = Number(variant?.diameter) || 12;
      const tinggi = Number(variant?.tinggi) || 5;
      const qty = Number(item.qty) || 1;

      baseWeight += berat * qty;
      maxDiameter = Math.max(maxDiameter, diameter);
      totalItemHeight += tinggi * qty;
    }

    // Toleransi packing: +150g berat, +2cm L/W, +3cm tinggi
    const totalWeight = (baseWeight || 300) + 150;
    const totalLength = (maxDiameter || 12) + 2;
    const totalWidth = (maxDiameter || 12) + 2;
    const totalHeight = (totalItemHeight || 5) + 3;

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: SERVER-SIDE — Verifikasi ongkir via Biteship API
    // Panggil Biteship rates langsung dari backend, cocokkan harga
    // yang dikirim client dengan harga ASLI dari Biteship
    // ═══════════════════════════════════════════════════════════════
    const clientCourier = String(payload.shippingCourier || '').trim();
    const clientCost = Number(payload.shippingCost);
    const destinationAreaId = String(payload.shippingAreaId || '').trim();

    if (!clientCourier) throw new BadRequestException('Kurir pengiriman wajib dipilih');
    if (!Number.isFinite(clientCost) || clientCost < 0) throw new BadRequestException('Biaya pengiriman tidak valid');
    if (!destinationAreaId) throw new BadRequestException('Area tujuan pengiriman wajib dipilih');

    const subtotal = Number(order.subtotal || 0);
    const discount = Number(order.discount || 0);

    // Call Biteship rates from backend — same params as frontend preview
    const ratesResult = await this.shippingService.getRates(
      destinationAreaId,
      totalWeight,
      totalLength,
      totalWidth,
      totalHeight,
      Math.max(0, subtotal - discount),
    );

    if (!ratesResult.data || ratesResult.data.length === 0) {
      this.logger.error(`Biteship rates returned empty for destination ${destinationAreaId}`);
      throw new BadRequestException('Gagal memverifikasi ongkos kirim. Coba lagi.');
    }

    // Parse courier name to find matching rate
    // Client sends format: "JNE - Reguler", Biteship returns: { name: "JNE - REG", cost: 25000 }
    const normalizeStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const clientCourierNorm = normalizeStr(clientCourier);

    const matchedRate = ratesResult.data.find((rate: any) => 
      normalizeStr(rate.name) === clientCourierNorm || normalizeStr(rate.id) === clientCourierNorm
    );

    if (!matchedRate) {
      this.logger.warn(`Courier "${clientCourier}" not found in Biteship rates. Available: ${ratesResult.data.map((r: any) => r.name).join(', ')}`);
      throw new BadRequestException(`Kurir "${clientCourier}" tidak tersedia untuk tujuan ini. Silakan pilih kurir lain.`);
    }

    // Verify price — tolerance of Rp 1 for rounding
    const verifiedCost = Number(matchedRate.cost);
    if (Math.abs(clientCost - verifiedCost) > 1) {
      this.logger.warn(
        `SHIPPING COST MISMATCH: client sent ${clientCost}, Biteship says ${verifiedCost} for courier ${clientCourier} (order ${orderId})`
      );
      throw new BadRequestException(
        `Harga ongkir tidak sesuai. Harga terbaru: Rp${verifiedCost.toLocaleString('id-ID')}. Silakan refresh halaman checkout.`
      );
    }

    // Use verified cost, not client cost
    const shippingCost = verifiedCost;
    const grandTotal = Math.max(0, subtotal - discount + shippingCost);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Simpan order dengan semua nilai yang terverifikasi
    // ═══════════════════════════════════════════════════════════════
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
        total_weight: totalWeight,
        total_length: totalLength,
        total_width: totalWidth,
        total_height: totalHeight,
        shipping_area_id: destinationAreaId,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      this.logger.error('Failed to update order finalization', updateError);
      throw new BadRequestException('Gagal menyimpan detail pengiriman');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Update user profile
    // ═══════════════════════════════════════════════════════════════
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

