# BizPrint - Mail Service Fix
# Run: .\bizprint-mail-fix.ps1

$SRC = "C:\Users\User\projects\bizprint\backend\src"

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  BizPrint Mail Service Fix" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

function Write-File($path, $content) {
    $dir = Split-Path $path
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] $path" -ForegroundColor Green
}

# ============================================================
# 1. Restore mail.service.ts - remove broken additions
# ============================================================
Write-Host ""
Write-Host "[1/3] Reading current mail.service.ts..." -ForegroundColor Yellow

$mailPath = "$SRC\mail\mail.service.ts"
$mailContent = [System.IO.File]::ReadAllText($mailPath, [System.Text.Encoding]::UTF8)

# Find the last closing brace of sendOrderConfirmation method - cut everything after it
$cutMarker = "async sendOrderConfirmation"
$idx = $mailContent.IndexOf($cutMarker)
if ($idx -gt 0) {
    # Find the closing brace after sendOrderConfirmation
    $sub = $mailContent.Substring($idx)
    $braceCount = 0
    $endIdx = 0
    $inMethod = $false
    for ($i = 0; $i -lt $sub.Length; $i++) {
        if ($sub[$i] -eq '{') { $braceCount++; $inMethod = $true }
        if ($sub[$i] -eq '}') { $braceCount-- }
        if ($inMethod -and $braceCount -eq 0) { $endIdx = $idx + $i; break }
    }
    $cleanContent = $mailContent.Substring(0, $endIdx + 1) + "`n}`n"
    Write-Host "  [OK] Cleaned broken methods" -ForegroundColor Green
} else {
    $cleanContent = $mailContent
    Write-Host "  [SKIP] sendOrderConfirmation not found, keeping as-is" -ForegroundColor Yellow
}

# ============================================================
# 2. Write clean new methods as separate file then append
# ============================================================
Write-Host "[2/3] Writing new mail methods..." -ForegroundColor Yellow

