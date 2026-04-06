// ============================================================
// b2b-company.entity.ts
// ============================================================
import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';

export enum B2BPaymentTerms {
  PREPAID   = 'prepaid',
  NET_15    = 'net_15',
  NET_30    = 'net_30',
  NET_60    = 'net_60',
}

@Entity('b2b_companies')
export class B2BCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, unique: true })
  registrationNo: string; // Аж ахуйн нэгжийн регистр

  @Column({ nullable: true })
  vatNo: string; // НӨАТ

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  creditLimit: number; // MNT

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  creditUsed: number;

  @Column({ type: 'enum', enum: B2BPaymentTerms, default: B2BPaymentTerms.PREPAID })
  paymentTerms: B2BPaymentTerms;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountRate: number; // % хөнгөлөлт

  @Column({ type: 'jsonb', nullable: true })
  customPricing: Record<string, number>; // productType → customPrice

  @Column({ default: 'active' })
  status: string; // active, suspended, pending

  @OneToMany(() => B2BMember, m => m.company)
  members: B2BMember[];

  @OneToMany(() => B2BApprovalFlow, f => f.company)
  approvalFlows: B2BApprovalFlow[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


// ============================================================
// b2b-member.entity.ts
// ============================================================
import { ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum B2BMemberRole {
  OWNER   = 'owner',
  MANAGER = 'manager',
  BUYER   = 'buyer',
}

@Entity('b2b_members')
export class B2BMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => B2BCompany, c => c.members)
  @JoinColumn({ name: 'companyId' })
  company: B2BCompany;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: B2BMemberRole, default: B2BMemberRole.BUYER })
  role: B2BMemberRole;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  monthlyBudget: number; // Сарын захиалгын хязгаар

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  budgetUsed: number; // Энэ сард зарцуулсан

  @Column({ default: true })
  canPlaceOrder: boolean;

  @Column({ default: false })
  requiresApproval: boolean; // Захиалга илгээхэд батлах шаардлагатай

  @CreateDateColumn()
  createdAt: Date;
}


// ============================================================
// b2b-approval-flow.entity.ts  (компани дотоод захиалга батлах)
// ============================================================
@Entity('b2b_approval_flows')
export class B2BApprovalFlow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => B2BCompany)
  @JoinColumn({ name: 'companyId' })
  company: B2BCompany;

  @Column()
  orderId: string;

  @Column()
  requestedById: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;

  @Column({ nullable: true })
  reviewedById: string;

  @Column({ nullable: true, type: 'text' })
  reviewNote: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}


// ============================================================
// b2b.service.ts
// ============================================================
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class B2BService {
  constructor(
    @InjectRepository(B2BCompany) private companyRepo: Repository<B2BCompany>,
    @InjectRepository(B2BMember)  private memberRepo: Repository<B2BMember>,
    @InjectRepository(B2BApprovalFlow) private approvalRepo: Repository<B2BApprovalFlow>,
  ) {}

  // ── Company CRUD ────────────────────────────────────────
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

  // ── Members ─────────────────────────────────────────────
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

  // ── Credit management ───────────────────────────────────
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

  // ── Approval flow ────────────────────────────────────────
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

  // ── Custom pricing ───────────────────────────────────────
  async getCustomPrice(companyId: string, productType: string): Promise<number | null> {
    const company = await this.getCompany(companyId);
    return company.customPricing?.[productType] ?? null;
  }

  async setCustomPricing(companyId: string, pricing: Record<string, number>): Promise<B2BCompany> {
    await this.companyRepo.update(companyId, { customPricing: pricing });
    return this.getCompany(companyId);
  }
}


// ============================================================
// b2b.controller.ts
// ============================================================
import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('B2B')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('b2b')
export class B2BController {
  constructor(private readonly svc: B2BService) {}

  @Post('companies')
  @Roles('admin', 'superadmin')
  createCompany(@Body() dto: any) {
    return this.svc.createCompany(dto);
  }

  @Get('companies')
  @Roles('admin', 'superadmin')
  listCompanies() {
    return this.svc.listCompanies();
  }

  @Get('companies/:id')
  getCompany(@Param('id') id: string) {
    return this.svc.getCompany(id);
  }

  @Put('companies/:id')
  @Roles('admin', 'superadmin')
  updateCompany(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateCompany(id, dto);
  }

  @Post('companies/:id/members')
  addMember(@Param('id') companyId: string, @Body() dto: any) {
    return this.svc.addMember({ companyId, ...dto });
  }

  @Get('my-company')
  getMyCompany(@Body('userId') userId: string) {
    return this.svc.getCompanyOfUser(userId);
  }

  @Post('companies/:id/pricing')
  @Roles('admin', 'superadmin')
  setCustomPricing(@Param('id') id: string, @Body() pricing: Record<string, number>) {
    return this.svc.setCustomPricing(id, pricing);
  }

  @Post('approvals')
  requestApproval(@Body() dto: any) {
    return this.svc.requestApproval(dto);
  }

  @Patch('approvals/:id')
  reviewApproval(@Param('id') id: string, @Body() dto: any) {
    return this.svc.reviewApproval(id, dto);
  }

  @Get('companies/:id/approvals/pending')
  getPendingApprovals(@Param('id') companyId: string) {
    return this.svc.getPendingApprovals(companyId);
  }
}


// ============================================================
// b2b.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([B2BCompany, B2BMember, B2BApprovalFlow])],
  controllers: [B2BController],
  providers: [B2BService],
  exports: [B2BService],
})
export class B2BModule {}
