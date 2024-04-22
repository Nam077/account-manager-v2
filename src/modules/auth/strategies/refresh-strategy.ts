import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Observable } from 'rxjs';

import { JwtPayload } from '../../../interfaces/jwt-payload';
import { User } from '../../user/entities/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-strategy') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: true,
            secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: JwtPayload): Observable<User> {
        const refreshToken = this.getTokenFromRequest(req);
        if (!refreshToken) {
            throw new UnauthorizedException('Invalid token');
        }
        return this.authService.validateRefreshToken(refreshToken, payload);
    }

    getTokenFromRequest(req: Request) {
        return req.get('Authorization')?.replace('Bearer ', '') || req.body.refreshToken || req.query.refreshToken;
    }
}
