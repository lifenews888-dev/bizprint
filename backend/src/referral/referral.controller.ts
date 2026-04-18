import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ReferralService } from './referral.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('referral')
export class ReferralController {
  constructor(private svc: ReferralService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyReferral(@Request() req: any) {
    return this.svc.getOrCreate(req.user.id)
  }

  @Get('stats/:userId')
  @UseGuards(JwtAuthGuard)
  getStats(@Param('userId') userId: string) {
    return this.svc.getStats(userId)
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.svc.findByCode(code)
  }

  /** Public — called right after registration when ?ref= param present */
  @Post('track')
  track(@Body() body: { code: string; referred_user_id: string }) {
    return this.svc.trackReferral(body.code, body.referred_user_id)
  }
}