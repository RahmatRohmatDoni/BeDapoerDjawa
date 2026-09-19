import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { TokenizeDto } from './dto/tokenize.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('tokenize')
  @UseGuards(AuthGuard)
  async createToken(@Body() dto: TokenizeDto, @CurrentUser() user: any) {
    return this.paymentService.createSnapToken(dto.order_id, user.id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: Record<string, unknown>) {
    return this.paymentService.handleWebhook(body);
  }

  @Get('webhook')
  webhookHealthCheck() {
    return { success: true, message: 'Midtrans webhook endpoint aktif' };
  }
}
