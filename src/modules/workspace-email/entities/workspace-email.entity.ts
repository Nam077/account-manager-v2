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
import { Workspace } from 'src/modules/workspace/entities/workspace.entity';
import { Email } from 'src/modules/email/entities/email.entity';

@Entity({ name: 'workspace_emails' })
export class WorkspaceEmail {
    @PrimaryGeneratedColumn('uuid', { comment: 'Primary key of the workspace email table' })
    id: string;

    @Column({ type: 'uuid', nullable: false, comment: 'Workspace id', name: 'workspace_id' })
    workspaceId: string;

    @Column({ type: 'uuid', nullable: false, comment: 'Email id', name: 'email_id' })
    emailId: string;

    @CreateDateColumn({
        comment: 'Date and time when the workspace email was created',
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the workspace email was last updated',
        name: 'updated_at',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the workspace email was deleted',
        name: 'deleted_at',
    })
    deletedAt: Date;

    //relations
    @ManyToOne(() => Workspace, (workspace) => workspace.workspaceEmails)
    @JoinColumn({ name: 'workspace_id' })
    workspace: Workspace;

    @ManyToOne(() => Email, (email) => email.workspaceEmails)
    @JoinColumn({ name: 'email_id' })
    email: Email;
}
