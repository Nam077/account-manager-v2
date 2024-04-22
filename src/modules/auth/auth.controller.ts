import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Details } from 'express-useragent';

import { GetCurrentUser } from '../../decorator/auth.decorator';
import { GeoIp, GeoIpI } from '../../decorator/ip.decorator';
import { UserAgent } from '../../decorator/useragent.decorator';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthJwtGuard } from './guard/auth-jwt.guard';
import { RefreshGuard } from './guard/refresh.guard';
@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    @Post('login')
    login(@Body() loginDto: LoginDto, @UserAgent() ua: Details, @GeoIp() ipGeo: GeoIpI) {
        return this.authService.login(loginDto, ipGeo);
    }

    @Get('profile')
    @UseGuards(AuthJwtGuard)
    profile(@GetCurrentUser('id') id: string) {
        return id;
    }

    @Get('refresh')
    @UseGuards(RefreshGuard)
    refresh(@GetCurrentUser() user: User) {
        return this.authService.refresh(user);
    }

    @Get('logout-all')
    @UseGuards(AuthJwtGuard)
    logoutAll(@GetCurrentUser() user: User) {
        return this.authService.logoutAll(user);
    }
}
