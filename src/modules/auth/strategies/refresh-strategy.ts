import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { I18nService } from 'nestjs-i18n/dist/services/i18n.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Observable } from 'rxjs';

import { JwtPayload } from '../../../common/interface/jwt-payload.interface';
import { I18nTranslations } from '../../../i18n/i18n.generated';
import { User } from '../../user/entities/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-strategy') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
        private readonly i18nService: I18nService<I18nTranslations>,
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
            throw new UnauthorizedException(
                this.i18nService.translate('message.Authentication.InvalidToken', {
                    lang: I18nContext.current().lang,
                }),
            );
        }
        return this.authService.validateRefreshToken(refreshToken, payload);
    }

    getTokenFromRequest(req: Request) {
        return req.get('Authorization')?.replace('Bearer ', '') || req.body.refreshToken || req.query.refreshToken;
    }
}
