import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { log } from 'console';
import { from, Observable, of, switchMap } from 'rxjs';
import { GeoIpI } from 'src/decorator/ip.decorator';

import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { JwtGenerate } from './jwt-generate';
import { JwtPayload } from './strategies/auth-strategy/auth-strategy';

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        private readonly jwtGenerate: JwtGenerate,
    ) {}
    login(loginDto: LoginDto, ipGeo: GeoIpI) {
        log(ipGeo);
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
