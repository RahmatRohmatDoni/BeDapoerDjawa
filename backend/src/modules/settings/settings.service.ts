import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.config';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private supabaseService: SupabaseService) {}

  // Hero Banners
  async getBanners() {
    const { data, error } = await this.supabaseService.adminClient
      .from('hero_banners')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async createBanner(payload: any) {
    const { data, error } = await this.supabaseService.adminClient
      .from('hero_banners')
      .insert([payload])
      .select()
      .single();
    
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateBanner(id: string, payload: any) {
    const { data, error } = await this.supabaseService.adminClient
      .from('hero_banners')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteBanner(id: string) {
    const { error } = await this.supabaseService.adminClient
      .from('hero_banners')
      .delete()
      .eq('id', id);
    
    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  // Promo Codes
  async getPromos() {
    const { data, error } = await this.supabaseService.adminClient
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async createPromo(payload: any) {
    const { data, error } = await this.supabaseService.adminClient
      .from('promo_codes')
      .insert([payload])
      .select()
      .single();
    
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updatePromo(id: string, payload: any) {
    const { data, error } = await this.supabaseService.adminClient
      .from('promo_codes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deletePromo(id: string) {
    const { error } = await this.supabaseService.adminClient
      .from('promo_codes')
      .delete()
      .eq('id', id);
    
    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }
}

