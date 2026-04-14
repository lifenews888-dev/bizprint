import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BonumService {
  private readonly logger = new Logger(BonumService.name);
  private accessToken = '';
  private tokenExpiry = new Date(0);

  private get BASE() {
    return process.env.BONUM_API_BASE || 'https://testapi.bonum.mn';
  }

  private get SECRET() {
    return process.env.BONUM_APP_SECRET || '';
  }

  async getToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }
    const res = await fetch(`${this.BASE}/bonum-gateway/auth/token`, {
      headers: {
        Authorization: `Bearer ${this.SECRET}`,
        'Accept-Language': 'mn',
      },
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Bonum auth failed: ${res.status} ${err}`);
    }
    const data: any = await res.json();
    this.accessToken = data.accessToken || data.access_token || '';
    this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
    this.logger.log('Bonum token refreshed');
    return this.accessToken;
  }

  async createInvoice(params: {
    orderId: string;
    amount: number;
    description?: string;
    providers?: string[];
    items?: Array<{ title: string; amount: number; count: number; image?: string }>;
  }): Promise<{ invoiceId: string; followUpLink: string }> {
    const token = await this.getToken();
    const backendUrl = process.env.BACKEND_URL || 'https://bizprint-production.up.railway.app';

    const body = {
      amount: params.amount,
      callback: `${backendUrl}/api/payment/bonum/webhook`,
      transactionId: `BP-${params.orderId.slice(0, 8)}-${Date.now()}`,
      expiresIn: 3600,
      providers: params.providers || ['QPAY'],
      items: params.items || [
        {
          title: params.description || `BizPrint #${params.orderId.slice(0, 8)}`,
          amount: params.amount,
          count: 1,
        },
      ],
    };

    const res = await fetch(`${this.BASE}/bonum-gateway/ecommerce/invoices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept-Language': 'mn',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      this.logger.error(`Bonum createInvoice error: ${err}`);
      throw new Error(`Invoice creation failed: ${res.status}`);
    }

    const data: any = await res.json();
    this.logger.log(`Bonum invoice created: ${data.invoiceId}`);
    return { invoiceId: data.invoiceId, followUpLink: data.followUpLink };
  }

  async getProviders(): Promise<any> {
    try {
      const token = await this.getToken();
      const res = await fetch(
        `${this.BASE}/bonum-gateway/ecommerce/invoices/payment-providers`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res.json();
    } catch {
      return [{ provider: 'QPAY', enabled: true }];
    }
  }

  async getInvoiceStatus(invoiceId: string): Promise<any> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.BASE}/bonum-gateway/ecommerce/invoices/${invoiceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    );
    return res.json();
  }
}
