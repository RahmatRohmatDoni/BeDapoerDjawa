import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('settings')
@UseGuards(AuthGuard)
@Roles('admin', 'owner')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Banners
  @Get('banners')
  getBanners() {
    return this.settingsService.getBanners();
  }

  @Post('banners')
  createBanner(@Body() payload: any) {
    return this.settingsService.createBanner(payload);
  }

  @Put('banners/:id')
  updateBanner(@Param('id') id: string, @Body() payload: any) {
    return this.settingsService.updateBanner(id, payload);
  }

  @Delete('banners/:id')
  deleteBanner(@Param('id') id: string) {
    return this.settingsService.deleteBanner(id);
  }

  // Promos
  @Get('promos')
  getPromos() {
    return this.settingsService.getPromos();
  }

  @Post('promos')
  createPromo(@Body() payload: any) {
    return this.settingsService.createPromo(payload);
  }

  @Put('promos/:id')
  updatePromo(@Param('id') id: string, @Body() payload: any) {
    return this.settingsService.updatePromo(id, payload);
  }

  @Delete('promos/:id')
  deletePromo(@Param('id') id: string) {
    return this.settingsService.deletePromo(id);
  }
}
