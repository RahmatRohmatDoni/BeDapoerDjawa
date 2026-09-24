import { Injectable, BadRequestException, ConflictException, BadGatewayException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../config/supabase.config';
import { OrderRow } from '../../types';

interface BiteshipResponse {
  id?: string;
  order_id?: string;
  waybill_id?: string | null;
  tracking_id?: string | null;
  status?: string;
  courier?: { waybill_id?: string | null; tracking_id?: string | null };
}

interface BiteshipErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{ message?: string }>;
}

const STATUS_MAP: Record<string, string> = {
  delivered: 'delivered',
  confirmed: 'shipped',
  allocated: 'shipped',
  picking_up: 'shipped',
  picked: 'shipped',
  dropping_off: 'shipped',
  on_hold: 'shipped',
  in_transit: 'shipped',
  cancelled: 'cancelled',
  rejected: 'cancelled',
  return_in_transit: 'returned',
  returned: 'returned',
};

const BITESHIP_API_URL = 'https://api.biteship.com/v1/orders';

function toNumber(value: number | string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCourierCompany(shippingCourier: string | null): string {
  const raw = shippingCourier?.split('-')[0]?.trim().toLowerCase() || '';
  const aliasMap: Record<string, string> = {
    'j&t': 'jnt', 'j & t': 'jnt', 'j&t express': 'jnt',
    'si cepat': 'sicepat', 'anter aja': 'anteraja',
    'id express': 'ide', 'pos indonesia': 'pos',
  };
  return aliasMap[raw] || raw;
}

function getCourierType(shippingCourier: string | null): string {
  if (!shippingCourier) return '';
  const courier = shippingCourier.trim().toLowerCase();
  const lastPart = courier.split('-').slice(1).join('-').trim();

  const directCodes = [
    'reg', 'yes', 'oke', 'jtr', 'jtr_150', 'jtr_150_250', 'jtr_250',
    'same_day', 'next_day', 'instant', 'instant_car', 'normal',
    'ons', 'sds', 'eko', 'ndp', 'rgp', 'pas', 'ecp', 'hwp',
  ];
  if (directCodes.includes(lastPart)) return lastPart;

  const isMatch = (words: string[]) => words.some((w) => courier.includes(w));

  if (isMatch(['jne'])) {
    if (isMatch(['reguler', 'regular'])) return 'reg';
    if (isMatch(['yes'])) return 'yes';
    if (isMatch(['oke'])) return 'oke';
    if (isMatch(['jtr 150 250'])) return 'jtr_150_250';
    if (isMatch(['jtr 250'])) return 'jtr_250';
    if (isMatch(['jtr 150'])) return 'jtr_150';
    if (isMatch(['jtr'])) return 'jtr';
  }
  if (isMatch(['jnt', 'j&t']) && isMatch(['ez', 'reg'])) return 'ez';
  if (isMatch(['sicepat']) && isMatch(['reguler', 'regular'])) return 'reg';
  if (isMatch(['anteraja'])) {
    if (isMatch(['reguler', 'regular'])) return 'reg';
    if (isMatch(['same day'])) return 'same_day';
    if (isMatch(['next day'])) return 'next_day';
  }
  if (isMatch(['tiki'])) {
    if (isMatch(['reguler', 'regular', 'reg'])) return 'reg';
    if (isMatch(['ons'])) return 'ons';
    if (isMatch(['sds'])) return 'sds';
    if (isMatch(['eko'])) return 'eko';
  }
  if (isMatch(['wahana'])) return 'normal';
  if (isMatch(['pos'])) {
    if (isMatch(['kilat'])) return 'kilat_khusus';
    if (isMatch(['q9'])) return 'q9_same_day';
    if (isMatch(['same day'])) return 'same_day';
    if (isMatch(['next day'])) return 'next_day';
    if (isMatch(['jumbo'])) return 'jumbo_ekonomi';
  }

  return '';
}

async function getBiteshipError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as BiteshipErrorResponse;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (data?.errors?.length) return data.errors.map((e) => e.message).filter(Boolean).join(', ');
    return JSON.stringify(data);
  } catch {
    return 'Biteship mengembalikan response yang tidak dapat dibaca';
  }
}

