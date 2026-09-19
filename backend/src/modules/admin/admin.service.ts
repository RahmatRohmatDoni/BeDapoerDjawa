import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../config/supabase.config';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  async getAdminUsers() {
    const { data, error } = await this.supabaseService.adminClient
      .from('users')
      .select('id_user, nama_user, no_hp, alamat, created_at, role, email')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data ?? [] };
  }

  async inviteAdmin(
    email: string,
    namaUser: string,
    noHp: string | null,
    alamat: string | null,
    frontendUrl: string,
  ) {
    const supabaseAdmin = this.supabaseService.adminClient;
    const finalNama = namaUser || email.split('@')[0];
    const inviteRedirectUrl = `${frontendUrl}/invite`;

    // Cek eksistensi admin di tabel users
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id_user, email, role')
      .eq('email', email)
      .maybeSingle();

    if (profileError) throw profileError;

    if (existingProfile) {
      throw new ConflictException(`User dengan email tersebut sudah terdaftar dengan role ${existingProfile.role}.`);
    }

    let authUserId: string | null = null;

    // Cari di Auth Supabase jika belum ada di tabel users
    if (!authUserId) {
      const { data: authUsersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      authUserId = authUsersData?.users.find((u) => u.email?.toLowerCase() === email)?.id || null;
    }

    const invitationMetadata = { nama_user: finalNama, role: 'admin', invitation_type: 'admin_invitation' };

    if (!authUserId) {
      // Invite user baru
      const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteRedirectUrl,
        data: invitationMetadata,
      });
      if (inviteError || !invited.user) throw inviteError || new Error('Gagal mengundang user.');
      authUserId = invited.user.id;
    } else {
      // Update metadata jika akun Auth sudah ada
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        user_metadata: invitationMetadata,
      });
      if (updateError) throw updateError;
    }

    // Upsert data pengguna sebagai admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        { id_user: authUserId, nama_user: finalNama, no_hp: noHp, alamat, role: 'admin', email },
        { onConflict: 'id_user' },
      )
      .select('id_user, nama_user, no_hp, alamat, created_at, role, email')
      .single();

    if (userError) throw userError;

    return {
      success: true,
      message: 'Invitation admin berhasil dibuat.',
      data: userData,
      redirectTo: inviteRedirectUrl,
    };
  }
}

