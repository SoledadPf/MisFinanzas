/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @Request() req,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.dashboardService.getSummary(
      req.user.userId,
      parseInt(year),
      parseInt(month),
    );
  }

  @Get('by-category')
  getByCategory(
    @Request() req,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.dashboardService.getByCategory(
      req.user.userId,
      parseInt(year),
      parseInt(month),
    );
  }

  @Get('trend')
  getTrend(@Request() req, @Query('year') year: string) {
    return this.dashboardService.getTrend(req.user.userId, parseInt(year));
  }

  @Get('upcoming')
  getUpcoming(
    @Request() req,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.dashboardService.getUpcomingPayments(
      req.user.userId,
      parseInt(year),
      parseInt(month),
    );
  }
}
