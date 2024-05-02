import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { AccountPrice } from '../../account-price/entities/account-price.entity';
import { Rental } from '../../rental/entities/rental.entity';

@Entity({ name: 'rental_renews' })
export class RentalRenew {
    @PrimaryGeneratedColumn('uuid', {
        comment: 'Primary key of the rental renew table',
    })
    id: string;

    @Column({
        type: 'uuid',
        nullable: false,
        comment: 'Rental id',
        name: 'rental_id',
    })
    rentalId: string;

    @Column({
        type: 'date',
        nullable: false,
        comment: 'New end date of the rental',
        name: 'new_end_date',
    })
    newEndDate: Date;

    @Column({
        type: 'date',
        nullable: false,
        comment: 'Last start date of the rental',
        name: 'last_start_date',
    })
    lastStartDate: Date;

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

    @Column({ type: 'text', nullable: true, comment: 'Note regarding the renewal' })
    note: string;

    @CreateDateColumn({
        comment: 'Date and time when the renewal was created',
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the renewal was last updated',
        name: 'updated_at',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the renewal was deleted',
        name: 'deleted_at',
    })
    deletedAt: Date;

    @Column({
        type: 'uuid',
        nullable: false,
        comment: 'Account price id',
        name: 'account_price_id',
    })
    accountPriceId: string;

    @ManyToOne(() => Rental, (rental) => rental.rentalRenews)
    @JoinColumn({ name: 'rental_id' })
    rental: Rental;

    @ManyToOne(() => AccountPrice, (accountPrice) => accountPrice.rentalRenews)
    @JoinColumn({ name: 'account_price_id' })
    accountPrice: AccountPrice;
}
