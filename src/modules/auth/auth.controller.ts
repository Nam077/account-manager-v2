import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Details } from 'express-useragent';

import { GeoIp, GeoIpI, GetCurrentUser, UserAgentCustom } from '../../common';
import { AuthJwtGuard, RefreshGuard } from '../../common/guard';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    @Post('login')
    login(@Body() loginDto: LoginDto, @UserAgentCustom() ua: Details, @GeoIp() ipGeo: GeoIpI) {
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
