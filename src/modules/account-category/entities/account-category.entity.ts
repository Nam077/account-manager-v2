import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Account } from '../../account/entities/account.entity';

@Entity({ name: 'account_categories' })
export class AccountCategory {
    @PrimaryGeneratedColumn('uuid', {
        comment: 'Primary key of the account category table',
    })
    id: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Name of the account category',
    })
    name: string;

    @Column({
        type: 'longtext',
        nullable: true,
        default: null,
        comment: 'Description of the account category',
    })
    description: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        unique: true,
        comment: 'Slug of the account category',
    })
    slug: string;

    @CreateDateColumn({
        comment: 'Date and time when the account category was created',
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the account category was last updated',
        name: 'updated_at',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the account category was deleted',
        name: 'deleted_at',
    })
    deletedAt: Date;

    @OneToMany(() => Account, (account) => account.accountCategory)
    accounts: Account[];
}
