import { Injectable } from '@nestjs/common';
import { GeoIpI } from 'src/decorator/ip.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/auth-strategy/auth-strategy';
import { Observable, from, of, switchMap } from 'rxjs';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { JwtGenerate } from './jwt-generate';
import { log } from 'console';

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        private readonly jwtGenerate: JwtGenerate,
    ) {}
    login(loginDto: LoginDto, ipGeo: GeoIpI) {
        return from(this.userService.login(loginDto)).pipe(
            switchMap((user) => {
                const token = this.jwtGenerate.generateToken(user);
                return of({ token, message: 'Login successfully' });
            }),
        );
    }
    validateUser(payload: JwtPayload): Observable<User> {
        return this.userService.validateUser(payload);
    }
}
