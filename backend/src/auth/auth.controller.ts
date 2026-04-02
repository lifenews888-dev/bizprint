import { Controller, Post, Body, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
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

  // TEMP: One-time seed endpoint — REMOVE after first admin is created
  @Post('seed-admin')
  async seedAdmin(@Body('email') email: string, @Body('secret') secret: string) {
    if (secret !== 'bizprint-seed-2026') throw new Error('Invalid secret');
    return this.authService['userRepository']
      .findOne({ where: { email } })
      .then((u: any) => {
        if (!u) throw new Error('User not found');
        return this.authService.changeRole(u.id, 'admin');
      });
  }

  // Admin: change any user's role
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('users/:id/role')
  changeRole(@Param('id') id: string, @Body('role') role: string) {
    return this.authService.changeRole(id, role);
  }
}
