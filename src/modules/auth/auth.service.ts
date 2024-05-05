import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { I18nService } from 'nestjs-i18n/dist/services/i18n.service';
import { from, map, Observable, of, switchMap } from 'rxjs';

import { GeoIpI, JwtPayload } from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { CreateRefreshTokenDto } from '../refresh-token/dto/create-refresh-token.dto';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { JwtServiceCustom } from './jwt-service';

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        private readonly jwtServiceCustom: JwtServiceCustom,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}
    login(loginDto: LoginDto, ipGeo: GeoIpI) {
        return from(this.userService.login(loginDto)).pipe(
            switchMap((user) => {
                const token = this.jwtServiceCustom.generateToken(user);
                const createRefreshTokenDto: CreateRefreshTokenDto = {
                    token: token.refreshToken,
                    userId: user.id,
                    data: JSON.stringify(ipGeo),
                };
                return this.refreshTokenService.create(createRefreshTokenDto).pipe(
                    switchMap(() => {
                        return of({
                            token,
                        });
                    }),
                );
            }),
        );
    }
    validateUser(payload: JwtPayload): Observable<User> {
        return this.userService.validateUser(payload);
    }

    validateRefreshToken(refreshToken: string, payload: JwtPayload): Observable<User> {
        const isExpired = this.jwtServiceCustom.checkTimeExpire(payload.exp);
        if (isExpired) {
            return this.refreshTokenService.removeByToken(refreshToken).pipe(
                switchMap(() => {
                    throw new UnauthorizedException(
                        this.i18nService.translate('message.Authentication.TokenExpired', {
                            lang: I18nContext.current().lang,
                        }),
                    );
                }),
            );
        }
        return this.refreshTokenService.findByToken(refreshToken).pipe(
            switchMap((refreshToken) => {
                if (!refreshToken) {
                    throw new UnauthorizedException('Invalid token');
                }
                return this.userService
                    .findOneProcess(refreshToken.userId, {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                        },
                    })
                    .pipe(
                        map((user) => {
                            return {
                                ...user,
                                refreshToken,
                            };
                        }),
                    );
            }),
        );
    }
    refresh(user: User) {
        return of(this.jwtServiceCustom.generateJwtAccessToken(user));
    }

    logoutAll(user: User) {
        return this.refreshTokenService.removeByUserId(user.id);
    }
}
