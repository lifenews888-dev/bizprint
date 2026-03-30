import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, MoreThan } from 'typeorm';
import { LoyaltyProgram } from './entities/loyalty-program.entity';
import { LoyaltyCard } from './entities/loyalty-card.entity';
import { LoyaltyLog } from './entities/loyalty-log.entity';
import { LoyaltySession } from './entities/loyalty-session.entity';
import { UsageService } from '../subscription/usage.service';
import { randomBytes } from 'crypto';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyProgram)
    private programRepo: Repository<LoyaltyProgram>,
    @InjectRepository(LoyaltyCard)
    private cardRepo: Repository<LoyaltyCard>,
    @InjectRepository(LoyaltyLog)
    private logRepo: Repository<LoyaltyLog>,
    @InjectRepository(LoyaltySession)
    private sessionRepo: Repository<LoyaltySession>,
    private usageService: UsageService,
  ) {}

  // ════════════════════════════════════
  //  PROGRAM CRUD (Vendor)
  // ════════════════════════════════════

  async createProgram(vendorId: string, dto: {
    name: string;
    description?: string;
    required_stamps?: number;
    reward_type?: string;
    reward_description?: string;
    discount_percent?: number;
    logo_url?: string;
    accent_color?: string;
  }) {
    // Check subscription limit
    await this.usageService.checkAndEnforce(vendorId, 'loyalty_campaigns');

    const stamps = dto.required_stamps || 10;
    if (stamps < 2 || stamps > 20) {
      throw new BadRequestException('Тамга 2-20 хооронд байна');
    }
    const program = this.programRepo.create({
      ...dto,
      vendor_id: vendorId,
      required_stamps: stamps,
    });
    const saved = await this.programRepo.save(program);
    await this.usageService.logUsage(vendorId, 'loyalty_campaigns', 'create', saved.id);
    return saved;
  }

  async updateProgram(id: string, vendorId: string, dto: Partial<LoyaltyProgram>) {
    const program = await this.programRepo.findOne({ where: { id } });
    if (!program) throw new NotFoundException('Програм олдсонгүй');
    if (program.vendor_id !== vendorId) throw new ForbiddenException();
    Object.assign(program, dto);
    return this.programRepo.save(program);
  }

  async getVendorPrograms(vendorId: string) {
    return this.programRepo.find({
      where: { vendor_id: vendorId },
      order: { created_at: 'DESC' },
    });
  }

  async getActivePrograms() {
    return this.programRepo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async getProgramsByOwner(userId: string) {
    return this.programRepo.find({
      where: { vendor_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async getProgram(id: string) {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: ['vendor'],
    });
    if (!program) throw new NotFoundException('Програм олдсонгүй');
    return program;
  }

  // ════════════════════════════════════
  //  AUTO-CREATE from Business Card Order
  // ════════════════════════════════════

  async createFromCardOrder(userId: string, dto: {
    name: string;
    required_stamps?: number;
    reward_type?: string;
    reward_description?: string;
    discount_percent?: number;
    order_id?: string;
  }) {
    const stamps = dto.required_stamps || 10;
    if (stamps < 2 || stamps > 20) {
      throw new BadRequestException('Тамга 2-20 хооронд байна');
    }
    const program = this.programRepo.create({
      vendor_id: userId,
      name: dto.name,
      required_stamps: stamps,
      reward_type: dto.reward_type || 'free',
      reward_description: dto.reward_description,
      discount_percent: dto.discount_percent || 0,
      is_active: true,
    });
    const saved = await this.programRepo.save(program);
    return { program: saved, loyalty_url: `/loyalty/${saved.id}` };
  }

  // ════════════════════════════════════
  //  PHONE-BASED STAMP (public QR scan)
  // ════════════════════════════════════

  async addStampByPhone(programId: string, phone: string) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException('Програм олдсонгүй');
    if (!program.is_active) throw new BadRequestException('Програм идэвхгүй');

    if (!phone || phone.replace(/\D/g, '').length < 8) throw new BadRequestException('Утасны дугаар буруу');
    const normalizedPhone = phone.replace(/\D/g, '').slice(-8);

    // 1 stamp per phone per program per day — check via card phone + log
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Find existing card by phone
    let card = await this.cardRepo.findOne({ where: { phone: normalizedPhone, program_id: programId } });

    if (card) {
      // Check daily limit via log
      const alreadyStamped = await this.logRepo
        .createQueryBuilder('log')
        .where('log.program_id = :pid', { pid: programId })
        .andWhere('log.action = :action', { action: 'stamp' })
        .andWhere('log.note LIKE :phone', { phone: `%phone:${normalizedPhone}%` })
        .andWhere('log.created_at >= :today', { today: todayStart })
        .getOne();
      if (alreadyStamped) {
        return {
          card, rewardEarned: false, alreadyScanned: true,
          message: 'Өнөөдөр аль хэдийн тамга авсан',
          program: { name: program.name, required_stamps: program.required_stamps, reward_description: program.reward_description },
        };
      }
    }

    // Create card if not exists
    if (!card) {
      card = this.cardRepo.create({
        user_id: program.vendor_id, // owner's ID as fallback
        phone: normalizedPhone,
        program_id: programId,
        current_stamps: 0, rewards: 0, total_stamps: 0,
      });
    }

    card.current_stamps += 1;
    card.total_stamps += 1;
    let rewardEarned = false;

    if (card.current_stamps >= program.required_stamps) {
      card.rewards += 1;
      card.current_stamps = 0;
      rewardEarned = true;
    }

    await this.cardRepo.save(card);
    await this.logRepo.save(this.logRepo.create({
      user_id: program.vendor_id,
      program_id: programId, action: 'stamp',
      note: `phone:${normalizedPhone} ${rewardEarned ? '| Шагнал олдлоо!' : ''}`,
    }));

    return {
      card, rewardEarned, alreadyScanned: false,
      message: rewardEarned
        ? `🎉 Баяр хүргэе! Шагнал авлаа! (${program.reward_description || 'Үнэгүй'})`
        : `Тамга +1 (${card.current_stamps}/${program.required_stamps})`,
      program: { name: program.name, required_stamps: program.required_stamps, reward_description: program.reward_description, accent_color: program.accent_color },
      marketing: program.marketing_enabled ? (program.marketing || []) : [],
    };
  }

  /** Check stamp status by phone */
  async getStampsByPhone(programId: string, phone: string) {
    const normalizedPhone = phone.replace(/\D/g, '').slice(-8);
    const card = await this.cardRepo.findOne({ where: { phone: normalizedPhone, program_id: programId } });
    const program = await this.programRepo.findOne({ where: { id: programId } });
    return { card, program };
  }

  /** Redeem reward by phone */
  async redeemByPhone(programId: string, phone: string) {
    const normalizedPhone = phone.replace(/\D/g, '').slice(-8);
    const card = await this.cardRepo.findOne({ where: { phone: normalizedPhone, program_id: programId } });
    if (!card || card.rewards < 1) throw new BadRequestException('Ашиглах шагнал байхгүй');
    card.rewards -= 1;
    await this.cardRepo.save(card);
    await this.logRepo.save(this.logRepo.create({
      user_id: card.user_id, program_id: programId, action: 'redeem',
      note: `phone:${normalizedPhone} | Шагнал ашигласан`,
    }));
    return { card, message: 'Шагнал амжилттай ашигласан!' };
  }

  // ════════════════════════════════════
  //  STAMP (authenticated QR scan)
  // ════════════════════════════════════

  async addStamp(userId: string, programId: string) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException('Програм олдсонгүй');
    if (!program.is_active) throw new BadRequestException('Програм идэвхгүй');

    // ── 1 stamp per user per program per day ──
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const alreadyStamped = await this.logRepo.findOne({
      where: {
        user_id: userId,
        program_id: programId,
        action: 'stamp',
        created_at: MoreThanOrEqual(todayStart),
      },
    });
    if (alreadyStamped) {
      throw new BadRequestException('Өнөөдөр аль хэдийн тамга авсан байна');
    }

    // ── Find or create card ──
    let card = await this.cardRepo.findOne({
      where: { user_id: userId, program_id: programId },
    });
    if (!card) {
      card = this.cardRepo.create({
        user_id: userId,
        program_id: programId,
        current_stamps: 0,
        rewards: 0,
        total_stamps: 0,
      });
    }

    // ── Increment stamp ──
    card.current_stamps += 1;
    card.total_stamps += 1;

    let rewardEarned = false;

    // ── Check if reward threshold reached ──
    if (card.current_stamps >= program.required_stamps) {
      card.rewards += 1;
      card.current_stamps = 0;
      rewardEarned = true;
    }

    await this.cardRepo.save(card);

    // ── Log ──
    await this.logRepo.save(this.logRepo.create({
      user_id: userId,
      program_id: programId,
      action: 'stamp',
      note: rewardEarned ? 'Шагнал олдлоо!' : null,
    }));

    return {
      card,
      rewardEarned,
      message: rewardEarned
        ? `Баяр хүргэе! Шагнал авлаа! (${program.reward_description || program.reward_type})`
        : `Тамга +1 (${card.current_stamps}/${program.required_stamps})`,
    };
  }

  // ════════════════════════════════════
  //  REDEEM
  // ════════════════════════════════════

  async redeem(userId: string, programId: string) {
    const card = await this.cardRepo.findOne({
      where: { user_id: userId, program_id: programId },
      relations: ['program'],
    });
    if (!card) throw new NotFoundException('Loyalty карт олдсонгүй');
    if (card.rewards <= 0) {
      throw new BadRequestException('Ашиглах шагнал байхгүй');
    }

    card.rewards -= 1;
    await this.cardRepo.save(card);

    await this.logRepo.save(this.logRepo.create({
      user_id: userId,
      program_id: programId,
      action: 'redeem',
      note: card.program?.reward_description || 'Шагнал ашиглав',
    }));

    return {
      card,
      message: 'Шагнал амжилттай ашиглагдлаа!',
    };
  }

  // ════════════════════════════════════
  //  USER CARDS
  // ════════════════════════════════════

  async getUserCards(userId: string) {
    return this.cardRepo.find({
      where: { user_id: userId },
      relations: ['program'],
      order: { updated_at: 'DESC' },
    });
  }

  /** Get card + program for a specific program (used by public page) */
  async getUserCard(userId: string, programId: string) {
    const program = await this.getProgram(programId);
    const card = await this.cardRepo.findOne({
      where: { user_id: userId, program_id: programId },
    });
    return {
      program,
      card: card || { current_stamps: 0, rewards: 0, total_stamps: 0 },
    };
  }

  /** Get stamp history for a card */
  async getHistory(userId: string, programId: string) {
    return this.logRepo.find({
      where: { user_id: userId, program_id: programId },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  // ════════════════════════════════════
  //  STAFF SESSION (Dynamic QR)
  // ════════════════════════════════════

  /** Staff generates a 60-second single-use QR session */
  async createSession(staffId: string, programId: string) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException('Програм олдсонгүй');
    if (program.vendor_id !== staffId) throw new ForbiddenException('Энэ програмын эрх байхгүй');

    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const expires_at = new Date(now.getTime() + 60_000); // 60 seconds

    const session = this.sessionRepo.create({
      token,
      program_id: programId,
      staff_id: staffId,
      expires_at,
    });
    await this.sessionRepo.save(session);

    return {
      token,
      expires_at,
      seconds_left: 60,
      program_id: programId,
      program_name: program.name,
    };
  }

  /** Customer scans the dynamic QR → validate session → add stamp */
  async scanSession(userId: string, token: string) {
    const session = await this.sessionRepo.findOne({
      where: { token },
      relations: ['program'],
    });

    if (!session) {
      throw new NotFoundException('QR код олдсонгүй');
    }
    if (session.is_used) {
      throw new BadRequestException('QR код аль хэдийн ашиглагдсан');
    }
    if (new Date() > session.expires_at) {
      throw new BadRequestException('QR кодын хугацаа дууссан');
    }
    if (session.staff_id === userId) {
      throw new BadRequestException('Өөрийн QR кодоо уншуулах боломжгүй');
    }

    // Mark session as used (single-use)
    session.is_used = true;
    session.used_by = userId;
    session.used_at = new Date();
    await this.sessionRepo.save(session);

    // Add stamp via existing logic (bypasses daily limit since staff-approved)
    return this.addStampStaffApproved(userId, session.program_id);
  }

  /** Staff-approved stamp — bypasses daily limit */
  private async addStampStaffApproved(userId: string, programId: string) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException();

    let card = await this.cardRepo.findOne({
      where: { user_id: userId, program_id: programId },
    });
    if (!card) {
      card = this.cardRepo.create({
        user_id: userId,
        program_id: programId,
        current_stamps: 0,
        rewards: 0,
        total_stamps: 0,
      });
    }

    card.current_stamps += 1;
    card.total_stamps += 1;
    let rewardEarned = false;

    if (card.current_stamps >= program.required_stamps) {
      card.rewards += 1;
      card.current_stamps = 0;
      rewardEarned = true;
    }
    await this.cardRepo.save(card);

    await this.logRepo.save(this.logRepo.create({
      user_id: userId,
      program_id: programId,
      action: 'stamp',
      note: rewardEarned ? 'Шагнал олдлоо! (staff)' : 'Staff QR тамга',
    }));

    return {
      card,
      rewardEarned,
      message: rewardEarned
        ? `Баяр хүргэе! Шагнал авлаа! (${program.reward_description || program.reward_type})`
        : `Тамга +1 (${card.current_stamps}/${program.required_stamps})`,
    };
  }

  /** Check session status (for polling from staff page) */
  async getSessionStatus(token: string) {
    const session = await this.sessionRepo.findOne({ where: { token } });
    if (!session) throw new NotFoundException();
    const now = new Date();
    return {
      is_used: session.is_used,
      is_expired: now > session.expires_at,
      used_by: session.used_by,
      used_at: session.used_at,
      seconds_left: Math.max(0, Math.round((session.expires_at.getTime() - now.getTime()) / 1000)),
    };
  }

  /** Cleanup expired sessions (can be called by cron) */
  async cleanupExpiredSessions() {
    const cutoff = new Date(Date.now() - 5 * 60_000); // 5 min old
    const result = await this.sessionRepo
      .createQueryBuilder()
      .delete()
      .where('expires_at < :cutoff', { cutoff })
      .andWhere('is_used = true')
      .execute();
    return { deleted: result.affected };
  }

  // ════════════════════════════════════
  //  ADMIN / VENDOR STATS
  // ════════════════════════════════════

  async getProgramStats(programId: string, vendorId: string) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException();
    if (program.vendor_id !== vendorId) throw new ForbiddenException();

    const totalCards = await this.cardRepo.count({ where: { program_id: programId } });
    const totalStamps = await this.logRepo.count({ where: { program_id: programId, action: 'stamp' } });
    const totalRedeems = await this.logRepo.count({ where: { program_id: programId, action: 'redeem' } });

    // Today's stamps
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStamps = await this.logRepo.count({
      where: {
        program_id: programId,
        action: 'stamp',
        created_at: MoreThanOrEqual(todayStart),
      },
    });

    return {
      program,
      totalCards,
      totalStamps,
      totalRedeems,
      todayStamps,
    };
  }

  /** Stats accessible to program owner (any role) */
  async getProgramStatsForOwner(programId: string, userId: string) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException();
    if (program.vendor_id !== userId) throw new ForbiddenException('Энэ програмын эзэн биш байна');

    const totalCards = await this.cardRepo.count({ where: { program_id: programId } });
    const totalStamps = await this.logRepo.count({ where: { program_id: programId, action: 'stamp' } });
    const totalRedeems = await this.logRepo.count({ where: { program_id: programId, action: 'redeem' } });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStamps = await this.logRepo.count({
      where: { program_id: programId, action: 'stamp', created_at: MoreThanOrEqual(todayStart) },
    });
    return { program, totalCards, totalStamps, totalRedeems, todayStamps };
  }
}
