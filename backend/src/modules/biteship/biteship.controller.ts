import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Headers, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BiteshipService } from './biteship.service';
import { CreateBiteshipOrderDto } from './dto/create-order.dto';
import { TrackingDto } from './dto/tracking.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('biteship')
export class BiteshipController {
  constructor(
    private biteshipService: BiteshipService,
    private configService: ConfigService,
  ) {}

  @Post('order')
  @UseGuards(AuthGuard)
  @Roles('admin', 'owner')
  async createOrder(@Body() dto: CreateBiteshipOrderDto) {
    return this.biteshipService.createOrder(dto.orderId.trim());
  }

  @Post('tracking')
  @UseGuards(AuthGuard)
  async trackPackage(@Body() dto: TrackingDto) {
    return this.biteshipService.trackPackage(dto.resi, dto.courier);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: Record<string, any>,
    @Headers('x-biteship-signature') signature?: string,
  ) {
    const webhookSecret = this.configService.get<string>('BITESHIP_WEBHOOK_SECRET');
    if (webhookSecret) {
      if (!signature || signature !== webhookSecret) {
        throw new ForbiddenException('Webhook signature tidak valid');
      }
    }
    return this.biteshipService.handleWebhook(body);
  }

  @Get('webhook')
  webhookHealthCheck() {
    return { success: true, message: 'Biteship webhook endpoint aktif' };
  }
}
