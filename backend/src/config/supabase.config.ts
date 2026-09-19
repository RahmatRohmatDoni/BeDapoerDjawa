import { Module, Global, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private _adminClient: SupabaseClient;
  private _anonClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = this.configService.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');

    // Admin client — bypass RLS (untuk webhook, admin operations)
    this._adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Anon client — operasi yang membutuhkan RLS
    this._anonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  get adminClient(): SupabaseClient {
    return this._adminClient;
  }

  get anonClient(): SupabaseClient {
    return this._anonClient;
  }
}

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}

