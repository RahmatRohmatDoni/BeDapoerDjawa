import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminService } from './admin.service';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/users')
@UseGuards(AuthGuard)
@Roles('owner')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private configService: ConfigService,
  ) {}

  @Get()
  async getAdminUsers() {
    return this.adminService.getAdminUsers();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async inviteAdmin(@Body() dto: InviteAdminDto) {
    const email = dto.email.trim().toLowerCase();
    const namaUser = (dto.nama_user || dto.name || '').trim();
    const noHp = dto.no_hp ? dto.no_hp.trim() : null;
    const alamat = dto.alamat ? dto.alamat.trim() : null;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    return this.adminService.inviteAdmin(email, namaUser, noHp, alamat, frontendUrl);
  }

  @Patch(':id/role')
  async changeRole(@Param('id') userId: string, @Body('role') role: string) {
    return this.adminService.changeUserRole(userId, role);
  }
}

