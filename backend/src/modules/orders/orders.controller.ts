import { Controller, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { FinalizeOrderDto } from './dto/finalize-order.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@Body() dto: CheckoutDto, @CurrentUser() user: any) {
    return this.ordersService.checkout(user.id, dto.promoCode);
  }

  @Patch(':id/finalize')
  async finalizeOrder(
    @Param('id') orderId: string,
    @Body() dto: FinalizeOrderDto,
    @CurrentUser() user: any
  ) {
    return this.ordersService.finalizeOrder(orderId, user.id, dto);
  }
}

