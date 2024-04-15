import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthStrategy } from './strategies/auth-strategy/auth-strategy';
import { JwtGenerate } from './jwt-generate';

@Module({
    imports: [UserModule, JwtModule.register({}), ConfigModule.forRoot({})],
    controllers: [AuthController],
    providers: [AuthService, AuthStrategy, JwtGenerate],
})
export class AuthModule {}
