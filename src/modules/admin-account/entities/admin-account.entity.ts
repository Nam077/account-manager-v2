import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Account } from 'src/modules/account/entities/account.entity';
import { Workspace } from 'src/modules/workspace/entities/workspace.entity';
@Entity({ name: 'admin_accounts' })
export class AdminAccount {
    @PrimaryGeneratedColumn('uuid', { comment: 'Primary key of the account table' })
    id: string;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Email of the account' })
    email: string;

    @Column({ type: 'text', nullable: true, comment: 'Value of the account' })
    value: string;

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
        name: 'account_id',
        comment: 'Foreign key of the account',
    })
    accountId: string;

    // relation with account category
    @ManyToOne(() => Account, (account) => account.adminAccounts)
    @JoinColumn({ name: 'account_id' })
    account: Account;

    @OneToMany(() => Workspace, (workspace) => workspace.adminAccount)
    workspaces: Workspace[];
}
