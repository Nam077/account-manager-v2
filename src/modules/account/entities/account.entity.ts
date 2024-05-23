import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { AccountCategory } from '../../account-category/entities/account-category.entity';
import { AccountPrice } from '../../account-price/entities/account-price.entity';
import { AdminAccount } from '../../admin-account/entities/admin-account.entity';
import { Rental } from '../../rental/entities/rental.entity';

@Entity({ name: 'accounts' })
export class Account {
    @PrimaryGeneratedColumn('uuid', {
        comment: 'Primary key of the account table',
    })
    id: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Name of the account',
    })
    name: string;

    @Column({
        type: 'longtext',
        nullable: false,
        comment: 'Description of the account',
    })
    description: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        unique: true,
        comment: 'Slug of the account',
    })
    slug: string;

    @CreateDateColumn({
        comment: 'Date and time when the account was created',
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the account was last updated',
        name: 'updated_at',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the account was deleted',
        name: 'deleted_at',
    })
    deletedAt: Date;

    @Column({
        type: 'uuid',
        nullable: false,
        name: 'account_category_id',
        comment: 'Foreign key of the account category',
    })
    accountCategoryId: string;

    // relation with account category
    @ManyToOne(() => AccountCategory, (accountCategory) => accountCategory.accounts)
    @JoinColumn({ name: 'account_category_id' })
    accountCategory: AccountCategory;

    @OneToMany(() => AdminAccount, (adminAccount) => adminAccount.account)
    adminAccounts: AdminAccount[];

    @OneToMany(() => AccountPrice, (accountPrice) => accountPrice.account)
    accountPrices: AccountPrice[];

    @OneToMany(() => Rental, (rental) => rental.account)
    rentals: Rental[];
}
