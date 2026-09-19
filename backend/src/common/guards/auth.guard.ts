import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../config/supabase.config';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header diperlukan');
    }

    const authHeaderLower = authHeader.toLowerCase();
    if (!authHeaderLower.startsWith('bearer ')) {
      throw new UnauthorizedException('Format authorization header tidak valid');
    }
    const token = authHeader.substring(7).trim();
    const { data: { user }, error } = await this.supabaseService.adminClient.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Token tidak valid');
    }

    // Ambil role dari database
    const { data: profile } = await this.supabaseService.adminClient
      .from('users')
      .select('role, nama_user, email')
      .eq('id_user', user.id)
      .single();

    // Attach user + profile ke request
    request.user = { ...user, role: profile?.role, nama_user: profile?.nama_user };

    // Check required roles (jika ada @Roles decorator)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      if (!profile?.role || !requiredRoles.includes(profile.role)) {
        throw new ForbiddenException('Akses ditolak — role tidak sesuai');
      }
    }

    return true;
  }
}

