import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification, NotificationType } from './notification.entity'
import { PushToken } from './push-token.entity'
import { NotificationsGateway } from './notifications.gateway'

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
    @InjectRepository(PushToken)
    private pushTokenRepo: Repository<PushToken>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(params: {
    user_id: string
    type: NotificationType
    title: string
    message?: string
    data?: any
  }) {
    const n = this.repo.create(params)
    const saved = await this.repo.save(n)

    // Real-time push via Socket.IO
    this.notificationsGateway.notifyUser(params.user_id, {
      id: saved.id,
      type: saved.type,
      title: saved.title,
      message: saved.message,
      created_at: saved.created_at,
    })

    return saved
  }

  findForUser(user_id: string, limit = 50, type?: string) {
    const where: any = { user_id }
    if (type) where.type = type
    return this.repo.find({
      where,
      order: { created_at: 'DESC' },
      take: limit,
    })
  }

  async getUnreadCount(user_id: string) {
    const count = await this.repo.count({
      where: { user_id, is_read: false },
    })
    return { unread: count }
  }

  async markRead(id: number) {
    await this.repo.update({ id }, { is_read: true })
    return { success: true }
  }

  async markAllRead(user_id: string) {
    await this.repo.update({ user_id, is_read: false }, { is_read: true })
    return { success: true }
  }

  // Push token management
  async registerPushToken(userId: string, token: string, platform: string, deviceId?: string) {
    const existing = await this.pushTokenRepo.findOne({ where: { token } })
    if (existing) {
      existing.user_id = userId
      existing.platform = platform
      if (deviceId) existing.device_id = deviceId
      await this.pushTokenRepo.save(existing)
      return { registered: true, updated: true }
    }
    await this.pushTokenRepo.save(this.pushTokenRepo.create({ user_id: userId, token, platform, device_id: deviceId }))
    return { registered: true }
  }

  async unregisterPushToken(token: string) {
    await this.pushTokenRepo.delete({ token })
    return { unregistered: true }
  }

  async getPushTokensForUser(userId: string) {
    return this.pushTokenRepo.find({ where: { user_id: userId } })
  }
}
