import { Controller, Post, Body, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  logout(@Body('refresh_token') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  logoutAll(@Request() req: any) {
    return this.authService.logoutAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }

  // Upload KYC documents (URLs from /upload endpoint)
  @UseGuards(JwtAuthGuard)
  @Patch('me/documents')
  updateDocuments(@Request() req: any, @Body() body: {
    id_card_front_url?: string; id_card_back_url?: string;
    business_license_url?: string; certification_url?: string;
  }) {
    return this.authService.updateDocuments(req.user.sub || req.user.id, body);
  }

  // ─── Forgot / Reset Password (public, no auth) ───
  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('validate-reset-token/:token')
  validateResetToken(@Param('token') token: string) {
    return this.authService.validateResetToken(token);
  }

  // Admin: change any user's role
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('users/:id/role')
  changeRole(@Param('id') id: string, @Body('role') role: string) {
    return this.authService.changeRole(id, role);
  }

  // One-off: bootstrap or reset admin account (protected by secret)
  @Post('bootstrap-admin')
  bootstrapAdmin(@Body() body: { secret: string; email?: string; password?: string }) {
    const expected = process.env.BOOTSTRAP_SECRET || 'bizprint-bootstrap-2026';
    if (body.secret !== expected) {
      return { error: 'Invalid secret' };
    }
    return this.authService.bootstrapAdmin(body.email, body.password);
  }
}
