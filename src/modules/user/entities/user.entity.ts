import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { UserRole } from '../../../common/enum';
import { RefreshToken } from '../../refresh-token/entities/refresh-token.entity';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid', { comment: 'Primary key of the user table' })
    id: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Name of the user',
    })
    name: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        unique: true,
        comment: 'Email of the user',
    })
    email: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Password of the user',
        select: false,
    })
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
        comment: 'Role of the user',
    })
    role: UserRole;

    @CreateDateColumn({
        comment: 'Date and time when the user was created',
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the user was last updated',
        name: 'updated_at',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the user was deleted',
        name: 'deleted_at',
    })
    deletedAt: Date;

    @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
    refreshTokens: RefreshToken[];
}
