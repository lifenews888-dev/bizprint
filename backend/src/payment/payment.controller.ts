import { Controller, Post, Body, Get, Param } from '@nestjs/common'
import { PaymentService } from './payment.service'
import axios from 'axios'

@Controller('payment')
export class PaymentController {
  private readonly BASE_URL = 'https://qrservice.tdbmlabs.mn'
  private readonly USERNAME = 'tdbm'
  private readonly PASSWORD = 'tdbm'
  private readonly TERMINAL_ID = '91200026'

  constructor(private readonly paymentService: PaymentService) {}

  private async getToken(): Promise<string> {
    const res = await axios.post(this.BASE_URL + '/api/v1/login', {
      username: this.USERNAME,
      password: this.PASSWORD,
    })
    return res.data?.data?.token || ''
  }

  @Post('create')
  async createInvoice(@Body() body: { amount: number; orderId: string }) {
    try {
      const token = await this.getToken()
      const res = await axios.post(this.BASE_URL + '/api/v1/invoice', {
        qrType: 'dynamic',
        transactionType: 1,
        qrGenerator: 'TDBM',
        accountNumber: ' ',
        amount: body.amount,
        bankCode: 'TDBMNUB',
        curCode: 'MNT',
        terminalId: this.TERMINAL_ID,
        additional: {
          purposeTransaction: 'BizPrint ' + body.orderId,
          callbackUrl: 'http://localhost:4000/payment/callback',
        },
      }, { headers: { Authorization: 'Bearer ' + token } })
      return res.data
    } catch (e) {
      return { success: false, msg: e.message }
    }
  }

  @Get('status/:invoiceNo')
  async getStatus(@Param('invoiceNo') invoiceNo: string) {
    try {
      const token = await this.getToken()
      const res = await axios.get(this.BASE_URL + '/api/v1/invoice/' + invoiceNo, {
        headers: { Authorization: 'Bearer ' + token },
      })
      return res.data
    } catch (e) {
      return { success: false, msg: e.message }
    }
  }

  @Post('callback')
  async callback(@Body() body: any) {
    console.log('TDB Payment Callback:', body)
    try {
      const invoiceNo = body?.invoiceNo || body?.invoice_code || body?.invoiceCode
      if (invoiceNo) {
        const result = await this.paymentService.confirmPayment(invoiceNo)
        console.log('Order updated:', result)
        return { success: true, result }
      }
      return { success: false, msg: 'invoice_code not found in callback' }
    } catch (e) {
      console.error('Callback error:', e.message)
      return { success: false, msg: e.message }
    }
  }
}