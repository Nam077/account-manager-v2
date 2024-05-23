import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { map, Observable } from 'rxjs';

import { UserAuth } from '../../../common';
import { JwtPayload } from '../../../common/interface/jwt-payload.interface';
import { I18nTranslations } from '../../../i18n/i18n.generated';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy, 'auth-strategy') {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        });
    }

    public validate(payload: JwtPayload): Observable<UserAuth> {
        return this.authService.validateUser(payload).pipe(
            map((user) => {
                if (!user) {
                    throw new UnauthorizedException(
                        this.i18nService.translate('message.Authentication.Unauthorized', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }

                return user;
            }),
        );
    }
}
