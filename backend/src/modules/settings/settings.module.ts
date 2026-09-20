import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SupabaseModule } from '../../config/supabase.config';

@Module({
  imports: [SupabaseModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
