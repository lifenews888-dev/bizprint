import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('users')
  getUsers() { return this.adminService.getUsers() }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard)
  async updateRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(id, body.role)
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard)
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(id, body)
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id)
  }

  @Get('vendors')
  getVendors() { return this.adminService.getVendors() }

  @Post('vendors')
  @UseGuards(JwtAuthGuard)
  createVendor(@Body() body: any) { return this.adminService.createVendor(body) }

  @Patch('vendors/:id')
  @UseGuards(JwtAuthGuard)
  updateVendor(@Param('id') id: string, @Body() body: any) { return this.adminService.updateVendor(id, body) }

  @Delete('vendors/:id')
  @UseGuards(JwtAuthGuard)
  deleteVendor(@Param('id') id: string) { return this.adminService.deleteVendor(id) }

  @Get('machines')
  getMachines() { return this.adminService.getMachines() }

  @Get('orders')
  getOrders() { return this.adminService.getOrders() }

  @Get('production')
  getProductionJobs() { return this.adminService.getProductionJobs() }

  @Get('stats')
  getStats() { return this.adminService.getStats() }

  @Get('role-requests')
  @UseGuards(JwtAuthGuard)
  getRoleRequests() { return this.adminService.getRoleRequests() }

  @Patch('users/:id/approve-role')
  @UseGuards(JwtAuthGuard)
  approveRole(@Param('id') id: string) { return this.adminService.approveRole(id) }

  @Patch('users/:id/reject-role')
  @UseGuards(JwtAuthGuard)
  rejectRole(@Param('id') id: string) { return this.adminService.rejectRole(id) }
}

@Controller('marketing')
export class MarketingController {
  constructor(private readonly adminService: AdminService) {}

  @Get('campaigns')
  getCampaigns() { return this.adminService.getCampaigns() }

  @Post('campaigns')
  @UseGuards(JwtAuthGuard)
  createCampaign(@Body() body: any) { return this.adminService.createCampaign(body) }

  @Patch('campaigns/:id')
  @UseGuards(JwtAuthGuard)
  updateCampaign(@Param('id') id: string, @Body() body: any) { return this.adminService.updateCampaign(id, body) }

  @Delete('campaigns/:id')
  @UseGuards(JwtAuthGuard)
  deleteCampaign(@Param('id') id: string) { return this.adminService.deleteCampaign(id) }
}