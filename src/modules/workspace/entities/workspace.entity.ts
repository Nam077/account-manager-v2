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

import { AdminAccount } from '../../admin-account/entities/admin-account.entity';
import { WorkspaceEmail } from '../../workspace-email/entities/workspace-email.entity';
@Entity({ name: 'workspaces' })
export class Workspace {
    @PrimaryGeneratedColumn('uuid', {
        comment: 'Primary key of the workspace table',
    })
    id: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: 'Description of the workspace',
        default: '',
    })
    description: string;

    @Column({
        type: 'tinyint',
        nullable: false,
        default: 1,
        comment: 'Maximum customers allowed in the workspace',
        name: 'max_customers',
    })
    maxSlots: number;

    @Column({
        type: 'boolean',
        nullable: false,
        default: 1,
        comment: 'Is workspace shared',
        name: 'is_shared',
    })
    isShared: boolean;

    @CreateDateColumn({
        comment: 'Date and time when the workspace was created',
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the workspace was last updated',
        name: 'updated_at',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the workspace was deleted',
        name: 'deleted_at',
    })
    deletedAt: Date;

    @Column({
        type: 'uuid',
        nullable: false,
        comment: 'Admin account id',
        name: 'admin_account_id',
    })
    adminAccountId: string;

    //relations
    @ManyToOne(() => AdminAccount, (adminAccount) => adminAccount.workspaces)
    @JoinColumn({ name: 'admin_account_id' })
    adminAccount: AdminAccount;

    @OneToMany(() => WorkspaceEmail, (workspaceEmail) => workspaceEmail.workspace)
    workspaceEmails: WorkspaceEmail[];
}
