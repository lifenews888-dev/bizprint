import {
  Controller, Get, Post, Put, Patch, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { B2BService } from './b2b.service';

@ApiTags('B2B')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('b2b')
export class B2BController {
  constructor(private readonly svc: B2BService) {}

  @Post('companies')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  createCompany(@Body() dto: any) {
    return this.svc.createCompany(dto);
  }

  @Get('companies')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  listCompanies() {
    return this.svc.listCompanies();
  }

  @Get('companies/:id')
  getCompany(@Param('id') id: string) {
    return this.svc.getCompany(id);
  }

  @Put('companies/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  updateCompany(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateCompany(id, dto);
  }

  @Post('companies/:id/members')
  addMember(@Param('id') companyId: string, @Body() dto: any) {
    return this.svc.addMember({ companyId, ...dto });
  }

  @Get('my-company')
  getMyCompany(@Body('userId') userId: string) {
    return this.svc.getCompanyOfUser(userId);
  }

  @Post('companies/:id/pricing')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  setCustomPricing(@Param('id') id: string, @Body() pricing: Record<string, number>) {
    return this.svc.setCustomPricing(id, pricing);
  }

  @Post('approvals')
  requestApproval(@Body() dto: any) {
    return this.svc.requestApproval(dto);
  }

  @Patch('approvals/:id')
  reviewApproval(@Param('id') id: string, @Body() dto: any) {
    return this.svc.reviewApproval(id, dto);
  }

  @Get('companies/:id/approvals/pending')
  getPendingApprovals(@Param('id') companyId: string) {
    return this.svc.getPendingApprovals(companyId);
  }
}
