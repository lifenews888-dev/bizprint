// ─── Pricing Engine ─────────────────────────────────
// Calculates final price with tax and discount

export interface PriceInput {
  base_price: number
  tax_rate?: number       // percent (e.g., 10 = 10%)
  discount?: number       // percent (e.g., 20 = 20%)
  quantity?: number
}

export interface PriceResult {
  unit_price: number
  subtotal: number
  tax_amount: number
  discount_amount: number
  final_price: number
  savings: number
}

export function calculatePrice(input: PriceInput): PriceResult {
  const { base_price, tax_rate = 0, discount = 0, quantity = 1 } = input

  const discountAmount = Math.round(base_price * (discount / 100))
  const afterDiscount = base_price - discountAmount
  const taxAmount = Math.round(afterDiscount * (tax_rate / 100))
  const unitPrice = afterDiscount + taxAmount
  const subtotal = base_price * quantity
  const finalPrice = unitPrice * quantity

  return {
    unit_price: unitPrice,
    subtotal,
    tax_amount: taxAmount * quantity,
    discount_amount: discountAmount * quantity,
    final_price: finalPrice,
    savings: discountAmount * quantity,
  }
}

// ─── Cart Calculator ────────────────────────────────

export interface CartItem {
  product_id: string
  name: string
  base_price: number
  quantity: number
  tax_rate?: number
  discount?: number
}

export interface CartSummary {
  items: (CartItem & { final_price: number })[]
  subtotal: number
  total_tax: number
  total_discount: number
  grand_total: number
  item_count: number
}

export function calculateCart(items: CartItem[]): CartSummary {
  let subtotal = 0, totalTax = 0, totalDiscount = 0, grandTotal = 0

  const calculated = items.map(item => {
    const result = calculatePrice(item)
    subtotal += result.subtotal
    totalTax += result.tax_amount
    totalDiscount += result.discount_amount
    grandTotal += result.final_price
    return { ...item, final_price: result.final_price }
  })

  return {
    items: calculated,
    subtotal,
    total_tax: totalTax,
    total_discount: totalDiscount,
    grand_total: grandTotal,
    item_count: items.reduce((s, i) => s + i.quantity, 0),
  }
}
