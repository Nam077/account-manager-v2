import { User } from '../../modules/user/entities/user.entity';

export interface UserAuth extends User {
    refreshToken: string;
}
