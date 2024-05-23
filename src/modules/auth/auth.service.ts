import { Injectable, UnauthorizedException } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { I18nService } from 'nestjs-i18n/dist/services/i18n.service';
import { from, Observable, of, switchMap } from 'rxjs';

import { GeoIpI, JwtPayload, UserAuth } from '../../common';
import { I18nTranslations } from '../../i18n/i18n.generated';
import { CreateRefreshTokenDto } from '../refresh-token/dto/create-refresh-token.dto';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { JwtServiceCustom } from './jwt-service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtServiceCustom: JwtServiceCustom,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) {}

    public login(loginDto: LoginDto, ipGeo: GeoIpI) {
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
                            user,
                        });
                    }),
                );
            }),
        );
    }

    public validateUser(payload: JwtPayload): Observable<UserAuth> {
        return this.userService.validateUser(payload) as Observable<UserAuth>;
    }

    public validateRefreshToken(refreshToken: string, payload: JwtPayload): Observable<UserAuth> {
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
                        switchMap((user): Observable<UserAuth> => {
                            if (!user) {
                                throw new UnauthorizedException(
                                    this.i18nService.translate('message.Authentication.Unauthorized', {
                                        lang: I18nContext.current().lang,
                                    }),
                                );
                            }

                            return of({
                                ...user,
                                refreshToken: refreshToken.token,
                            });
                        }),
                    );
            }),
        );
    }

    public refresh(user: UserAuth) {
        return of(this.jwtServiceCustom.generateJwtAccessToken(user));
    }

    public logoutAll(user: UserAuth) {
        return this.refreshTokenService.removeByUserId(user.id);
    }

    public logout(user: UserAuth) {
        return this.refreshTokenService.removeByToken(user.refreshToken);
    }
}
