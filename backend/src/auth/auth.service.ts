import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { User } from '../users/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

const REFRESH_TOKEN_DAYS = 30;
const RESET_TOKEN_HOURS = 2;

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordReset)
    private resetRepo: Repository<PasswordReset>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private static readonly BUSINESS_ROLES = ['vendor', 'factory', 'sales'];
  private static readonly DESIGNER_ROLES = ['designer', 'creator'];
  private static readonly DRIVER_ROLES = ['courier'];
  private static readonly REQUIRES_VERIFICATION = ['vendor', 'factory', 'designer', 'courier', 'sales', 'creator'];

  async register(dto: RegisterDto) {
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой');
    }

    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Энэ имэйл бүртгэлтэй байна');

    const role = dto.role || 'customer';

    // Role-specific validation
    if (AuthService.BUSINESS_ROLES.includes(role)) {
      if (!dto.company_name?.trim()) throw new BadRequestException('Компанийн нэр заавал шаардлагатай');
      if (!dto.register_number?.trim()) throw new BadRequestException('Регистрийн дугаар заавал шаардлагатай');
    }
    if (AuthService.DESIGNER_ROLES.includes(role)) {
      if (!dto.portfolio_url?.trim() && !dto.professional_bio?.trim()) {
        throw new BadRequestException('Портфолио эсвэл мэргэжлийн танилцуулга заавал шаардлагатай');
      }
    }
    if (AuthService.DRIVER_ROLES.includes(role)) {
      if (!dto.driver_license_number?.trim()) throw new BadRequestException('Жолооны үнэмлэхний дугаар заавал шаардлагатай');
      if (!dto.vehicle_plate_number?.trim()) throw new BadRequestException('Тээврийн хэрэгслийн улсын дугаар заавал шаардлагатай');
    }

    const password_hash = await bcrypt.hash(dto.password, 12);
    const needsVerification = AuthService.REQUIRES_VERIFICATION.includes(role);

    const user = this.userRepository.create({
      email: dto.email,
      password_hash,
      full_name: dto.full_name,
      phone: dto.phone,
      role,
      // Business fields
      company_name: dto.company_name,
      register_number: dto.register_number,
      tax_id: dto.tax_id,
      bank_name: dto.bank_name,
      bank_account: dto.bank_account,
      bank_account_name: dto.bank_account_name,
      office_address: dto.office_address,
      // Designer fields
      portfolio_url: dto.portfolio_url,
      professional_bio: dto.professional_bio,
      skill_certifications: dto.skill_certifications,
      // Courier fields
      driver_license_number: dto.driver_license_number,
      vehicle_plate_number: dto.vehicle_plate_number,
      vehicle_type: dto.vehicle_type,
      insurance_details: dto.insurance_details,
      // Verification
      verification_status: needsVerification ? 'pending' : 'verified',
      is_active: !needsVerification, // Business roles start inactive until verified
    });

    await this.userRepository.save(user);
    return this.generateTokens(user, dto.device_id, dto.device_name, dto.platform);
  }

  async changeRole(userId: string, role: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Хэрэглэгч олдсонгүй');
    user.role = role;
    await this.userRepository.save(user);
    return user;
  }

  async login(dto: LoginDto) {
    // password_hash and totp_secret have select:false, so we must explicitly addSelect
    const user = await this.userRepository.createQueryBuilder('u')
      .addSelect(['u.password_hash', 'u.totp_secret'])
      .where('u.email = :id OR u.phone = :id', { id: dto.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Имэйл/утас эсвэл нууц үг буруу байна');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Имэйл эсвэл нууц үг буруу байна');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Таны бүртгэл идэвхгүй байна');
    }

    // Enforce 2FA when enabled. Setup UI is not yet shipped, so this acts as
    // a guarantee that totp_enabled flag actually protects the account.
    if (user.totp_enabled) {
      const code = (dto.totp_code || '').trim()
      if (!code) {
        throw new UnauthorizedException('TOTP_REQUIRED')
      }
      if (!user.totp_secret) {
        throw new UnauthorizedException('2FA тохиргоо дутуу байна. Админд хандана уу.')
      }
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const speakeasy = require('speakeasy')
      const ok = speakeasy.totp.verify({
        secret: user.totp_secret,
        encoding: 'base32',
        token: code,
        window: 1,
      })
      if (!ok) {
        throw new UnauthorizedException('TOTP код буруу байна')
      }
    }

    return this.generateTokens(user, dto.device_id, dto.device_name, dto.platform);
  }

  async refresh(refreshTokenStr: string) {
    const record = await this.refreshTokenRepo.findOne({
      where: { token: refreshTokenStr, is_revoked: false },
    });

    if (!record || record.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token хүчингүй эсвэл хугацаа дууссан');
    }

    const user = await this.userRepository.findOne({ where: { id: record.user_id } });
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Хэрэглэгч олдсонгүй');
    }

    // Revoke old token
    record.is_revoked = true;
    await this.refreshTokenRepo.save(record);

    // Issue new pair
    return this.generateTokens(user, record.device_id, record.device_name, record.platform);
  }

  async logout(refreshTokenStr: string) {
    const record = await this.refreshTokenRepo.findOne({
      where: { token: refreshTokenStr },
    });
    if (record) {
      record.is_revoked = true;
      await this.refreshTokenRepo.save(record);
    }
    return { success: true };
  }

  async logoutAll(userId: string) {
    await this.refreshTokenRepo.update(
      { user_id: userId, is_revoked: false },
      { is_revoked: true },
    );
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) return null;
    return user;
  }

  async bootstrapAdmin(email?: string, password?: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    if (password.length < 12) {
      throw new BadRequestException('Bootstrap admin password must be at least 12 characters');
    }
    const password_hash = await bcrypt.hash(password, 12);

    let user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      user.password_hash = password_hash;
      user.role = 'superadmin';
      user.is_active = true;
      user.verification_status = 'verified';
      await this.userRepository.save(user);
      return { ok: true, action: 'reset', email, role: 'superadmin' };
    }

    user = this.userRepository.create({
      email,
      password_hash,
      full_name: 'Super Admin',
      role: 'superadmin',
      is_active: true,
      verification_status: 'verified',
    });
    await this.userRepository.save(user);
    return { ok: true, action: 'created', email, role: 'superadmin' };
  }

  private async generateTokens(
    user: User,
    deviceId?: string,
    deviceName?: string,
    platform?: string,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      is_creator: user.is_creator || false,
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Generate refresh token
    const refreshTokenStr = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    const refreshToken = this.refreshTokenRepo.create({
      token: refreshTokenStr,
      user_id: user.id,
      device_id: deviceId || null,
      device_name: deviceName || null,
      platform: platform || 'web',
      expires_at: expiresAt,
    });
    await this.refreshTokenRepo.save(refreshToken);

    // Cleanup expired tokens periodically
    this.cleanupExpiredTokens().catch(() => {});

    return {
      access_token,
      refresh_token: refreshTokenStr,
      expires_in: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_creator: user.is_creator || false,
        creator_status: user.creator_status || null,
        creator_capabilities: user.creator_capabilities || [],
      },
    };
  }

  // Backward compatibility — old method name
  private generateToken(user: User) {
    return this.generateTokens(user);
  }

  async updateDocuments(userId: string, docs: {
    id_card_front_url?: string; id_card_back_url?: string;
    business_license_url?: string; certification_url?: string;
  }) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Хэрэглэгч олдсонгүй');
    if (docs.id_card_front_url) user.id_card_front_url = docs.id_card_front_url;
    if (docs.id_card_back_url) user.id_card_back_url = docs.id_card_back_url;
    if (docs.business_license_url) user.business_license_url = docs.business_license_url;
    if (docs.certification_url) user.certification_url = docs.certification_url;
    // Move to under_review if pending and docs uploaded
    if (user.verification_status === 'pending' && (docs.id_card_front_url || docs.business_license_url)) {
      user.verification_status = 'under_review';
    }
    await this.userRepository.save(user);
    return user;
  }

  // ─── Forgot / Reset Password ─────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    const successMsg = { success: true, message: 'Хэрэв бүртгэлтэй имэйл бол нууц үг сэргээх линк илгээгдлээ' };
    if (!user) return successMsg;

    // Generate raw token + sha256 hash (raw token NEVER stored)
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = sha256(rawToken);
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + RESET_TOKEN_HOURS);

    // Invalidate old unused tokens for this user
    await this.resetRepo
      .createQueryBuilder()
      .update()
      .set({ used_at: new Date() })
      .where('user_id = :uid AND used_at IS NULL', { uid: user.id })
      .execute();

    // Save hashed token
    const entity = this.resetRepo.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at,
    });
    await this.resetRepo.save(entity);

    // Send email via MailService
    const resetUrl = `${process.env.FRONTEND_URL || 'https://frontend-biz6.vercel.app'}/reset-password?token=${rawToken}`;
    try {
      await this.mailService.sendPasswordReset({
        to: user.email,
        name: user.full_name || '',
        resetUrl,
        expiresHours: RESET_TOKEN_HOURS,
      });
    } catch {}

    return successMsg;
  }

  async resetPassword(rawToken: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой');
    }

    // Hash incoming token and look up by hash
    const tokenHash = sha256(rawToken);
    const record = await this.resetRepo.findOne({
      where: { token_hash: tokenHash },
    });

    if (!record || record.used_at) {
      throw new BadRequestException('Нууц үг сэргээх линк буруу эсвэл аль хэдийн ашиглагдсан');
    }
    if (record.expires_at < new Date()) {
      throw new BadRequestException('Нууц үг сэргээх линкийн хугацаа дууссан. Дахин хүсэлт илгээнэ үү.');
    }

    // Update password
    const password_hash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(record.user_id, { password_hash });

    // Mark token as used (single-use)
    record.used_at = new Date();
    await this.resetRepo.save(record);

    return { success: true, message: 'Нууц үг амжилттай шинэчлэгдлээ. Нэвтэрнэ үү.' };
  }

  async validateResetToken(rawToken: string) {
    const tokenHash = sha256(rawToken);
    const record = await this.resetRepo.findOne({
      where: { token_hash: tokenHash },
    });
    if (!record || record.used_at || record.expires_at < new Date()) {
      return { valid: false };
    }
    return { valid: true };
  }

  private async cleanupExpiredTokens() {
    await this.refreshTokenRepo.delete({
      expires_at: LessThan(new Date()),
    });
  }
}
