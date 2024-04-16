import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';

@Injectable()
export class JwtGenerate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    generateJwtAccessToken(user: User): { accessToken: string } {
        const payload = { email: user.email, sub: user.id };
        return {
            accessToken: this.jwtService.sign(payload, {
                secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
                expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
            }),
        };
    }
    generateJwtRefreshToken(user: User): { refreshToken: string } {
        const payload = { email: user.email, sub: user.id };
        return {
            refreshToken: this.jwtService.sign(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
                expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
            }),
        };
    }

    generateToken(user: User) {
        return {
            ...this.generateJwtAccessToken(user),
            ...this.generateJwtRefreshToken(user),
        };
    }
}