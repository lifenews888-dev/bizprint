import 'reflect-metadata'
import * as bcrypt from 'bcrypt'
import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { GUARDS_METADATA } from '@nestjs/common/constants'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { ChangePasswordDto } from './dto/change-password.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

describe('AuthService.changePassword (өөрийн нууц үг солих)', () => {
  const CURRENT = 'OldPassw0rd!'
  let currentHash: string

  beforeAll(async () => {
    currentHash = await bcrypt.hash(CURRENT, 4)
  })

  function make(user: any = { id: 'u1', is_active: true, password_hash: currentHash }) {
    const svc: any = Object.create(AuthService.prototype)
    const qb: any = {
      addSelect: jest.fn(() => qb),
      where: jest.fn(() => qb),
      getOne: jest.fn(async () => user),
    }
    svc.userRepository = {
      createQueryBuilder: jest.fn(() => qb),
      update: jest.fn(async () => ({ affected: 1 })),
    }
    svc.refreshTokenRepo = { update: jest.fn(async () => ({ affected: 2 })) }
    return svc
  }

  it('солиод шинэ hash хадгалж, бусад сессийг хаана', async () => {
    const svc = make()
    await expect(svc.changePassword('u1', CURRENT, 'BrandNewPass1', 'keep-rt')).resolves.toEqual({
      ok: true,
      message: expect.any(String),
    })

    expect(svc.userRepository.update).toHaveBeenCalledTimes(1)
    const [id, patch] = svc.userRepository.update.mock.calls[0]
    expect(id).toBe('u1')
    expect(patch.password_hash).not.toBe(currentHash)
    await expect(bcrypt.compare('BrandNewPass1', patch.password_hash)).resolves.toBe(true)

    expect(svc.refreshTokenRepo.update).toHaveBeenCalledTimes(1)
    const [where, set] = svc.refreshTokenRepo.update.mock.calls[0]
    expect(where).toMatchObject({ user_id: 'u1', is_revoked: false })
    expect(where.token).toBeDefined() // одоогийн сессийг үлдээнэ (Not(keep-rt))
    expect(set).toEqual({ is_revoked: true })
  })

  it('refresh token өгөөгүй бол бүх сессийг хаана', async () => {
    const svc = make()
    await svc.changePassword('u1', CURRENT, 'BrandNewPass1')
    const [where] = svc.refreshTokenRepo.update.mock.calls[0]
    expect(where).toEqual({ user_id: 'u1', is_revoked: false })
  })

  it('одоогийн нууц үг буруу бол 400 (401 биш) буцааж, юу ч өөрчлөхгүй', async () => {
    const svc = make()
    const p = svc.changePassword('u1', 'WrongPass99', 'BrandNewPass1')
    await expect(p).rejects.toBeInstanceOf(BadRequestException)
    await expect(svc.changePassword('u1', 'WrongPass99', 'BrandNewPass1')).rejects.toThrow('Одоогийн нууц үг буруу байна')
    expect(svc.userRepository.update).not.toHaveBeenCalled()
    expect(svc.refreshTokenRepo.update).not.toHaveBeenCalled()
  })

  it('шинэ нууц үг одоогийнхтой ижил бол татгалзана', async () => {
    const svc = make()
    await expect(svc.changePassword('u1', CURRENT, CURRENT)).rejects.toThrow('өөр байх ёстой')
    expect(svc.userRepository.update).not.toHaveBeenCalled()
  })

  it('8-аас богино шинэ нууц үгийг татгалзана', async () => {
    const svc = make()
    await expect(svc.changePassword('u1', CURRENT, 'short')).rejects.toBeInstanceOf(BadRequestException)
    expect(svc.userRepository.update).not.toHaveBeenCalled()
  })

  it('хэрэглэгч олдохгүй / идэвхгүй бол татгалзана', async () => {
    await expect(make(null).changePassword('u1', CURRENT, 'BrandNewPass1')).rejects.toBeInstanceOf(UnauthorizedException)
    await expect(make({ id: 'u1', is_active: false, password_hash: currentHash }).changePassword('u1', CURRENT, 'BrandNewPass1'))
      .rejects.toBeInstanceOf(UnauthorizedException)
  })
})

describe('ChangePasswordDto', () => {
  const errorsFor = async (body: any) =>
    (await validate(plainToInstance(ChangePasswordDto, body))).map(e => e.property)

  it('зөв өгөгдлийг зөвшөөрнө', async () => {
    expect(await errorsFor({ currentPassword: 'old', newPassword: 'longenough1' })).toEqual([])
  })

  it('богино шинэ нууц үг болон хоосон одоогийн нууц үгийг татгалзана', async () => {
    expect(await errorsFor({ currentPassword: 'old', newPassword: 'short' })).toContain('newPassword')
    expect(await errorsFor({ currentPassword: '', newPassword: 'longenough1' })).toContain('currentPassword')
  })
})

describe('AuthController.changePassword', () => {
  it('JwtAuthGuard-аар хамгаалагдсан', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AuthController.prototype.changePassword) || []
    expect(guards).toContain(JwtAuthGuard)
  })

  it('req.user.id болон body-г service рүү дамжуулна', async () => {
    const authService: any = { changePassword: jest.fn(async () => ({ ok: true })) }
    const ctrl = new AuthController(authService)
    const dto = Object.assign(new ChangePasswordDto(), { currentPassword: 'a', newPassword: 'bbbbbbbb', refresh_token: 'rt' })
    await expect(ctrl.changePassword({ user: { id: 'u1' } }, dto)).resolves.toEqual({ ok: true })
    expect(authService.changePassword).toHaveBeenCalledWith('u1', 'a', 'bbbbbbbb', 'rt')
  })
})
