import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGenerate } from './jwt-generate';
import { AuthStrategy } from './strategies/auth-strategy/auth-strategy';

@Module({
    imports: [UserModule, JwtModule.register({}), ConfigModule.forRoot({})],
    controllers: [AuthController],
    providers: [AuthService, AuthStrategy, JwtGenerate],
})
export class AuthModule {}
