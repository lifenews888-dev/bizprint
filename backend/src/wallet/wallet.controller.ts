import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private svc: WalletService) {}

  @Get()
  getWalletSummary(@Request() req: any) {
    return this.svc.getBalance(req.user.id);
  }

  @Get('balance')
  getBalance(@Request() req: any) {
    return this.svc.getBalance(req.user.id);
  }

  @Get('transactions')
  getTransactions(@Request() req: any) {
    return this.svc.getTransactions(req.user.id);
  }

  @Post('withdraw')
  requestWithdraw(@Request() req: any, @Body() body: {
    amount: number; note?: string;
    bank_name?: string; bank_account?: string; bank_account_name?: string
  }) {
    return this.svc.requestWithdraw(
      req.user.id, body.amount, body.note,
      body.bank_name, body.bank_account, body.bank_account_name
    );
  }

  @Get('withdraw-requests')
  getAllWithdrawRequests() {
    return this.svc.getAllWithdrawRequests();
  }

  @Patch('withdraw-requests/:id/approve')
  approveWithdraw(@Param('id') id: string) {
    return this.svc.approveWithdraw(id);
  }

  @Patch('withdraw-requests/:id/reject')
  rejectWithdraw(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.svc.rejectWithdraw(id, body.reason);
  }
}