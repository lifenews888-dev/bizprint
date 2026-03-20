import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { CustomerCareService } from './customer-care.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard } from '../admin/admin.guard'
import { InteractionType } from './entities/customer-interaction.entity'

@Controller()
export class CustomerCareController {
  constructor(private service: CustomerCareService) {}

  // Admin endpoints
  @Get('admin/customers')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(@Query() query: any) {
    return this.service.findAllCustomers(query)
  }

  @Get('admin/customers/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOneCustomer(id)
  }

  @Put('admin/customers/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.updateCustomer(id, body)
  }

  @Get('admin/customers/:id/interactions')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getInteractions(@Param('id') id: string) {
    return this.service.getInteractions(id)
  }

  @Post('admin/customers/:id/interactions')
  @UseGuards(JwtAuthGuard, AdminGuard)
  addInteraction(@Param('id') id: string, @Body() body: any) {
    return this.service.addInteraction(id, body.type || InteractionType.CALL_NOTE, body.title, body.content, body.created_by)
  }

  @Get('admin/customers/:id/tickets')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getCustomerTickets(@Param('id') id: string) {
    return this.service.getCustomerTickets(id)
  }

  // Support Tickets - Admin
  @Get('admin/support-tickets')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllTickets(@Query() query: any) {
    return this.service.findAllTickets(query)
  }

  @Post('admin/support-tickets')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createTicket(@Body() body: any) {
    return this.service.createTicket(body)
  }

  @Put('admin/support-tickets/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateTicket(@Param('id') id: string, @Body() body: any) {
    return this.service.updateTicket(id, body)
  }

  @Post('admin/support-tickets/:id/reply')
  @UseGuards(JwtAuthGuard, AdminGuard)
  replyToTicket(@Param('id') id: string, @Body() body: any) {
    return this.service.replyToTicket(id, body.message, body.sender || 'admin')
  }

  // Customer-facing endpoints
  @Get('customer/my-profile')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@Request() req: any) {
    return this.service.getMyProfile(req.user.sub || req.user.id)
  }

  @Post('customer/support')
  @UseGuards(JwtAuthGuard)
  createCustomerTicket(@Request() req: any, @Body() body: any) {
    return this.service.createCustomerTicket(req.user.sub || req.user.id, body)
  }

  @Get('customer/support/my-tickets')
  @UseGuards(JwtAuthGuard)
  getMyTickets(@Request() req: any) {
    return this.service.getMyTickets(req.user.sub || req.user.id)
  }
}
