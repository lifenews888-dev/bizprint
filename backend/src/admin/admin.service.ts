import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Vendor } from '../vendors/vendor.entity'
import { Order } from '../orders/entities/order.entity'
import { Machine } from '../machines/machine.entity'
import { ProductionJob } from '../production/entities/production-job.entity'
import { User } from '../users/user.entity'
import { NotificationService } from '../notifications/notification.service'
import { MailService } from '../mail/mail.service'

const CONTRACT_ROLES = ['vendor', 'designer', 'sales', 'courier', 'factory', 'creator']

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Vendor) private vendorRepo: Repository<Vendor>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Machine) private machineRepo: Repository<Machine>,
    @InjectRepository(ProductionJob) private productionRepo: Repository<ProductionJob>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationService: NotificationService,
    private mailService: MailService,
  ) {}

  async getUsers() { return this.userRepo.find({ order: { created_at: 'DESC' } }) }
  async getVendors() { return this.vendorRepo.find() }
  async getMachines() { return this.machineRepo.find() }
  async getOrders() { return this.orderRepo.find({ relations: ['customer', 'product'] }) }
  async getProductionJobs() { return this.productionRepo.find() }

  async updateUserRole(id: string, role: string) {
    await this.userRepo.update(id, { role })
    return this.userRepo.findOne({ where: { id } })
  }

  /** General user update (role, is_active, contract, etc.) */
  async updateUser(id: string, data: Partial<User>) {
    // Sanitize — never allow password change through this
    const { password_hash, ...safe } = data as any
    await this.userRepo.update(id, safe)
    return this.userRepo.findOne({ where: { id } })
  }

  async deleteUser(id: string) {
    await this.userRepo.delete(id)
    return { deleted: true }
  }

  async getStats() {
    const [users, orders, vendors, machines, production] = await Promise.all([
      this.userRepo.count(), this.orderRepo.count(), this.vendorRepo.count(),
      this.machineRepo.count(), this.productionRepo.count(),
    ])

    // Role counts
    const allUsers = await this.userRepo.find({ select: ['id', 'role', 'is_active'] })
    const roleCounts: Record<string, number> = {}
    allUsers.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1 })

    const contractUsers = allUsers.filter(u => CONTRACT_ROLES.includes(u.role))
    const activeContract = contractUsers.filter(u => u.is_active).length
    const pendingContract = contractUsers.filter(u => !u.is_active).length

    return { users, orders, vendors, machines, production, role_counts: roleCounts, active_contract: activeContract, pending_contract: pendingContract }
  }

  /* ═══════════════════════════════════════
   *  BROADCAST — бүх хэрэглэгчид эсвэл role-оор мэдэгдэл
   * ═══════════════════════════════════════ */

  async broadcast(params: {
    title: string
    message: string
    roles?: string[]     // empty = all users
    send_email?: boolean
    attachment_url?: string  // uploaded file URL
  }) {
    let users: User[]
    if (params.roles?.length) {
      users = await this.userRepo.find({ where: { role: In(params.roles), is_active: true } })
    } else {
      users = await this.userRepo.find({ where: { is_active: true } })
    }

    let notifCount = 0
    let emailCount = 0

    for (const user of users) {
      // Dashboard notification
      try {
        await this.notificationService.create({
          user_id: user.id,
          type: 'SYSTEM' as any,
          title: params.title,
          message: params.message,
          data: params.attachment_url ? { attachment_url: params.attachment_url } : undefined,
        })
        notifCount++
      } catch {}

      // Email
      if (params.send_email && user.email) {
        try {
          const attachmentHtml = params.attachment_url
            ? `<div style="margin-top:16px;padding:12px 16px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px"><a href="${params.attachment_url.startsWith('http') ? params.attachment_url : (process.env.API_URL || 'http://localhost:4000') + '/' + params.attachment_url}" style="color:#2563EB;font-size:14px;text-decoration:none;font-weight:600">📎 Хавсралт файл татах</a></div>`
            : ''
          await this.mailService.sendGenericNotification({
            to: user.email,
            name: user.full_name || 'Хэрэглэгч',
            title: params.title,
            message: params.message + attachmentHtml,
          })
          emailCount++
        } catch {}
      }
    }

    return {
      total_users: users.length,
      notifications_sent: notifCount,
      emails_sent: emailCount,
      roles: params.roles || ['all'],
    }
  }
}