@Injectable()
export class BiteshipService {
  private readonly logger = new Logger(BiteshipService.name);

  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  async createOrder(orderId: string) {
    const supabaseAdmin = this.supabaseService.adminClient;
    const biteshipApiKey = this.configService.getOrThrow<string>('BITESHIP_API_KEY');
    const originAreaId = this.configService.getOrThrow<string>('BITESHIP_ORIGIN_AREA_ID');

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id, invoice_number, user_id, status, subtotal, discount, 
        shipping_cost, grand_total, shipping_courier, shipping_address, 
        customer_name, customer_phone, shipping_city, shipping_postal_code, 
        biteship_order_id, shipment_requested_at, total_weight,
        total_length, total_width, total_height, shipping_area_id,
        order_items(qty)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) throw new Error(`Database error: ${orderError.message}`);
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    const typedOrder = order as OrderRow;

    if (typedOrder.biteship_order_id) {
      throw new ConflictException({
        error: 'Pickup sudah pernah dibuat',
        orderId: typedOrder.id,
        biteship_order_id: typedOrder.biteship_order_id,
      });
    }

    if (!typedOrder.shipping_courier) throw new BadRequestException('Kurir pengiriman belum tersedia');
    if (!typedOrder.shipping_address) throw new BadRequestException('Alamat pengiriman belum tersedia');
    if (!typedOrder.shipping_postal_code) throw new BadRequestException('Kode pos tujuan belum tersedia');
    if (!typedOrder.customer_name) throw new BadRequestException('Nama customer belum tersedia');
    if (!typedOrder.customer_phone) throw new BadRequestException('Nomor telepon customer belum tersedia');

    const courierCompany = getCourierCompany(typedOrder.shipping_courier);
    const courierType = getCourierType(typedOrder.shipping_courier);

    if (!courierCompany || !courierType) {
      throw new BadRequestException({
        error: 'Kode kurir tidak valid atau tidak dikenali API',
        shipping_courier: typedOrder.shipping_courier,
      });
    }

    const { data: claimed, error: claimError } = await supabaseAdmin.rpc('claim_order_shipment', { p_order_id: orderId });
    if (claimError) throw new Error(`RPC error: ${claimError.message}`);
    if (!claimed) {
      throw new ConflictException({ error: 'Pickup sedang diproses sistem lain', orderId: typedOrder.id });
    }

    const grandTotal = toNumber(typedOrder.grand_total);
    const shippingCost = toNumber(typedOrder.shipping_cost);
    const orderValue = Math.max(0, grandTotal - shippingCost);
    const destinationPostalCode = Number(typedOrder.shipping_postal_code);

    if (!Number.isInteger(destinationPostalCode) || destinationPostalCode <= 0) {
      await supabaseAdmin.from('orders').update({ shipment_requested_at: null }).eq('id', orderId).is('biteship_order_id', null);
      throw new BadRequestException('Kode pos tujuan tidak valid');
    }

    // Calculate total quantity from order items for accurate Biteship manifest
    const totalQty = ((order as any).order_items || []).reduce(
      (sum: number, item: { qty: number }) => sum + (Number(item.qty) || 1), 0
    ) || 1;

    const payload = {
      shipper_contact_name: 'DapoerDjawa',
      shipper_contact_phone: this.configService.get('BITESHIP_ORIGIN_PHONE', '08123456789'),
      shipper_contact_email: this.configService.get('BITESHIP_ORIGIN_EMAIL', 'admin@dapoerdjawa.com'),
      shipper_organization: 'DapoerDjawa',
      origin_contact_name: 'DapoerDjawa',
      origin_contact_phone: this.configService.get('BITESHIP_ORIGIN_PHONE', '08123456789'),
      origin_address: this.configService.get('BITESHIP_ORIGIN_ADDRESS', 'DapoerDjawa'),
      origin_note: 'Pickup DapoerDjawa',
      origin_area_id: originAreaId,
      destination_contact_name: typedOrder.customer_name,
      destination_contact_phone: typedOrder.customer_phone,
      destination_address: typedOrder.shipping_address,
      destination_postal_code: destinationPostalCode,
      destination_area_id: typedOrder.shipping_area_id || undefined,
      destination_note: typedOrder.shipping_city || undefined,
      courier_company: courierCompany,
      courier_type: courierType,
      delivery_type: 'now',
      reference_id: typedOrder.id,
      order_note: typedOrder.invoice_number ? `Order ${typedOrder.invoice_number}` : 'Order DapoerDjawa',
      items: [
        {
          name: typedOrder.invoice_number ? `Pesanan ${typedOrder.invoice_number}` : 'Pesanan DapoerDjawa',
          description: 'Pesanan makanan DapoerDjawa',
          category: 'food_and_drink',
          value: orderValue,
          quantity: totalQty,
          weight: typedOrder.total_weight || 300,
          length: typedOrder.total_length || 10,
          width: typedOrder.total_width || 10,
          height: typedOrder.total_height || 5,
        },
      ],
    };

