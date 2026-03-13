import { Controller, Get } from '@nestjs/common'
import { AdminService } from './admin.service'

@Controller('admin')
export class AdminController {

  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers() {
    return this.adminService.getUsers()
  }

  @Get('vendors')
  getVendors() {
    return this.adminService.getVendors()
  }

  @Get('machines')
  getMachines() {
    return this.adminService.getMachines()
  }

  @Get('orders')
  getOrders() {
    return this.adminService.getOrders()
  }

  @Get('production')
  getProductionJobs() {
    return this.adminService.getProductionJobs()
  }

}