import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../user/entities/user.entity';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid', { comment: 'Primary key of the refresh token table' })
    id: string;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Refresh token' })
    token: string;

    @Column({ type: 'text', nullable: true, comment: 'Data of the refresh token' })
    data: string; //

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'User id of the refresh token', name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, (user) => user.refreshTokens)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({
        comment: 'Date and time when the refresh token was created',
        name: 'created_at',
    })
    createdAt: Date;
}
