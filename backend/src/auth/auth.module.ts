import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../users/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Role } from './entities/role.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { Referral } from '../referral/referral.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Role, PasswordReset, Referral]),
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        const knownDefaults = ['bizprint_super_secret_key_2026', 'bizprint-bootstrap-2026', 'changeme', 'secret'];
        if (!secret || secret.length < 24 || knownDefaults.includes(secret)) {
          throw new Error('JWT_SECRET environment variable must be set to a non-default value of at least 24 characters');
        }
        return { secret, signOptions: { expiresIn: '15m' } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
