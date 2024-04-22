import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { RefreshTokenModule } from '../refresh-token/refresh-token.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtServiceCustom } from './jwt-service';
import { AuthStrategy } from './strategies/auth-strategy';
import { RefreshJwtStrategy } from './strategies/refresh-strategy';

@Module({
    imports: [UserModule, JwtModule.register({}), ConfigModule.forRoot({}), RefreshTokenModule],
    controllers: [AuthController],
    providers: [AuthService, AuthStrategy, JwtServiceCustom, RefreshJwtStrategy],
})
export class AuthModule {}
