import { AuthService } from './auth.service'

describe('AuthService.handoff (desktop → embedded site session)', () => {
  const future = new Date(Date.now() + 864e5)
  function make(record: any, user: any = { id: 'u1', is_active: true, email: 'a@b.mn', role: 'customer' }) {
    const svc: any = Object.create(AuthService.prototype)
    svc.refreshTokenRepo = { findOne: jest.fn(async () => record) }
    svc.userRepository = { findOne: jest.fn(async () => user) }
    svc.generateTokens = jest.fn(async (u: any, dev: string, name: string, platform: string) => ({ access_token: 'new', u: u.id, dev, platform }))
    return svc as AuthService
  }

  it('issues a separate web session for the owner of a live refresh token', async () => {
    const svc = make({ token: 'rt', user_id: 'u1', expires_at: future, device_id: 'pc-1' })
    await expect(svc.handoff('u1', 'rt')).resolves.toMatchObject({ access_token: 'new', u: 'u1', dev: 'pc-1:web', platform: 'desktop-web' })
  })

  it.each([
    ['another user\'s refresh token', { token: 'rt', user_id: 'u2', expires_at: future }, 'u1', 'rt'],
    ['expired token', { token: 'rt', user_id: 'u1', expires_at: new Date(0) }, 'u1', 'rt'],
    ['unknown/revoked token', null, 'u1', 'rt'],
    ['missing token', { token: 'rt', user_id: 'u1', expires_at: future }, 'u1', ''],
  ])('rejects %s', async (_n, record, uid, rt) => {
    await expect(make(record).handoff(uid as string, rt as string)).rejects.toThrow()
  })

  it('rejects inactive users', async () => {
    const svc = make({ token: 'rt', user_id: 'u1', expires_at: future }, { id: 'u1', is_active: false })
    await expect(svc.handoff('u1', 'rt')).rejects.toThrow('Хэрэглэгч олдсонгүй')
  })
})
