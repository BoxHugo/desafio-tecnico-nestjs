import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super(JwtStrategy.buildStrategyOptions(config));
  }

  private static buildStrategyOptions(
    config: ConfigService,
  ): StrategyOptionsWithoutRequest {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET não definido no .env');
    }
    return {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    };
  }

  validate(payload: any) {
    return {
      sub: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }
}
