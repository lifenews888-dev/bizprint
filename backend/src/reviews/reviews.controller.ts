import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ReviewsService } from './reviews.service'

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  @Post()
  create(@Body() body: { customer_name: string; customer_company?: string; rating: number; text: string; product_category?: string }) {
    return this.svc.create(body)
  }

  @Get()
  find(@Query('approved') approved: string) {
    return approved === 'true' ? this.svc.findApproved() : this.svc.findAll()
  }

  @Get('summary')
  summary() {
    return this.svc.summary()
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string) {
    return this.svc.approve(id)
  }
}
