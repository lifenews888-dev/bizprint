import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

const JWT_SECRET = process.env.JWT_SECRET;
const KNOWN_DEFAULTS = ['bizprint_super_secret_key_2026', 'bizprint-bootstrap-2026', 'changeme', 'secret'];
if (!JWT_SECRET || JWT_SECRET.length < 24 || KNOWN_DEFAULTS.includes(JWT_SECRET)) {
  throw new Error('JWT_SECRET environment variable must be set to a non-default value of at least 24 characters');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
