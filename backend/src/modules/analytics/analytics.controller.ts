import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GenerateAprioriDto } from './dto/apriori.dto';

@Controller('analytics')
@UseGuards(AuthGuard)
@Roles('admin', 'owner')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Post('apriori')
  async generateAprioriRules(@Body() dto: GenerateAprioriDto) {
    return this.analyticsService.generateAprioriRules(dto?.minSupport, dto?.minConfidence);
  }
}

