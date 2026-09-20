import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseModule } from './config/supabase.config';
import { AdminModule } from './modules/admin/admin.module';
import { BiteshipModule } from './modules/biteship/biteship.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    SupabaseModule,
    AdminModule,
    BiteshipModule,
    ShippingModule,
    PaymentModule,
    AnalyticsModule,
    OrdersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

