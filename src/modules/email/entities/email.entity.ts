import { Rental } from 'src/modules/rental/entities/rental.entity';
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

import { Customer } from '../../customer/entities/customer.entity';
import { WorkspaceEmail } from '../../workspace-email/entities/workspace-email.entity';

@Entity({ name: 'emails' })
export class Email {
    @PrimaryGeneratedColumn('uuid', { comment: 'Primary key of the email table' })
    id: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Email of the email',
    })
    email: string;

    @Column({
        type: 'uuid',
        nullable: false,
        name: 'customer_id',
        comment: 'Foreign key of the customer',
    })
    @CreateDateColumn({
        comment: 'Date and time when the email was created',
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the email was last updated',
        name: 'updated_at',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the email was deleted',
        name: 'deleted_at',
    })
    deletedAt: Date;

    @Column({
        type: 'uuid',
        nullable: false,
        name: 'customer_id',
        comment: 'Foreign key of the customer',
    })
    customerId: string;

    @ManyToOne(() => Customer, (customer) => customer.emails)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @OneToMany(() => WorkspaceEmail, (workspaceEmail) => workspaceEmail.email)
    workspaceEmails: WorkspaceEmail[];

    @OneToMany(() => Rental, (rental) => rental.email)
    rentals: Rental[];
}
