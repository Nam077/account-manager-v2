import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, switchMap } from 'rxjs';
import { Repository } from 'typeorm';

import { UserService } from '../user/user.service';
import { CreateRefreshTokenDto } from './dto/create-refresh-token.dto';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class RefreshTokenService {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
    ) {}

    create(createRefreshTokenDto: CreateRefreshTokenDto) {
        const { token, userId, data } = createRefreshTokenDto;

        return this.userService.findOneProcess(userId).pipe(
            switchMap((user) => {
                if (!user) {
                    throw new NotFoundException('User not found');
                }

                const refreshToken = new RefreshToken();

                refreshToken.token = token;
                refreshToken.data = data;
                refreshToken.userId = userId;

                return from(this.refreshTokenRepository.save(refreshToken));
            }),
        );
    }

    delete(id: string) {
        return from(this.refreshTokenRepository.delete(id));
    }

    findAllByUserId(userId: string) {
        return from(this.refreshTokenRepository.find({ where: { userId } }));
    }

    removeByUserId(userId: string) {
        return from(this.refreshTokenRepository.delete({ userId }));
    }

    removeByToken(token: string) {
        return from(this.refreshTokenRepository.delete({ token }));
    }

    findByToken(token: string) {
        return from(this.refreshTokenRepository.findOne({ where: { token } }));
    }
}
