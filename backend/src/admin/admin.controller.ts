import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers() { return this.adminService.getUsers() }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(id, body.role)
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(id, body)
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id)
  }

  /** Broadcast notification to users (by role or all) */
  @Post('broadcast')
  @UseGuards(JwtAuthGuard, AdminGuard)
  broadcast(@Body() body: { title: string; message: string; roles?: string[]; send_email?: boolean; attachment_url?: string }) {
    return this.adminService.broadcast(body)
  }

  @Get('vendors')
  getVendors() { return this.adminService.getVendors() }

  @Get('machines')
  getMachines() { return this.adminService.getMachines() }

  @Get('orders')
  getOrders() { return this.adminService.getOrders() }

  @Get('production')
  getProductionJobs() { return this.adminService.getProductionJobs() }

  @Get('stats')
  getStats() { return this.adminService.getStats() }

  // ─── Verification Management ───
  @Get('users/pending-verification')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getPendingVerifications() {
    return this.adminService.getPendingVerifications()
  }

  @Patch('users/:id/verify')
  @UseGuards(JwtAuthGuard, AdminGuard)
  verifyUser(@Param('id') id: string, @Body() body: { status: string; note?: string; verified_by?: string }) {
    return this.adminService.verifyUser(id, body.status, body.note, body.verified_by)
  }
}
