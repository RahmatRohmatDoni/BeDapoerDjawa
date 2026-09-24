import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../config/supabase.config';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  private getMidtransBaseUrl(): string {
    const isProduction = this.configService.get<string>('MIDTRANS_IS_PRODUCTION') === 'true';
    return isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
  }

  async createSnapToken(orderId: string, userId: string) {
    const serverKey = this.configService.getOrThrow<string>('MIDTRANS_SERVER_KEY');
    const supabase = this.supabaseService.adminClient;

    // Ambil order dari database — BUKAN dari client
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, grand_total, user_id, customer_name, customer_phone, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    // IDOR check
    if (order.user_id !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke order ini');
    }

    // Pastikan order belum dibayar
    if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
      throw new BadRequestException('Order sudah dibayar');
    }

    const grossAmount = Math.round(Number(order.grand_total));
    if (!grossAmount || grossAmount <= 0) {
      throw new BadRequestException('Total order tidak valid');
    }

    const base64Key = Buffer.from(`${serverKey}:`).toString('base64');

    const response = await fetch(this.getMidtransBaseUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${base64Key}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: String(orderId),
          gross_amount: grossAmount,
        },
        customer_details: {
          first_name: order.customer_name ? String(order.customer_name) : undefined,
          phone: order.customer_phone ? String(order.customer_phone) : undefined,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      this.logger.error('Midtrans API Error:', data.error_messages?.[0] || data);
      throw new BadRequestException('Gagal membuat transaksi');
    }

    return { token: data.token };
  }

  async handleWebhook(body: Record<string, unknown>) {
    const serverKey = this.configService.getOrThrow<string>('MIDTRANS_SERVER_KEY');
    const supabase = this.supabaseService.adminClient;

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
      va_numbers,
      fraud_status,
    } = body as Record<string, any>;

    if (!order_id || !status_code || gross_amount === undefined || !signature_key || !transaction_status) {
      throw new BadRequestException('Payload tidak lengkap');
    }

    // Handle test notification dari Midtrans (order_id dimulai dengan 'payment_notif_test_')
    if (String(order_id).startsWith('payment_notif_test_')) {
      this.logger.log(`Midtrans test notification received: ${order_id}`);
      return { success: true, message: 'Test notification acknowledged', order_id };
    }

    // Verifikasi SHA-512 signature
    const signatureString = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto.createHash('sha512').update(signatureString).digest('hex');
    const keyString = String(signature_key);

    if (
      expectedSignature.length !== keyString.length ||
      !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(keyString))
    ) {
      throw new ForbiddenException('Signature tidak valid');
    }

    // Ambil order dari DB
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, grand_total, status')
      .eq('id', order_id)
      .single();

    if (fetchError || !existingOrder) {
      throw new NotFoundException({ error: 'Order tidak ditemukan', order_id });
    }

    // Verifikasi amount
    const dbGrandTotal = Math.round(Number(existingOrder.grand_total));
    const webhookAmount = Math.round(Number(gross_amount));
    if (dbGrandTotal !== webhookAmount) {
      this.logger.warn(`Amount mismatch! DB: ${dbGrandTotal}, Webhook: ${webhookAmount}, Order: ${order_id}`);
      throw new ForbiddenException('Jumlah pembayaran tidak sesuai dengan order');
    }

    // Deteksi metode pembayaran
    let paymentMethod = payment_type || 'unknown';
    if (payment_type === 'bank_transfer' && Array.isArray(va_numbers) && va_numbers[0]?.bank) {
      paymentMethod = `${String(va_numbers[0].bank).toUpperCase()} Virtual Account`;
    } else if (payment_type === 'echannel') {
      paymentMethod = 'Mandiri Bill Payment';
    }

    // Mapping status Midtrans → status order
    let orderStatus = 'pending';
    if (transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept')) {
      orderStatus = 'paid';
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      orderStatus = 'cancelled';
    } else if (transaction_status === 'capture' && fraud_status === 'challenge') {
      orderStatus = 'pending';
    } else if (transaction_status === 'refund') {
      orderStatus = 'refunded';
    }

    // ═══════════════════════════════════════════════════════════════
    // ATOMIC CONDITIONAL UPDATE — Anti race condition
    // Hanya update jika status BELUM terminal (paid/shipped/delivered)
    // Kalau 2 webhook tiba bersamaan, hanya 1 yang berhasil update
    // ═══════════════════════════════════════════════════════════════
    const terminalStatuses = ['paid', 'shipped', 'delivered'];

    // Early return jika sudah terminal (fast path, non-atomic tapi aman karena
    // atomic check di bawah tetap jadi safety net)
    if (terminalStatuses.includes(existingOrder.status)) {
      return { success: true, message: 'Order sudah diproses sebelumnya', order_id, status: existingOrder.status };
    }

    // ATOMIC update: hanya berhasil jika status BELUM terminal
    const { data: updatedRows, error: updateError } = await supabase
      .from('orders')
      .update({ status: orderStatus, payment_method: paymentMethod })
      .eq('id', order_id)
      .not('status', 'in', `(${terminalStatuses.join(',')})`)
      .select('id');

    if (updateError) throw updateError;

    // Jika 0 rows affected → order sudah diproses oleh webhook lain
    if (!updatedRows || updatedRows.length === 0) {
      this.logger.log(`Webhook duplicate ignored for order ${order_id} (already terminal)`);
      return { success: true, message: 'Order sudah diproses sebelumnya', order_id };
    }

    // ═══════════════════════════════════════════════════════════════
    // Pemotongan stok — HANYA jika atomic update berhasil
    // Dijamin tidak akan double-decrement karena hanya 1 webhook
    // yang berhasil melewati atomic update di atas
    // ═══════════════════════════════════════════════════════════════
    if (orderStatus === 'paid') {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('variant_id, qty')
        .eq('order_id', order_id);

      if (itemsError) {
        this.logger.error('Gagal mengambil order_items:', itemsError);
      } else if (items && items.length > 0) {
        for (const item of items) {
          if (item.variant_id && item.qty) {
            const { error: rpcError } = await supabase.rpc('decrement_stock', {
              variant_id: item.variant_id,
              qty: Number(item.qty),
            });

            if (rpcError) {
              this.logger.error(`Gagal mengurangi stok varian ${item.variant_id}: ${rpcError.message}`);
            }
          }
        }
      }
    }

    return {
      success: true,
      message: 'Webhook berhasil diproses',
      order_id,
      status: orderStatus,
      payment_method: paymentMethod,
    };
  }
}
