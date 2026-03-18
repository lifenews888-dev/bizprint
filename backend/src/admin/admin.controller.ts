import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
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
}