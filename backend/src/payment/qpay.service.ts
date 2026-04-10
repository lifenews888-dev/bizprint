import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'

const QPAY_BASE = process.env.QPAY_BASE_URL || 'https://merchant.qpay.mn/v2'
const QPAY_USERNAME = process.env.QPAY_USERNAME || ''
const QPAY_PASSWORD = process.env.QPAY_PASSWORD || ''
const QPAY_INVOICE_CODE = process.env.QPAY_INVOICE_CODE || 'BIZPRINT_INVOICE'

@Injectable()
export class QPayService {
  private readonly logger = new Logger(QPayService.name)
  private token = ''
  private tokenExpiry = new Date(0)

  async getToken(): Promise<string> {
    if (this.token && this.tokenExpiry > new Date()) return this.token
    if (!QPAY_USERNAME || !QPAY_PASSWORD) {
      this.logger.warn('QPay credentials not configured')
      return ''
    }
    try {
      const res = await axios.post(`${QPAY_BASE}/auth/token`, {}, {
        auth: { username: QPAY_USERNAME, password: QPAY_PASSWORD },
      })
      this.token = res.data.access_token
      this.tokenExpiry = new Date(Date.now() + 3500000)
      return this.token
    } catch (e: any) {
      this.logger.error('QPay auth failed: ' + e.message)
      return ''
    }
  }

  async createInvoice(params: { orderId: string; amount: number; description: string; callbackUrl: string }) {
    const token = await this.getToken()
    if (!token) return { error: 'QPay тохируулаагүй байна' }

    try {
      const res = await axios.post(`${QPAY_BASE}/invoice`, {
        invoice_code: QPAY_INVOICE_CODE,
        sender_invoice_no: params.orderId,
        invoice_receiver_code: 'terminal',
        invoice_description: params.description,
        amount: params.amount,
        callback_url: params.callbackUrl,
      }, { headers: { Authorization: `Bearer ${token}` } })
      return res.data
    } catch (e: any) {
      this.logger.error('QPay invoice creation failed: ' + e.message)
      return { error: e.message }
    }
  }

  async checkPayment(invoiceId: string) {
    const token = await this.getToken()
    if (!token) return { error: 'QPay тохируулаагүй байна' }

    try {
      const res = await axios.post(`${QPAY_BASE}/payment/check`, {
        object_type: 'INVOICE',
        object_id: invoiceId,
      }, { headers: { Authorization: `Bearer ${token}` } })
      return res.data
    } catch (e: any) {
      return { error: e.message }
    }
  }
}
