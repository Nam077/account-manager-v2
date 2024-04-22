import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { from, Observable, of, switchMap } from 'rxjs';

import { GeoIpI } from '../../decorator/ip.decorator';
import { JwtPayload } from '../../interfaces/jwt-payload';
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
    ) {}
    login(loginDto: LoginDto, ipGeo: GeoIpI) {
        return from(this.userService.login(loginDto)).pipe(
            switchMap((user) => {
                console.log(user);

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
                    throw new UnauthorizedException('Token expired');
                }),
            );
        }
        return this.refreshTokenService.findByToken(refreshToken).pipe(
            switchMap((refreshToken) => {
                if (!refreshToken) {
                    throw new UnauthorizedException('Invalid token');
                }
                return this.userService.findOneData(refreshToken.userId);
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
