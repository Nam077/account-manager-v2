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

import { RentalStatus } from '../../../common';
import { Account } from '../../account/entities/account.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Email } from '../../email/entities/email.entity';
import { RentalRenew } from '../../rental-renew/entities/rental-renew.entity';
import { RentalType } from '../../rental-type/entities/rental-type.entity';
import { WorkspaceEmail } from '../../workspace-email/entities/workspace-email.entity';

@Entity({ name: 'rentals' })
export class Rental {
    @PrimaryGeneratedColumn('uuid', {
        comment: 'Primary key of the rental table',
    })
    id: string;

    @Column({
        type: 'uuid',
        nullable: false,
        comment: 'Customer id',
        name: 'customer_id',
    })
    customerId: string;

    @Column({
        type: 'uuid',
        nullable: false,
        comment: 'Account id',
        name: 'account_id',
    })
    accountId: string;

    @Column({
        type: 'uuid',
        nullable: true,
        comment: 'Workspace email id',
        name: 'workspace_email_id',
        default: null,
    })
    workspaceEmailId: string;

    @Column({
        type: 'uuid',
        nullable: false,
        comment: 'Email id',
        name: 'email_id',
    })
    emailId: string;

    @Column({
        type: 'uuid',
        nullable: false,
        comment: 'Rental type id',
        name: 'rental_type_id',
    })
    rentalTypeId: string;

    @Column({
        type: 'date',
        nullable: false,
        comment: 'Start date of the rental',
        name: 'start_date',
    })
    startDate: Date;

    @Column({
        type: 'date',
        nullable: false,
        comment: 'End date of the rental',
        name: 'end_date',
    })
    endDate: Date;

    @Column({
        type: 'enum',
        enum: RentalStatus,
        default: RentalStatus.ACTIVE,
        comment: 'Status of the rental',
    })
    status: RentalStatus;

    @Column({ type: 'text', nullable: true, comment: 'Note of the rental' })
    note: string;

    @CreateDateColumn({
        comment: 'Date and time when the rental was created',
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the rental was last updated',
        name: 'updated_at',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the rental was deleted',
        name: 'deleted_at',
    })
    deletedAt: Date;

    //relations
    @ManyToOne(() => Customer, (customer) => customer.rentals)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @ManyToOne(() => Account, (account) => account.rentals)
    @JoinColumn({ name: 'account_id' })
    account: Account;

    @ManyToOne(() => Email, (email) => email.rentals)
    @JoinColumn({ name: 'email_id' })
    email: Email;

    @ManyToOne(() => WorkspaceEmail, (workspaceEmail) => workspaceEmail.rentals)
    @JoinColumn({ name: 'workspace_email_id' })
    workspaceEmail: WorkspaceEmail;

    @OneToMany(() => RentalRenew, (rentalRenew) => rentalRenew.rental)
    rentalRenews: RentalRenew[];

    @ManyToOne(() => RentalType, (rentalType) => rentalType.rentals)
    @JoinColumn({ name: 'rental_type_id' })
    rentalType: RentalType;
}
