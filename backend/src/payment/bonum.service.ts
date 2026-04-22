import { Injectable, Logger } from '@nestjs/common';

/**
 * Bonum PSP Gateway client.
 * Documented at https://docs.bonum.mn (Bonum Merchant Guide, 2026).
 *
 * Key behaviors:
 * - Auth endpoint: GET /bonum-gateway/ecommerce/auth/create with
 *   Authorization: AppSecret {APP_SECRET} + X-TERMINAL-ID header.
 * - Access token lives 1800s (30min); Bonum rate-limits fresh auth to
 *   once per ~25min. We cache for 28min and prefer refresh flow.
 * - Invoice create: POST /bonum-gateway/ecommerce/invoices with
 *   Authorization: Bearer {accessToken}. Response.followUpLink is the
 *   hosted payment page we redirect the customer to.
 * - Webhook: x-checksum-v2 header is HmacSHA256(raw_body, CHECKSUM_KEY).
 */
@Injectable()
export class BonumService {
  private readonly logger = new Logger(BonumService.name);
  private accessToken = '';
  private refreshToken = '';
  private tokenExpiry = new Date(0);
  private rateLimitedUntil = 0;

  private get BASE() {
    return process.env.BONUM_API_BASE || 'https://testapi.bonum.mn';
  }
  private get SECRET() {
    return process.env.BONUM_APP_SECRET || '';
  }
  private get TERMINAL_ID() {
    return process.env.BONUM_TERMINAL_ID || '';
  }

  // ─── Auth ────────────────────────────────────────────────
  async getToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }
    if (!this.SECRET || !this.TERMINAL_ID) {
      throw new Error('Bonum credentials not configured (BONUM_APP_SECRET, BONUM_TERMINAL_ID)');
    }
    if (Date.now() < this.rateLimitedUntil) {
      const secs = Math.ceil((this.rateLimitedUntil - Date.now()) / 1000);
      throw new Error(`Bonum rate-limited, retry in ${secs}s`);
    }

    // Prefer refresh flow — avoids 25-min /auth/create rate-limit when restart
    // happens but refresh token is still in memory (rare but cheap to try).
    if (this.refreshToken) {
      try {
        const res = await fetch(`${this.BASE}/bonum-gateway/ecommerce/auth/refresh`, {
          headers: { Authorization: `Bearer ${this.refreshToken}` },
        });
        if (res.ok) {
          const data: any = await res.json();
          this.accessToken = data.accessToken || '';
          this.refreshToken = data.refreshToken || this.refreshToken;
          this.tokenExpiry = new Date(Date.now() + 28 * 60 * 1000);
          this.logger.log('Bonum token refreshed via refresh-flow');
          return this.accessToken;
        }
      } catch (e: any) {
        this.logger.warn(`Bonum refresh failed, falling back to fresh auth: ${e.message}`);
      }
    }

    // Fresh auth — rate-limited to ≥25min by Bonum
    const res = await fetch(`${this.BASE}/bonum-gateway/ecommerce/auth/create`, {
      headers: {
        Authorization: `AppSecret ${this.SECRET}`,
        'X-TERMINAL-ID': this.TERMINAL_ID,
        'Accept-Language': 'mn',
      },
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      if (res.status === 429) {
        // Respect Bonum rate-limit: stop hammering the auth endpoint
        this.rateLimitedUntil = Date.now() + 5 * 60 * 1000;
      }
      throw new Error(`Bonum auth failed: ${res.status} ${err}`);
    }
    const data: any = await res.json();
    this.accessToken = data.accessToken || '';
    this.refreshToken = data.refreshToken || '';
    this.tokenExpiry = new Date(Date.now() + 28 * 60 * 1000);
    this.logger.log('Bonum token obtained via fresh auth');
    return this.accessToken;
  }

  // ─── Invoice ────────────────────────────────────────────
  async createInvoice(params: {
    orderId: string;
    amount: number;
    description?: string;
    providers?: string[];
    items?: Array<{ title: string; amount: number; count: number; image?: string; remark?: string }>;
  }): Promise<{ invoiceId: string; followUpLink: string }> {
    const token = await this.getToken();
    const backendUrl = process.env.BACKEND_URL || 'https://api.bizprint.mn';

    const body = {
      amount: Math.round(params.amount),
      callback: `${backendUrl}/api/payment/bonum/webhook`,
      transactionId: `BP-${params.orderId.slice(0, 8)}-${Date.now()}`,
      expiresIn: 3600,
      providers: params.providers || ['QPAY', 'E_COMMERCE', 'WE_CHAT', 'SONO_SHOP'],
      items: params.items || [
        {
          title: params.description || `BizPrint #${params.orderId.slice(0, 8)}`,
          amount: Math.round(params.amount),
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
      this.logger.error(`Bonum createInvoice failed: ${res.status} ${err}`);
      throw new Error(`Invoice creation failed: ${res.status} ${err}`);
    }

    const data: any = await res.json();
    this.logger.log(`Bonum invoice created: ${data.invoiceId} for order ${params.orderId}`);
    return { invoiceId: data.invoiceId, followUpLink: data.followUpLink };
  }

  async getProviders(): Promise<any> {
    try {
      const token = await this.getToken();
      const res = await fetch(
        `${this.BASE}/bonum-gateway/ecommerce/invoices/payment-providers`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  }

  async getInvoiceStatus(invoiceId: string): Promise<any> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.BASE}/bonum-gateway/ecommerce/invoices/${invoiceId}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
    );
    return res.ok ? await res.json() : null;
  }
}
