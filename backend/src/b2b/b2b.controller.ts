import {
  Controller, Get, Post, Put, Patch, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { B2BService } from './b2b.service';

@ApiTags('B2B')
@Controller('b2b')
export class B2BController {
  constructor(private readonly svc: B2BService) {}

  // Public: Apply for B2B account (no auth required)
  @Post('apply')
  applyForB2B(@Body() dto: any) {
    return this.svc.createCompany({ ...dto, status: 'pending' });
  }

  @Post('companies')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  createCompany(@Body() dto: any) {
    return this.svc.createCompany(dto);
  }

  @Get('companies')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  listCompanies() {
    return this.svc.listCompanies();
  }

  @Get('companies/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getCompany(@Param('id') id: string) {
    return this.svc.getCompany(id);
  }

  @Put('companies/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateCompany(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateCompany(id, dto);
  }

  @Post('companies/:id/members')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  addMember(@Param('id') companyId: string, @Body() dto: any) {
    return this.svc.addMember({ companyId, ...dto });
  }

  @Get('my-company')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMyCompany(@Body('userId') userId: string) {
    return this.svc.getCompanyOfUser(userId);
  }

  @Post('companies/:id/pricing')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  setCustomPricing(@Param('id') id: string, @Body() pricing: Record<string, number>) {
    return this.svc.setCustomPricing(id, pricing);
  }

  @Post('approvals')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  requestApproval(@Body() dto: any) {
    return this.svc.requestApproval(dto);
  }

  @Patch('approvals/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  reviewApproval(@Param('id') id: string, @Body() dto: any) {
    return this.svc.reviewApproval(id, dto);
  }

  @Get('companies/:id/approvals/pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getPendingApprovals(@Param('id') companyId: string) {
    return this.svc.getPendingApprovals(companyId);
  }
}
