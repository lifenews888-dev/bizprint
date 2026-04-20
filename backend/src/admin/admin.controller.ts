import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Users ───
  @Get('users')
  getUsers() { return this.adminService.getUsers() }

  @Patch('users/:id/role')
  updateRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(id, body.role)
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(id, body)
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id)
  }

  /** Broadcast notification to users (by role or all) */
  @Post('broadcast')
  broadcast(@Body() body: { title: string; message: string; roles?: string[]; send_email?: boolean; attachment_url?: string }) {
    return this.adminService.broadcast(body)
  }

  // ─── Vendors ───
  @Get('vendors')
  getVendors() { return this.adminService.getVendors() }

  @Post('vendors')
  createVendor(@Body() body: any) { return this.adminService.createVendor(body) }

  @Patch('vendors/:id')
  updateVendor(@Param('id') id: string, @Body() body: any) { return this.adminService.updateVendor(id, body) }

  @Delete('vendors/:id')
  deleteVendor(@Param('id') id: string) { return this.adminService.deleteVendor(id) }

  // ─── Machines / Orders / Production ───
  @Get('machines')
  getMachines() { return this.adminService.getMachines() }

  @Get('orders')
  getOrders() { return this.adminService.getOrders() }

  @Get('production')
  getProductionJobs() { return this.adminService.getProductionJobs() }

  @Get('stats')
  getStats() { return this.adminService.getStats() }

  // ─── Role Requests ───
  @Get('role-requests')
  getRoleRequests() { return this.adminService.getRoleRequests() }

  @Patch('users/:id/approve-role')
  approveRole(@Param('id') id: string) { return this.adminService.approveRole(id) }

  @Patch('users/:id/reject-role')
  rejectRole(@Param('id') id: string) { return this.adminService.rejectRole(id) }

  // ─── Verification Management ───
  @Get('users/pending-verification')
  getPendingVerifications() { return this.adminService.getPendingVerifications() }

  @Patch('users/:id/verify')
  verifyUser(@Param('id') id: string, @Body() body: { status: string; note?: string; verified_by?: string }) {
    return this.adminService.verifyUser(id, body.status, body.note, body.verified_by)
  }
}

// ─── Marketing (separate /marketing route, admin-guarded) ───
@Controller('marketing')
@UseGuards(JwtAuthGuard, AdminGuard)
export class MarketingController {
  constructor(private readonly adminService: AdminService) {}

  @Get('campaigns')
  getCampaigns() { return this.adminService.getCampaigns() }

  @Post('campaigns')
  createCampaign(@Body() body: any) { return this.adminService.createCampaign(body) }

  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() body: any) { return this.adminService.updateCampaign(id, body) }

  @Delete('campaigns/:id')
  deleteCampaign(@Param('id') id: string) { return this.adminService.deleteCampaign(id) }
}
