import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification, NotificationType } from './notification.entity'

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
  ) {}

  async create(params: {
    user_id: string
    type: NotificationType
    title: string
    message?: string
    data?: any
  }) {
    const n = this.repo.create(params)
    return this.repo.save(n)
  }

  findForUser(user_id: string, limit = 50) {
    return this.repo.find({
      where: { user_id },
      order: { created_at: 'DESC' },
      take: limit,
    })
  }

  async markRead(id: number) {
    await this.repo.update({ id }, { is_read: true })
    return { success: true }
  }

  async markAllRead(user_id: string) {
    await this.repo.update({ user_id, is_read: false }, { is_read: true })
    return { success: true }
  }
}
