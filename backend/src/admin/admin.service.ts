import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Vendor } from '../vendors/vendor.entity'
import { Order } from '../orders/entities/order.entity'
import { Machine } from '../machines/machine.entity'
import { ProductionJob } from '../production/entities/production-job.entity'
import { User } from '../users/user.entity'
import { Campaign } from './campaign.entity'

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Vendor) private vendorRepo: Repository<Vendor>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Machine) private machineRepo: Repository<Machine>,
    @InjectRepository(ProductionJob) private productionRepo: Repository<ProductionJob>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
  ) {}

  async getUsers() { return this.userRepo.find() }
  async getVendors() { return this.vendorRepo.find() }
  async getMachines() { return this.machineRepo.find() }
  async getOrders() { return this.orderRepo.find({ relations: ['customer', 'product'] }) }
  async getProductionJobs() { return this.productionRepo.find() }

  async updateUserRole(id: string, role: string) {
    await this.userRepo.update(id, { role });
    return this.userRepo.findOne({ where: { id } });
  }

  async updateUser(id: string, body: any) {
    const { password, ...rest } = body;
    await this.userRepo.update(id, rest);
    return this.userRepo.findOne({ where: { id } });
  }

  async deleteUser(id: string) {
    return this.userRepo.delete(id);
  }

  async createVendor(body: any) {
    const { email, ...rest } = body;
    const vendor = this.vendorRepo.create({ contact_email: email || rest.contact_email, ...rest });
    return this.vendorRepo.save(vendor);
  }

  async updateVendor(id: string, body: any) {
    const { email, ...rest } = body;
    if (email) rest.contact_email = email;
    await this.vendorRepo.update(id, rest);
    return this.vendorRepo.findOne({ where: { id } });
  }

  async deleteVendor(id: string) {
    return this.vendorRepo.delete(id);
  }

  async getRoleRequests() {
    return this.userRepo
      .createQueryBuilder('u')
      .where('u.role_request IS NOT NULL')
      .select(['u.id', 'u.full_name', 'u.email', 'u.role', 'u.role_request', 'u.created_at'])
      .getMany();
  }

  async approveRole(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user || !user.role_request) throw new Error('Хүсэлт олдсонгүй');
    const newRole = user.role_request;
    await this.userRepo.update(id, { role: newRole, role_request: null });
    return this.userRepo.findOne({ where: { id } });
  }

  async rejectRole(id: string) {
    await this.userRepo.update(id, { role_request: null });
    return { message: 'Хүсэлт татгалзагдлаа' };
  }

  async getStats() {
    const [users, orders, vendors, machines, production] = await Promise.all([
      this.userRepo.count(), this.orderRepo.count(), this.vendorRepo.count(),
      this.machineRepo.count(), this.productionRepo.count(),
    ])
    return { users, orders, vendors, machines, production }
  }

  // Campaigns
  async getCampaigns() { return this.campaignRepo.find({ order: { created_at: 'DESC' } }) }
  async createCampaign(body: any) { return this.campaignRepo.save(this.campaignRepo.create(body)) }
  async updateCampaign(id: string, body: any) { await this.campaignRepo.update(id, body); return this.campaignRepo.findOne({ where: { id } }) }
  async deleteCampaign(id: string) { return this.campaignRepo.delete(id) }
}
