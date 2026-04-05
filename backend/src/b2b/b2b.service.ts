import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { B2BCompany } from './entities/b2b-company.entity';
import { B2BMember, B2BMemberRole } from './entities/b2b-member.entity';
import { B2BApprovalFlow } from './entities/b2b-approval-flow.entity';

@Injectable()
export class B2BService {
  constructor(
    @InjectRepository(B2BCompany) private companyRepo: Repository<B2BCompany>,
    @InjectRepository(B2BMember)  private memberRepo: Repository<B2BMember>,
    @InjectRepository(B2BApprovalFlow) private approvalRepo: Repository<B2BApprovalFlow>,
  ) {}

  // ── Company CRUD ──────────────────────────────────────────
  async createCompany(dto: Partial<B2BCompany>): Promise<B2BCompany> {
    return this.companyRepo.save(this.companyRepo.create(dto));
  }

  async getCompany(id: string): Promise<B2BCompany> {
    const c = await this.companyRepo.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
    if (!c) throw new NotFoundException('B2B компани олдсонгүй');
    return c;
  }

  async listCompanies(): Promise<B2BCompany[]> {
    return this.companyRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateCompany(id: string, dto: Partial<B2BCompany>): Promise<B2BCompany> {
    await this.companyRepo.update(id, dto);
    return this.getCompany(id);
  }

  // ── Members ───────────────────────────────────────────────
  async addMember(dto: {
    companyId: string;
    userId: string;
    role: B2BMemberRole;
    monthlyBudget?: number;
    requiresApproval?: boolean;
  }): Promise<B2BMember> {
    const member = this.memberRepo.create(dto);
    return this.memberRepo.save(member);
  }

  async getCompanyOfUser(userId: string): Promise<B2BCompany | null> {
    const member = await this.memberRepo.findOne({
      where: { userId },
      relations: ['company'],
    });
    return member?.company ?? null;
  }

  async getMemberByUser(userId: string): Promise<B2BMember | null> {
    return this.memberRepo.findOne({ where: { userId }, relations: ['company'] });
  }

  // ── Credit management ─────────────────────────────────────
  async checkCredit(companyId: string, amount: number): Promise<boolean> {
    const company = await this.getCompany(companyId);
    const available = Number(company.creditLimit) - Number(company.creditUsed);
    return available >= amount;
  }

  async useCredit(companyId: string, amount: number): Promise<void> {
    await this.companyRepo.increment({ id: companyId }, 'creditUsed', amount);
  }

  async releaseCredit(companyId: string, amount: number): Promise<void> {
    await this.companyRepo.decrement({ id: companyId }, 'creditUsed', amount);
  }

  // ── Approval flow ─────────────────────────────────────────
  async requestApproval(dto: {
    companyId: string;
    orderId: string;
    requestedById: string;
  }): Promise<B2BApprovalFlow> {
    return this.approvalRepo.save(this.approvalRepo.create(dto));
  }

  async reviewApproval(id: string, dto: {
    status: 'approved' | 'rejected';
    reviewedById: string;
    reviewNote?: string;
  }): Promise<B2BApprovalFlow> {
    await this.approvalRepo.update(id, {
      ...dto,
      reviewedAt: new Date(),
    });
    return this.approvalRepo.findOne({ where: { id } });
  }

  async getPendingApprovals(companyId: string): Promise<B2BApprovalFlow[]> {
    return this.approvalRepo.find({
      where: { companyId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Custom pricing ────────────────────────────────────────
  async getCustomPrice(companyId: string, productType: string): Promise<number | null> {
    const company = await this.getCompany(companyId);
    return company.customPricing?.[productType] ?? null;
  }

  async setCustomPricing(companyId: string, pricing: Record<string, number>): Promise<B2BCompany> {
    await this.companyRepo.update(companyId, { customPricing: pricing });
    return this.getCompany(companyId);
  }
}
