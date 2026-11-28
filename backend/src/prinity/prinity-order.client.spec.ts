import { createHmac } from 'crypto'
import { PrinityOrderClient } from './prinity-order.client'

const URL = 'https://prinity.test'
const SECRET = 'prinity-secret'

describe('PrinityOrderClient', () => {
  const realFetch = global.fetch
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn(async () => ({ ok: true, text: async () => '' }))
    global.fetch = fetchMock as any
    process.env.PRINITY_ORDER_URL = URL + '/'
    process.env.PRINITY_ORDER_SECRET = SECRET
  })
  afterEach(() => {
    global.fetch = realFetch
    delete process.env.PRINITY_ORDER_URL
    delete process.env.PRINITY_ORDER_SECRET
  })

  const order = {
    id: 'ord-1',
    quote_number: 'Q-1',
    customer_name: 'Бат',
    customer_phone: '99112233',
    total_price: 116000,
    payment_status: 'unpaid',
  }
  const items = [{ quantity: 2, unit_price: 58000, specs: { product_name: 'Нэрийн хуудас', sides: '2' } }]

  it('тохиргоогүй бол юу ч илгээхгүй', async () => {
    delete process.env.PRINITY_ORDER_URL
    await expect(new PrinityOrderClient().mirror(order, items)).resolves.toEqual({ skipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('захиалгыг гарын үсэгтэй илгээнэ, Prinity шалгаж чадна', async () => {
    await expect(new PrinityOrderClient().mirror(order, items)).resolves.toEqual({ ok: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(URL + '/hooks/bizprint/orders')

    const m = /^t=(\d+),v1=([a-f0-9]{64})$/.exec(init.headers['x-bizprint-signature'])
    expect(m).not.toBeNull()
    const expected = createHmac('sha256', SECRET).update(`${m![1]}.${init.body}`).digest('hex')
    expect(m![2]).toBe(expected)

    const body = JSON.parse(init.body)
    expect(body).toMatchObject({
      ext_id: 'ord-1',
      quote_no: 'Q-1',
      customer: { name: 'Бат', phone: '99112233' },
      total: 116000,
      payment_status: 'unpaid',
    })
    expect(body.items).toEqual([
      expect.objectContaining({ name: 'Нэрийн хуудас', qty: 2, unit_price: 58000, line_total: 116000 }),
    ])
  })

  it('төлбөр төлөгдсөнийг мэдэгдэнэ', async () => {
    await new PrinityOrderClient().markPaid('ord-1', { amount: 116000, method: 'qr', ref: 'INV-1' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(URL + '/hooks/bizprint/paid')
    expect(JSON.parse(init.body)).toEqual({ ext_id: 'ord-1', amount: 116000, method: 'qr', ref: 'INV-1' })
  })

  it('Prinity унасан ч алдаа шидэхгүй (захиалгыг зогсоохгүй)', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    await expect(new PrinityOrderClient().mirror(order, items)).resolves.toEqual({ ok: false })
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' })
    await expect(new PrinityOrderClient().markPaid('ord-1')).resolves.toEqual({ ok: false, status: 500 })
  })
})
