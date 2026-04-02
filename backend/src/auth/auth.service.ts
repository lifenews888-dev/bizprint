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
import { randomBytes } from 'crypto';
import { User } from '../users/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const REFRESH_TOKEN_DAYS = 30;
const RESET_TOKEN_HOURS = 2;

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
  ) {}

  async register(dto: RegisterDto) {
    // Password is REQUIRED for new registration
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой');
    }

    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Энэ имэйл бүртгэлтэй байна');
    }

    const password_hash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      email: dto.email,
      password_hash,
      full_name: dto.full_name,
      phone: dto.phone,
      company_name: dto.company_name,
      role: dto.role || 'customer',
    });

    await this.userRepository.save(user);
    return this.generateTokens(user, dto.device_id, dto.device_name, dto.platform);
  }

  async changeRole(userId: string, role: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Хэрэглэгч олдсонгүй');
    user.role = role;
    await this.userRepository.save(user);
    const { password_hash, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Имэйл эсвэл нууц үг буруу байна');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Имэйл эсвэл нууц үг буруу байна');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Таны бүртгэл идэвхгүй байна');
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
    const { password_hash, ...result } = user;
    return result;
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

    const access_token = this.jwtService.sign(payload, { expiresIn: '7d' });

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

  // ─── Forgot / Reset Password ─────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) return { success: true, message: 'Хэрэв бүртгэлтэй имэйл бол нууц үг сэргээх линк илгээгдлээ' };

    // Generate token
    const token = randomBytes(32).toString('hex');
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + RESET_TOKEN_HOURS);

    // Invalidate old tokens
    await this.resetRepo.update(
      { user_id: user.id, used_at: null as any },
      { used_at: new Date() },
    );

    // Save new token
    await this.resetRepo.save(this.resetRepo.create({
      user_id: user.id,
      token,
      expires_at,
    }));

    // Send email (try mail service, fallback to log)
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'https://frontend-biz6.vercel.app'}/reset-password?token=${token}`;
      // Use internal fetch to mail endpoint if available
      const port = process.env.PORT || 4000;
      await fetch(`http://localhost:${port}/mail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: 'BizPrint — Нууц үг сэргээх',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
              <h2 style="color:#FF6B00">BizPrint</h2>
              <p>Сайн байна уу, ${user.full_name || ''}!</p>
              <p>Та нууц үг сэргээх хүсэлт илгээсэн байна.</p>
              <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#FF6B00;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0">
                Нууц үг сэргээх
              </a>
              <p style="font-size:12px;color:#666">Энэ линк ${RESET_TOKEN_HOURS} цагийн дотор хүчинтэй.</p>
              <p style="font-size:12px;color:#666">Хэрэв та хүсэлт илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.</p>
            </div>
          `,
        }),
      }).catch(() => {});
    } catch {}

    return { success: true, message: 'Хэрэв бүртгэлтэй имэйл бол нууц үг сэргээх линк илгээгдлээ' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой');
    }

    const record = await this.resetRepo.findOne({ where: { token, used_at: null as any } });
    if (!record) {
      throw new BadRequestException('Нууц үг сэргээх линк буруу эсвэл хугацаа дууссан');
    }

    if (record.expires_at < new Date()) {
      throw new BadRequestException('Нууц үг сэргээх линкийн хугацаа дууссан. Дахин хүсэлт илгээнэ үү.');
    }

    // Update password
    const password_hash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(record.user_id, { password_hash });

    // Mark token as used
    record.used_at = new Date();
    await this.resetRepo.save(record);

    return { success: true, message: 'Нууц үг амжилттай шинэчлэгдлээ. Нэвтэрнэ үү.' };
  }

  async validateResetToken(token: string) {
    const record = await this.resetRepo.findOne({ where: { token, used_at: null as any } });
    if (!record || record.expires_at < new Date()) {
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