$newMailService = @'
import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  private fmt(n: number) {
    return Number(n).toLocaleString('mn-MN')
  }

  async sendOrderConfirmation(params: {
    to: string
    name: string
    orderId: string
    productName: string
    quantity: number
    total: number
    invoiceCode: string
  }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Zakhialgaa batalgaajlaa - ' + params.invoiceCode,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">' +
        '<div style="background:#FF6B00;padding:24px;color:#fff"><h2 style="margin:0">BizPrint</h2></div>' +
        '<div style="padding:28px">' +
        '<h3>Sain baina uu, ' + params.name + '!</h3>' +
        '<p>Tanii zakhialgaa <strong>' + params.invoiceCode + '</strong> amjilttai batalgaajlaa.</p>' +
        '<table style="width:100%;border-collapse:collapse">' +
        '<tr><td style="padding:8px;color:#666">Buteegedkheen</td><td style="padding:8px">' + params.productName + '</td></tr>' +
        '<tr><td style="padding:8px;color:#666">Too</td><td style="padding:8px">' + params.quantity + '</td></tr>' +
        '<tr><td style="padding:8px;color:#666;font-weight:700">Niit</td><td style="padding:8px;color:#FF6B00;font-weight:700">' + this.fmt(params.total) + 'T</td></tr>' +
        '</table>' +
        '</div></div>',
    })
  }

  async sendDesignerAssigned(params: {
    to: string
    customerName: string
    designerName: string
    productName: string
    orderId: string
    zoomLink?: string
  }) {
    const zoomHtml = params.zoomLink
      ? '<div style="margin-top:10px"><a href="' + params.zoomLink + '" style="background:#7C3AED;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px">Zoom uulzaltad negdekh</a></div>'
      : ''
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Tanii dizain ajil ekhellee',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">BizPrint - Dizain update</h2>' +
        '</div>' +
        '<div style="padding:28px">' +
        '<h3 style="margin:0 0 16px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
        '<p style="color:#6b7280;margin:0 0 20px">Tanii <strong>' + params.productName + '</strong> buteegedkheenii dizain ajil ekhelleel.</p>' +
        '<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin-bottom:20px">' +
        '<div style="font-size:13px;color:#6b7280;margin-bottom:4px">Dizainer</div>' +
        '<div style="font-size:16px;font-weight:700;color:#7C3AED">' + params.designerName + '</div>' +
        zoomHtml +
        '</div>' +
        '<p style="color:#6b7280;font-size:13px">Dizain duusmagts medegdel irne.</p>' +
        '</div></div>',
    })
  }

  async sendDesignApproved(params: {
    to: string
    customerName: string
    productName: string
    orderId: string
    fileUrl?: string
  }) {
    const fileHtml = params.fileUrl
      ? '<div style="margin-bottom:20px;text-align:center"><a href="' + params.fileUrl + '" style="background:#10B981;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700">Dizain file tatakh</a></div>'
      : ''
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Dizain batlagdlaa - Khevleld orloo',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#10B981,#059669);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">BizPrint - Dizain batlagdlaa!</h2>' +
        '</div>' +
        '<div style="padding:28px">' +
        '<h3 style="margin:0 0 16px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
        '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center">' +
        '<div style="font-size:32px;margin-bottom:8px">OK</div>' +
        '<div style="font-size:16px;font-weight:700;color:#16a34a">' + params.productName + '</div>' +
        '<div style="font-size:13px;color:#6b7280;margin-top:4px">Dizain batlagdaj khevleld orloo</div>' +
        '</div>' +
        fileHtml +
        '<p style="color:#6b7280;font-size:13px;text-align:center">Khevlel duusmagts hurgeltin medeelel irne.</p>' +
        '</div></div>',
    })
  }

  async sendDeliveryStarted(params: {
    to: string
    customerName: string
    productName: string
    courierName: string
    courierPhone: string
    address: string
  }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Tanii zakhialgaa zamdaa!',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#FF6B00,#F59E0B);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">BizPrint - Khurgelt ekhlelle!</h2>' +
        '</div>' +
        '<div style="padding:28px">' +
        '<h3 style="margin:0 0 16px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
        '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:20px">' +
        '<div style="font-size:15px;font-weight:700;color:#FF6B00;text-align:center;margin-bottom:16px">' + params.productName + ' zamdaa!</div>' +
        '<table style="width:100%">' +
        '<tr><td style="padding:6px;color:#9a3412;font-size:11px;font-weight:600">JOLOOCH</td><td style="padding:6px;color:#9a3412;font-size:11px;font-weight:600">KHAYAG</td></tr>' +
        '<tr><td style="padding:6px"><strong>' + params.courierName + '</strong><br><span style="color:#666">' + params.courierPhone + '</span></td>' +
        '<td style="padding:6px;font-size:13px">' + params.address + '</td></tr>' +
        '</table>' +
        '</div>' +
        '<p style="color:#6b7280;font-size:13px;text-align:center">Asuult baival: <strong>' + params.courierPhone + '</strong></p>' +
        '</div></div>',
    })
  }

  async sendDeliveryCompleted(params: {
    to: string
    customerName: string
    productName: string
  }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Zakhialgaa khurgegdlee!',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#10B981,#059669);padding:24px 32px;color:#fff">' +
        '<h2 style="margin:0">BizPrint - Khurgegdlee!</h2>' +
        '</div>' +
        '<div style="padding:28px;text-align:center">' +
        '<div style="font-size:48px;margin-bottom:16px">:)</div>' +
        '<h3 style="margin:0 0 8px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
        '<p style="color:#6b7280;margin:0 0 20px">' + params.productName + ' amjilttai khurgegdlee.</p>' +
        '<a href="http://localhost:3000/dashboard" style="background:#10B981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Dashboard kharakh</a>' +
        '</div></div>',
    })
  }

  async sendQuoteToCustomer(q: {
    to: string; name: string; phone: string; quote_number: string;
    product_name: string; quantity: number; pages: number; size: string;
    width_mm: number; height_mm: number; paper_type: string; paper_gsm: number;
    color_mode: string; sides: string; finishing: string; binding: string;
    unit_price: number; total_price: number; valid_until: Date; breakdown: any;
  }) {
    const fmt = (n: number) => Number(n).toLocaleString('mn-MN')
    const bd = q.breakdown || {}
    await this.mailerService.sendMail({
      to: q.to,
      subject: 'BizPrint - ' + q.quote_number + ' - Uniin sanal',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#FF6B00,#FF8C42);padding:28px 32px;color:#fff">' +
        '<h1 style="margin:0;font-size:24px">BizPrint</h1>' +
        '</div>' +
        '<div style="padding:32px">' +
        '<h2 style="margin:0 0 8px;color:#111">Sain baina uu, ' + q.name + '!</h2>' +
        '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px;margin-bottom:24px">' +
        '<div style="font-size:22px;font-weight:800;color:#FF6B00">' + q.quote_number + '</div>' +
        '<div style="font-size:28px;font-weight:800;color:#FF6B00">' + fmt(q.total_price) + 'T</div>' +
        '</div>' +
        '<p>Une: ' + fmt(q.unit_price) + 'T/shirkheg | Niit: ' + fmt(q.total_price) + 'T</p>' +
        '</div></div>',
    })
  }

  async sendDailyReport(adminEmail: string, quotes: any[], date: string) {
    const total = quotes.reduce((s, q) => s + Number(q.total_price), 0)
    const fmt = (n: number) => Number(n).toLocaleString('mn-MN')
    await this.mailerService.sendMail({
      to: adminEmail,
      subject: 'BizPrint - ' + date + ' - ' + quotes.length + ' uniin sanal',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">' +
        '<div style="background:#FF6B00;padding:24px;color:#fff"><h2 style="margin:0">BizPrint - Odoriin tailan</h2><p style="margin:4px 0 0">' + date + '</p></div>' +
        '<div style="padding:24px">' +
        '<p>Niit quote: <strong>' + quotes.length + '</strong></p>' +
        '<p>Niit dun: <strong style="color:#FF6B00">' + fmt(total) + 'T</strong></p>' +
        '</div></div>',
    })
  }
}
'@

