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
import { AccountPrice } from '../../account-price/entities/account-price.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Email } from '../../email/entities/email.entity';
import { RentalRenew } from '../../rental-renew/entities/rental-renew.entity';
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
        comment: 'Account price id',
        name: 'account_price_id',
    })
    accountPriceId: string;

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

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: false,
        comment: 'Payment amount',
        name: 'payment_amount',
    })
    paymentAmount: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: false,
        comment: 'Total price of the rental',
        name: 'total_price',
    })
    totalPrice: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: false,
        comment: 'Warranty fee',
        name: 'warranty_fee',
    })
    warrantyFee: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: false,
        comment: 'Discount',
    })
    discount: number;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Payment method',
        name: 'payment_method',
        default: 'cash',
    })
    paymentMethod: string;

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

    @ManyToOne(() => AccountPrice, (accountPrice) => accountPrice.rentals)
    @JoinColumn({ name: 'account_price_id' })
    accountPrice: AccountPrice;

    @ManyToOne(() => Email, (email) => email.workspaceEmails)
    @JoinColumn({ name: 'email_id' })
    email: Email;

    @ManyToOne(() => WorkspaceEmail, (workspaceEmail) => workspaceEmail.rentals)
    @JoinColumn({ name: 'workspace_email_id' })
    workspaceEmail: WorkspaceEmail;

    @OneToMany(() => RentalRenew, (rentalRenew) => rentalRenew.rental)
    rentalRenews: RentalRenew[];
}
