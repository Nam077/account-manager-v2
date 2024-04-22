import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Details } from 'express-useragent';
import { GetCurrentUser } from 'src/decorator/auth.decorator';
import { GeoIp, GeoIpI } from 'src/decorator/ip.decorator';
import { UserAgent } from 'src/decorator/useragent.decorator';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthJwtGuard } from './guard/auth-jwt.guard';
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
}
