import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Email } from '../../email/entities/email.entity';
import { Rental } from '../../rental/entities/rental.entity';
@Entity({ name: 'customers' })
export class Customer {
    //id, name, email, phone, address, phone, company,description. createdAt, updatedAt, deletedAt
    @PrimaryGeneratedColumn('uuid', {
        comment: 'Primary key of the customer table',
    })
    id: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Name of the customer',
    })
    name: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        unique: true,
        comment: 'Email of the customer',
    })
    email: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Phone of the customer',
    })
    phone: string;

    @Column({ type: 'text', nullable: true, comment: 'Address of the customer' })
    address: string;

    @Column({
        type: 'tinytext',
        nullable: true,
        comment: 'Company of the customer',
    })
    company: string;

    @Column({
        type: 'text',
        nullable: true,
        comment: 'Description of the customer',
    })
    description: string;

    @CreateDateColumn({
        comment: 'Date and time when the customer was created',
        name: 'created_at',
    })
    @UpdateDateColumn({
        comment: 'Date and time when the customer was last updated',
        name: 'updated_at',
    })
    @DeleteDateColumn({
        comment: 'Date and time when the customer was deleted',
        name: 'deleted_at',
    })
    deletedAt: Date;

    // relation with email
    @OneToMany(() => Email, (email) => email.customer)
    emails: Email[];

    @OneToMany(() => Rental, (rental) => rental.customer)
    rentals: Rental[];
}
