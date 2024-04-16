import { AccountCategory } from 'src/modules/account-category/entities/account-category.entity';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
@Entity({ name: 'accounts' })
export class Account {
    @PrimaryGeneratedColumn('uuid', { comment: 'Primary key of the account table' })
    id: string;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Name of the account' })
    name: string;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Description of the account' })
    description: string;

    @Column({ type: 'varchar', length: 255, nullable: false, unique: true, comment: 'Slug of the account' })
    slug: string;

    @CreateDateColumn({
        comment: 'Date and time when the account was created',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the account was last updated',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the account was deleted',
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
}
