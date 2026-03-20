import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../users/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const REFRESH_TOKEN_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
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
      },
    };
  }

  // Backward compatibility — old method name
  private generateToken(user: User) {
    return this.generateTokens(user);
  }

  private async cleanupExpiredTokens() {
    await this.refreshTokenRepo.delete({
      expires_at: LessThan(new Date()),
    });
  }
}
