import { Account } from 'src/modules/account/entities/account.entity';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
} from 'typeorm';
@Entity({ name: 'account_categories' })
export class AccountCategory {
    @PrimaryGeneratedColumn('uuid', { comment: 'Primary key of the account category table' })
    id: string;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Name of the account category' })
    name: string;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Description of the account category' })
    description: string;

    @Column({ type: 'varchar', length: 255, nullable: false, unique: true, comment: 'Slug of the account category' })
    slug: string;

    @CreateDateColumn({
        comment: 'Date and time when the account category was created',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the account category was last updated',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the account category was deleted',
    })
    deletedAt: Date;

    @OneToMany(() => Account, (account) => account.accountCategory)
    accounts: Account[];
}
