import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { AdminGuard } from '../admin/admin.guard';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly service: MarketingService) {}

  @Get('campaigns')
  findAll() {
    return this.service.findAll();
  }

  @Post('campaigns')
  @UseGuards(AdminGuard)
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch('campaigns/:id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete('campaigns/:id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('email/summary')
  @UseGuards(AdminGuard)
  emailSummary() {
    return this.service.emailSummary();
  }

  @Get('email/contacts')
  @UseGuards(AdminGuard)
  emailContacts(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('tag') tag?: string,
  ) {
    return this.service.findEmailContacts({ search, status, source, tag });
  }

  @Post('email/contacts')
  @UseGuards(AdminGuard)
  createEmailContact(@Body() body: any) {
    return this.service.upsertEmailContact({ ...body, source: body.source || 'manual' });
  }

  @Post('email/contacts/import')
  @UseGuards(AdminGuard)
  importEmailContacts(@Body() body: any) {
    return this.service.importEmailContacts(body);
  }

  @Post('email/contacts/sync-users')
  @UseGuards(AdminGuard)
  syncRegisteredUsers() {
    return this.service.syncRegisteredUsers();
  }

  @Get('email/campaigns')
  @UseGuards(AdminGuard)
  emailCampaigns() {
    return this.service.listEmailCampaigns();
  }

  @Post('email/campaigns')
  @UseGuards(AdminGuard)
  createEmailCampaign(@Body() body: any) {
    return this.service.createEmailCampaign(body);
  }

  @Post('email/campaigns/:id/send')
  @UseGuards(AdminGuard)
  sendEmailCampaign(@Param('id') id: string, @Body() body: any) {
    return this.service.sendEmailCampaign(id, body || {});
  }

  @Get('email/unsubscribe')
  unsubscribeEmail(@Query('email') email: string) {
    return this.service.unsubscribeEmail(email);
  }
}
