import { Customer } from './../../customer/entities/customer.entity';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
@Entity({ name: 'emails' })
export class Email {
    @PrimaryGeneratedColumn('uuid', { comment: 'Primary key of the email table' })
    id: string;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Email of the email' })
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

    // relation with customer
    @ManyToOne(() => Customer, (customer) => customer.emails)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;
}
