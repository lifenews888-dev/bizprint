import { PrintAutomationService } from './print-automation.service'
import { OrderStatus } from '../orders/entities/order.entity'

/** OrdersService-ийн жинхэнэ шилжилтийн матрицын хэрэгтэй хэсэг */
const VALID: Record<string, string[]> = {
  pending_file: ['file_review'],
  file_review: ['confirmed', 'file_rejected'],
  confirmed: ['in_production'],
  in_production: ['finishing'],
}

function setup(opts: { preflight?: any; dispatch?: any; status?: string } = {}) {
  const order: any = { id: 'o1', status: opts.status ?? OrderStatus.PENDING_FILE, invoice_no: 'INV-9', customer_id: 'u1' }
  const history: string[] = []
  const orders = {
    getOrderById: jest.fn(async () => ({ ...order })),
    updateStatus: jest.fn(async (_id: string, s: string) => {
      if (!VALID[order.status]?.includes(s)) throw new Error(`invalid ${order.status}→${s}`)
      order.status = s
      history.push(s)
    }),
  }
  const network = { dispatchOrder: jest.fn(async () => opts.dispatch ?? { created: [{ id: 't1' }], skipped: [] }) }
  const notes: any[] = []
  const notifications = { create: jest.fn(async (n: any) => { notes.push(n) }) }
  const inspector = { inspect: jest.fn() }
  const store = new Map<string, any>()
  const automation = {
    findOne: jest.fn(async ({ where }: any) => store.get(where.orderId) ?? null),
    save: jest.fn(async (x: any) => { store.set(x.orderId, x) }),
  }
  const ds = { query: jest.fn(async () => [{ n: 0 }]) }
  const svc = new PrintAutomationService(network as any, orders as any, notifications as any, inspector as any, automation as any, ds as any)
  if (opts.preflight) jest.spyOn(svc, 'preflight').mockResolvedValue(opts.preflight)
  else jest.spyOn(svc, 'preflight').mockResolvedValue([])
  return { svc, order, history, network, notes, store }
}

describe('PrintAutomationService', () => {
  it('paid order goes PENDING_FILE → FILE_REVIEW → CONFIRMED → dispatched, through valid transitions', async () => {
    const { svc, history, network, store } = setup()
    await svc.advance('o1')
    expect(history).toEqual(['file_review', 'confirmed'])
    expect(network.dispatchOrder).toHaveBeenCalledWith('o1', {})
    expect(store.get('o1').state).toBe('dispatched')
  })

  it('stops at FILE_REVIEW on preflight errors and notifies admin + customer once', async () => {
    const { svc, history, network, notes, store } = setup({ preflight: ['Нягтрал 72 dpi'] })
    await svc.advance('o1')
    expect(history).toEqual(['file_review'])
    expect(network.dispatchOrder).not.toHaveBeenCalled()
    expect(store.get('o1')).toMatchObject({ state: 'preflight_failed', detail: 'Нягтрал 72 dpi' })
    expect(notes.map((n) => n.user_id).sort()).toEqual(['admin', 'u1'])
  })

  it('admin approval skips preflight and continues', async () => {
    const { svc, history, store } = setup({ preflight: ['bad'], status: OrderStatus.FILE_REVIEW })
    await svc.approve('o1')
    expect(history).toEqual(['confirmed'])
    expect(store.get('o1').state).toBe('dispatched')
  })

  it('no printer: admin is told once per distinct reason', async () => {
    const { svc, notes, store } = setup({ status: OrderStatus.CONFIRMED, dispatch: { created: [], skipped: [{ reason: 'Тохирох принтер алга' }] } })
    await svc.advance('o1')
    await svc.advance('o1')
    expect(store.get('o1').state).toBe('no_printer')
    expect(notes.filter((n) => n.user_id === 'admin')).toHaveLength(1)
  })

  it('ticket statuses move the order to IN_PRODUCTION then FINISHING', async () => {
    const { svc, history } = setup({ status: OrderStatus.CONFIRMED })
    await svc.onTicketStatus('o1', 'in_hotfolder', { id: 't1' })
    await svc.onTicketStatus('o1', 'printed', { id: 't1' })
    expect(history).toEqual(['in_production', 'finishing'])
  })

  it('failed ticket alerts admin and never throws', async () => {
    const { svc, notes } = setup({ status: OrderStatus.IN_PRODUCTION })
    await expect(svc.onTicketStatus('o1', 'failed', { id: 't1', error: 'RIP offline' })).resolves.toBeUndefined()
    expect(notes[0]).toMatchObject({ user_id: 'admin', message: 'RIP offline' })
  })
})
