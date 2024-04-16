import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    SUPER_ADMIN = 'super_admin',
}
@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid', { comment: 'Primary key of the user table' })
    id: string;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Name of the user' })
    name: string;

    @Column({ type: 'varchar', length: 255, nullable: false, unique: true, comment: 'Email of the user' })
    email: string;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Password of the user', select: false })
    password: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER, comment: 'Role of the user' })
    role: UserRole;

    @CreateDateColumn({
        comment: 'Date and time when the user was created',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the user was last updated',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the user was deleted',
    })
    deletedAt: Date;
}