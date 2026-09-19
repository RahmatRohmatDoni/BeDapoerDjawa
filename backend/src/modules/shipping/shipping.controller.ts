import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { RatesDto } from './dto/rates.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Post('rates')
  async getRates(@Body() dto: RatesDto) {
    return this.shippingService.getRates(dto.destination, dto.weight, dto.length, dto.width, dto.height);
  }

  @Get('areas')
  async searchAreas(@Query('search') search: string) {
    return this.shippingService.searchAreas(search?.trim());
  }
}

