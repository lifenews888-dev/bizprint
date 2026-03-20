# BizPrint - Mail Workflow Setup
# Run: .\bizprint-mail-workflow.ps1

$SRC = "C:\Users\User\projects\bizprint\backend\src"

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  BizPrint Mail Workflow" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

function Write-File($path, $content) {
    $dir = Split-Path $path
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] $path" -ForegroundColor Green
}

# ============================================================
# 1. mail.service.ts - Add workflow email methods
# ============================================================
Write-Host ""
Write-Host "[1/3] Adding workflow emails to mail.service.ts..." -ForegroundColor Yellow

$mailPath = "$SRC\mail\mail.service.ts"
$mailContent = [System.IO.File]::ReadAllText($mailPath, [System.Text.Encoding]::UTF8)

$newMethods = @"

  async sendDesignerAssigned(params: {
    to: string; customerName: string; designerName: string;
    productName: string; orderId: string; zoomLink?: string;
  }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Tanii dizain ajil ekhellee',
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);padding:24px 32px;color:#fff">
    <h2 style="margin:0">BizPrint - Dizain update</h2>
  </div>
  <div style="padding:28px">
    <h3 style="margin:0 0 16px;color:#111">Sain baina uu, \${params.customerName}!</h3>
    <p style="color:#6b7280;margin:0 0 20px">Tanii <strong>\${params.productName}</strong> buteegedkheenii dizain ajlыг эхлүүллээ.</p>
    <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin-bottom:20px">
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px">Dizainer</div>
      <div style="font-size:16px;font-weight:700;color:#7C3AED">\${params.designerName}</div>
      \${params.zoomLink ? '<div style="margin-top:10px"><a href="' + params.zoomLink + '" style="background:#7C3AED;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px">Zoom uulzaltad negdekh</a></div>' : ''}
    </div>
    <p style="color:#6b7280;font-size:13px">Dizain duusmagts medegdel irne.</p>
  </div>
</div>`,
    })
  }

  async sendDesignApproved(params: {
    to: string; customerName: string; productName: string;
    orderId: string; fileUrl?: string;
  }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Dizain batlagdlaa - Khevlelд orloo',
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#10B981,#059669);padding:24px 32px;color:#fff">
    <h2 style="margin:0">BizPrint - Dizain batlagdlaa!</h2>
  </div>
  <div style="padding:28px">
    <h3 style="margin:0 0 16px;color:#111">Sain baina uu, \${params.customerName}!</h3>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center">
      <div style="font-size:32px;margin-bottom:8px">✅</div>
      <div style="font-size:16px;font-weight:700;color:#16a34a">\${params.productName}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">Dizain batlagdaj khevlelд orloo</div>
    </div>
    \${params.fileUrl ? '<div style="margin-bottom:20px;text-align:center"><a href="' + params.fileUrl + '" style="background:#10B981;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700">Dizain file tatakh</a></div>' : ''}
    <p style="color:#6b7280;font-size:13px;text-align:center">Khevlel duusmagts hurgeltin medeelel irne.</p>
  </div>
</div>`,
    })
  }

  async sendDeliveryStarted(params: {
    to: string; customerName: string; productName: string;
    courierName: string; courierPhone: string; address: string;
  }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Tanii zakHialgaa zamдаа!',
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#FF6B00,#F59E0B);padding:24px 32px;color:#fff">
    <h2 style="margin:0">BizPrint - Khurgelt эхлэллэе!</h2>
  </div>
  <div style="padding:28px">
    <h3 style="margin:0 0 16px;color:#111">Sain baina uu, \${params.customerName}!</h3>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:20px">
      <div style="font-size:32px;text-align:center;margin-bottom:12px">🚚</div>
      <div style="font-size:15px;font-weight:700;color:#FF6B00;text-align:center;margin-bottom:16px">\${params.productName} zamдаа!</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font-size:11px;color:#9a3412;font-weight:600">ЖОЛООЧ</div>
          <div style="font-size:14px;font-weight:700;color:#111">\${params.courierName}</div>
          <div style="font-size:13px;color:#6b7280">\${params.courierPhone}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#9a3412;font-weight:600">ХАЯГ</div>
          <div style="font-size:13px;color:#111">\${params.address}</div>
        </div>
      </div>
    </div>
    <p style="color:#6b7280;font-size:13px;text-align:center">Asуулт байвал: <strong>\${params.courierPhone}</strong></p>
  </div>
</div>`,
    })
  }

  async sendDeliveryCompleted(params: {
    to: string; customerName: string; productName: string;
  }) {
    await this.mailerService.sendMail({
      to: params.to,
      subject: 'BizPrint - Zakhialgaa khurgegdlee!',
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#10B981,#059669);padding:24px 32px;color:#fff">
    <h2 style="margin:0">BizPrint - Khurgegdlee!</h2>
  </div>
  <div style="padding:28px;text-align:center">
    <div style="font-size:48px;margin-bottom:16px">🎉</div>
    <h3 style="margin:0 0 8px;color:#111">Sain baina uu, \${params.customerName}!</h3>
    <p style="color:#6b7280;margin:0 0 20px">\${params.productName} amjilttai khurgegdlee.</p>
    <a href="http://localhost:3000/dashboard" style="background:#10B981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Dashboard kharakh</a>
  </div>
</div>`,
    })
  }