Write-File "$SRC\mail\mail.service.ts" $newMailService

# ============================================================
# 3. Fix constructor injection in delivery + design-requests
# ============================================================
Write-Host "[3/3] Fixing constructor injections..." -ForegroundColor Yellow

# Fix delivery.service.ts - remove broken injection
$delPath = "$SRC\delivery\delivery.service.ts"
$delContent = [System.IO.File]::ReadAllText($delPath, [System.Text.Encoding]::UTF8)
# Fix broken @InjectRepository line
$delContent = $delContent -replace '@InjectRepository\(Delivery, private mailService: MailService\)', '@InjectRepository(Delivery)'
$delContent = $delContent -replace 'import \{ MailService \} from.*\n', ''
[System.IO.File]::WriteAllText($delPath, $delContent, [System.Text.Encoding]::UTF8)
Write-Host "  [OK] delivery.service.ts fixed" -ForegroundColor Green

# Fix design-requests.service.ts - remove broken injection
$dsPath = "$SRC\design-requests\design-requests.service.ts"
$dsContent = [System.IO.File]::ReadAllText($dsPath, [System.Text.Encoding]::UTF8)
$dsContent = $dsContent -replace '@InjectRepository\(DesignRequest, private mailService: MailService\)', '@InjectRepository(DesignRequest)'
$dsContent = $dsContent -replace 'import \{ MailService \} from.*\n', ''
[System.IO.File]::WriteAllText($dsPath, $dsContent, [System.Text.Encoding]::UTF8)
Write-Host "  [OK] design-requests.service.ts fixed" -ForegroundColor Green

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  DONE! Backend should compile now." -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
