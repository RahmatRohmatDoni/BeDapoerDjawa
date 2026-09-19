import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface BiteshipPricing {
  courier_code: string;
  courier_service_name: string;
  price: number;
  shipment_duration_range: string;
  shipment_duration_unit: string;
}

interface BiteshipArea {
  id: string;
  name: string;
  administrative_division_level_1_name: string;
  administrative_division_level_2_name: string;
}

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(private configService: ConfigService) {}

  async getRates(destination: string, weight?: number, length?: number, width?: number, height?: number) {
    const originAreaId = this.configService.get('BITESHIP_ORIGIN_AREA_ID', '');
    const biteshipApiKey = this.configService.getOrThrow<string>('BITESHIP_API_KEY');

    const payload = {
      origin_area_id: originAreaId,
      destination_area_id: destination,
      couriers: 'jne,jnt,sicepat,anteraja,ninja',
      items: [
        {
          name: 'Pesanan Produk',
          description: 'Produk DapoerDjawa',
          value: 50000,
          length: length || 10,
          width: width || 10,
          height: height || 10,
          weight: weight || 150,
        },
      ],
    };

    const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: biteshipApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      this.logger.error(`Biteship Rates Fetch Failed: Status ${response.status}`);
      return { data: [], error: 'Gagal memuat ongkos kirim' };
    }

    const result = await response.json();

    const mappedCouriers = (result.pricing || []).map(
      ({ courier_code, courier_service_name, price, shipment_duration_range, shipment_duration_unit }: BiteshipPricing) => ({
        id: `${courier_code}-${courier_service_name.replace(/\s+/g, '')}`,
        code: courier_code,
        name: `${courier_code.toUpperCase()} - ${courier_service_name}`,
        cost: price,
        estimation: `${shipment_duration_range} ${shipment_duration_unit}`,
      }),
    );

    return { data: mappedCouriers };
  }

  async searchAreas(search: string) {
    if (!search || search.length < 3) {
      return { data: [] };
    }

    const biteshipApiKey = this.configService.getOrThrow<string>('BITESHIP_API_KEY');

    const response = await fetch(
      `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(search)}&type=single`,
      {
        method: 'GET',
        headers: { Authorization: biteshipApiKey },
      },
    );

    if (!response.ok) {
      this.logger.error(`Biteship Area Fetch Failed: Status ${response.status}`);
      return { data: [], error: 'Gagal memuat wilayah' };
    }

    const result = await response.json();

    const mappedData = (result.areas || []).map(
      ({ id, name, administrative_division_level_1_name, administrative_division_level_2_name }: BiteshipArea) => ({
        id,
        name,
        label: `${name}, ${administrative_division_level_2_name}, ${administrative_division_level_1_name}`,
      }),
    );

    return { data: mappedData };
  }
}