    const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value != null));

    const biteshipResponse = await fetch(BITESHIP_API_URL, {
      method: 'POST',
      headers: {
        Authorization: biteshipApiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(cleanPayload),
    });

    if (!biteshipResponse.ok) {
      const errorMessage = await getBiteshipError(biteshipResponse);
      await supabaseAdmin.from('orders').update({ shipment_requested_at: null }).eq('id', orderId).is('biteship_order_id', null);
      throw new BadGatewayException({
        error: 'Gagal membuat pengiriman di Biteship',
        details: errorMessage,
        biteship_status: biteshipResponse.status,
      });
    }

    const biteship = (await biteshipResponse.json()) as BiteshipResponse;
    const biteshipOrderId = biteship.id || biteship.order_id;
    const trackingNumber = biteship.courier?.waybill_id || biteship.waybill_id || biteship.tracking_id || null;

    if (!biteshipOrderId) {
      throw new BadGatewayException('Shipment berhasil namun ID tidak ditemukan');
    }

    const { data: savedOrder, error: saveError } = await supabaseAdmin
      .from('orders')
      .update({
        biteship_order_id: biteshipOrderId,
        tracking_number: trackingNumber,
        shipment_requested_at: new Date().toISOString(),
        status: 'shipped',
      })
      .eq('id', orderId)
      .is('biteship_order_id', null)
      .select('id, biteship_order_id, tracking_number, shipment_requested_at, status')
      .maybeSingle();

    if (saveError) {
      this.logger.error(`Gagal update DB setelah shipment: ${saveError.message}`);
      throw new Error('Gagal update status pesanan');
    }

    if (!savedOrder) {
      throw new ConflictException('Pesanan sedang diproses');
    }

    return {
      success: true,
      message: 'Pengiriman Biteship berhasil dibuat',
      orderId,
      biteship_order_id: biteshipOrderId,
      tracking_number: trackingNumber,
      waybill_id: trackingNumber,
      status: biteship.status || 'confirmed',
    };
  }

  async trackPackage(resi: string, courier?: string) {
    const biteshipApiKey = this.configService.getOrThrow<string>('BITESHIP_API_KEY');

    const safeResi = encodeURIComponent(resi.trim());
    const safeCourier = (typeof courier === 'string' ? courier : 'jne')
      .toLowerCase()
      .split(' ')[0]
      .replace(/[^a-z0-9]/g, '');

    const res = await fetch(
      `https://api.biteship.com/v1/trackings/${safeResi}/couriers/${safeCourier}`,
      {
        method: 'GET',
        headers: { Authorization: biteshipApiKey },
      },
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Data pelacakan tidak ditemukan');
    }

    const history = (data.history || []).map(
      ({ note, status, updated_at }: { note: string; status: string; updated_at: string }) => ({
        note,
        status,
        updated_at,
      }),
    );

    return { success: true, history };
  }

  async handleWebhook(payload: Record<string, any>) {
    if (!payload || Object.keys(payload).length === 0) {
      return { success: true, message: 'Webhook endpoint is active' };
    }

    if (typeof payload !== 'object') {
      throw new BadRequestException('Invalid payload');
    }

    const biteshipOrderId = payload.order_id || '';
    const biteshipStatus = String(payload.status || '').toLowerCase().trim();
    const waybillId = payload.waybill_id || payload.courier?.waybill_id || null;

    if (!biteshipOrderId || !biteshipStatus) {
      return { success: true, message: 'Webhook missing required fields, but acknowledged.' };
    }

    const supabaseAdmin = this.supabaseService.adminClient;

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('biteship_order_id', biteshipOrderId)
      .maybeSingle();

    if (!order) {
      return { success: true, message: 'Order not found in DB' };
    }

    const newOrderStatus = STATUS_MAP[biteshipStatus];
    if (!newOrderStatus) {
      return { success: true, message: 'Status unmapped', biteship_status: biteshipStatus };
    }

    const updateData: { status: string; tracking_number?: string } = { status: newOrderStatus };
    if (waybillId) updateData.tracking_number = waybillId;

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) throw updateError;

    return {
      success: true,
      message: 'Webhook processed',
      order_id: order.id,
      status: newOrderStatus,
      tracking_number: waybillId,
    };
  }
}
