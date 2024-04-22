import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserAgent } from 'src/decorator/useragent.decorator';
import { LoginDto } from './dto/login.dto';
import { GeoIp, GeoIpI } from 'src/decorator/ip.decorator';
import { Details } from 'express-useragent';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthJwtGuard } from './guard/auth-jwt.guard';
import { GetCurrentUser } from 'src/decorator/auth.decorator';
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