"@

# Insert before last closing brace
$mailFixed = $mailContent -replace '(\}\s*)$', "$newMethods`$1"
[System.IO.File]::WriteAllText($mailPath, $mailFixed, [System.Text.Encoding]::UTF8)
Write-Host "  [OK] mail.service.ts updated" -ForegroundColor Green

# ============================================================
# 2. design-requests.service.ts - inject MailService
# ============================================================
Write-Host "[2/3] Wiring emails to design-requests.service.ts..." -ForegroundColor Yellow

$dsPath = "$SRC\design-requests\design-requests.service.ts"
$dsContent = [System.IO.File]::ReadAllText($dsPath, [System.Text.Encoding]::UTF8)

# Check if MailService already imported
if ($dsContent -notmatch "MailService") {
    $dsContent = $dsContent -replace "(import \{ Injectable.*?\} from '@nestjs/common')", "`$1`nimport { MailService } from '../mail/mail.service'"
    $dsContent = $dsContent -replace "(constructor\([^)]*)\)", "`$1, private mailService: MailService)"
    [System.IO.File]::WriteAllText($dsPath, $dsContent, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] MailService injected into design-requests.service.ts" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] MailService already in design-requests.service.ts" -ForegroundColor Yellow
}

# ============================================================
# 3. delivery.service.ts - inject MailService
# ============================================================
Write-Host "[3/3] Wiring emails to delivery.service.ts..." -ForegroundColor Yellow

$delPath = "$SRC\delivery\delivery.service.ts"
$delContent = [System.IO.File]::ReadAllText($delPath, [System.Text.Encoding]::UTF8)

if ($delContent -notmatch "MailService") {
    $delContent = $delContent -replace "(import \{ Injectable.*?\} from '@nestjs/common')", "`$1`nimport { MailService } from '../mail/mail.service'"
    $delContent = $delContent -replace "(constructor\([^)]*)\)", "`$1, private mailService: MailService)"
    [System.IO.File]::WriteAllText($delPath, $delContent, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] MailService injected into delivery.service.ts" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] MailService already in delivery.service.ts" -ForegroundColor Yellow
}

# ============================================================
# DONE
# ============================================================
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  DONE!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Added email methods:" -ForegroundColor White
Write-Host "  sendDesignerAssigned   - designer tomiloh ued" -ForegroundColor Gray
Write-Host "  sendDesignApproved     - dizain batlah ued" -ForegroundColor Gray
Write-Host "  sendDeliveryStarted    - hurgelt uusgeh ued" -ForegroundColor Gray
Write-Host "  sendDeliveryCompleted  - hurgelt duusah ued" -ForegroundColor Gray
Write-Host ""
Write-Host "Next: call these methods in service logic" -ForegroundColor Yellow
Write-Host "  design-requests.service.ts -> assign() method" -ForegroundColor Gray
Write-Host "  design-requests.service.ts -> approve() method" -ForegroundColor Gray
Write-Host "  delivery.service.ts -> create() method" -ForegroundColor Gray
Write-Host "  delivery.service.ts -> updateStatus() method" -ForegroundColor Gray
Write-Host ""
