import { Controller, Get, Patch, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('role') role?: string, @Query('limit') limit?: string) {
    return this.usersService.findAll({ role, limit: limit ? parseInt(limit) : undefined });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Request() req, @Body() body: any) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  // Public — no auth required for marketplace browsing
  @Get('creators')
  getCreators() {
    return this.usersService.findCreators();
  }

  @Get('creators/:id')
  getCreator(@Param('id') id: string) {
    return this.usersService.findCreatorById(id);
  }
}