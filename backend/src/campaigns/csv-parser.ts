/**
 * Minimal RFC-4180 CSV parser. Handles:
 *   - comma separator
 *   - double-quoted fields with embedded commas, newlines, and "" escapes
 *   - LF and CRLF line endings
 *   - UTF-8 BOM stripping
 *
 * Returns string[][] of rows. Caller maps the first row as headers.
 *
 * Why not bring in csv-parse / papaparse: keeping the dependency tree
 * lean and the import surface explicit. Recipient CSVs are simple.
 */
export function parseCsv(input: string): string[][] {
  if (!input) return []
  // Strip UTF-8 BOM
  if (input.charCodeAt(0) === 0xFEFF) input = input.slice(1)

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inQuotes) {
      if (ch === '"' && input[i + 1] === '"') { field += '"'; i++ }       // escaped quote
      else if (ch === '"') { inQuotes = false }
      else { field += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { row.push(field); field = '' }
      else if (ch === '\n' || ch === '\r') {
        // commit cell + row, swallow CRLF as one
        row.push(field); field = ''
        rows.push(row); row = []
        if (ch === '\r' && input[i + 1] === '\n') i++
      } else {
        field += ch
      }
    }
  }
  // Trailing cell + row (file without final newline)
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  // Drop fully-empty rows (e.g. trailing blank lines)
  return rows.filter(r => r.some(cell => cell.trim() !== ''))
}

/** Map header → known recipient field name. Case- and whitespace-insensitive. */
const HEADER_ALIASES: Record<string, string> = {
  'нэр':           'full_name',
  'овог нэр':      'full_name',
  'бүтэн нэр':     'full_name',
  'name':          'full_name',
  'full name':     'full_name',
  'fullname':      'full_name',
  'албан тушаал':  'job_title',
  'тушаал':        'job_title',
  'job title':     'job_title',
  'title':         'job_title',
  'position':      'job_title',
  'хэлтэс':        'department',
  'газар':         'department',
  'department':    'department',
  'утас':          'phone',
  'phone':         'phone',
  'mobile':        'phone',
  'и-мэйл':        'email',
  'имэйл':         'email',
  'email':         'email',
  'хаяг':          'delivery_address',
  'хүргэлтийн хаяг': 'delivery_address',
  'address':       'delivery_address',
  'хот':           'delivery_city',
  'аймаг':         'delivery_city',
  'city':          'delivery_city',
}

export interface ParsedRecipient {
  row_number: number
  full_name?: string
  job_title?: string
  department?: string
  phone?: string
  email?: string
  delivery_address?: string
  delivery_city?: string
  data: Record<string, any>
}

/**
 * Parse a recipient CSV into typed rows.
 * - First row = headers
 * - Each subsequent row = one recipient
 * - Unknown headers are kept in `data` as-is
 * - Empty `full_name` rows are skipped
 */
export function parseRecipientCsv(input: string): { recipients: ParsedRecipient[]; warnings: string[]; headerMap: Record<string, string> } {
  const rows = parseCsv(input)
  if (rows.length < 2) {
    return { recipients: [], warnings: ['CSV дотор header болон 1+ мөр байх ёстой'], headerMap: {} }
  }
  const headers = rows[0].map(h => h.trim())
  const headerMap: Record<string, string> = {}
  headers.forEach(h => {
    const key = h.toLowerCase().trim()
    headerMap[h] = HEADER_ALIASES[key] || ''
  })

  const recipients: ParsedRecipient[] = []
  const warnings: string[] = []
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const rec: ParsedRecipient = { row_number: r, data: {} }
    headers.forEach((h, i) => {
      const value = (row[i] ?? '').trim()
      const mapped = headerMap[h]
      if (mapped) (rec as any)[mapped] = value
      else if (value) rec.data[h] = value
    })
    if (!rec.full_name) {
      warnings.push(`Мөр ${r + 1}: нэр хоосон — алгассан`)
      continue
    }
    recipients.push(rec)
  }
  return { recipients, warnings, headerMap }
}
