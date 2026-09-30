/**
 * JDF 1.4 ажлын тасалбар. RIP-үүд (Onyx, Caldera, PrintFactory гэх мэт)
 * hotfolder-оос файлтай хамт уншиж, spot өнгийг нэрээр нь (BP-R101)
 * өөрийн spot сангаас хайж, принтерийн ICC профайлаар хөрвүүлнэ.
 * RIP JDF уншдаггүй бол агент мөн JSON хувилбарыг хажууд нь бичнэ.
 */

export interface TicketColor {
  code: string
  name: string
  lab: { l: number; a: number; b: number }
  recipe?: Record<string, any> | null
}

export interface TicketData {
  ticketId: string
  orderId: string
  orderNumber?: string | null
  productType: string
  quantity: number
  widthMm?: number | null
  heightMm?: number | null
  media?: string | null
  fileUrl: string
  fileName: string
  colors: TicketColor[]
  device: { id: string; name: string; technology: string }
  notes?: string | null
}

const esc = (v: unknown) =>
  String(v ?? '')
    // XML 1.0-д хориотой удирдах тэмдэгт (захиалагчийн тайлбараас) RIP-ийн parser-ийг эвддэг
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const MM_TO_PT = 72 / 25.4

export function buildJdf(t: TicketData): string {
  const dims =
    t.widthMm && t.heightMm
      ? ` Dimension="${(t.widthMm * MM_TO_PT).toFixed(2)} ${(t.heightMm * MM_TO_PT).toFixed(2)}"`
      : ''
  const colors = t.colors
    .map(
      (c) =>
        `      <Color Name="${esc(c.code)}" ActualName="${esc(c.code)}" Lab="${c.lab.l} ${c.lab.a} ${c.lab.b}" ColorType="Normal"/><!-- ${esc(c.name).replace(/-{2,}/g, '-')} -->`,
    )
    .join('\n')
  const separations = t.colors.map((c) => `        <SeparationSpec Name="${esc(c.code)}"/>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<JDF xmlns="http://www.CIP4.org/JDFSchema_1_1" ID="BP_${esc(t.ticketId)}" JobID="${esc(t.orderNumber || t.orderId)}"
     JobPartID="${esc(t.ticketId)}" Type="Combined" Types="Interpreting Rendering DigitalPrinting"
     Status="Waiting" Version="1.4" DescriptiveName="${esc(t.productType)} x${t.quantity}">
  <Comment Name="BizPrint">device=${esc(t.device.name)}; tech=${esc(t.device.technology)}${t.notes ? '; ' + esc(t.notes) : ''}</Comment>
  <ResourcePool>
    <RunList ID="RL1" Class="Parameter" Status="Available">
      <LayoutElement>
        <FileSpec URL="${esc(t.fileName)}"/>
      </LayoutElement>
    </RunList>
    <Media ID="M1" Class="Consumable" Status="Available" DescriptiveName="${esc(t.media || 'default')}"${dims}/>
    <ColorPool ID="CP1" Class="Parameter" Status="Available">
${colors}
    </ColorPool>
    <ColorantControl ID="CC1" Class="Parameter" Status="Available">
      <ColorantParams>
${separations}
      </ColorantParams>
    </ColorantControl>
    <Component ID="C1" Class="Quantity" Status="Unavailable" Amount="${t.quantity}"/>
  </ResourcePool>
  <ResourceLinkPool>
    <RunListLink rRef="RL1" Usage="Input"/>
    <MediaLink rRef="M1" Usage="Input"/>
    <ColorPoolLink rRef="CP1" Usage="Input"/>
    <ColorantControlLink rRef="CC1" Usage="Input"/>
    <ComponentLink rRef="C1" Usage="Output" Amount="${t.quantity}"/>
  </ResourceLinkPool>
</JDF>
`
}
