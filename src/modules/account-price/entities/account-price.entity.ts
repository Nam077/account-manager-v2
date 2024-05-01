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

import { Account } from '../../account/entities/account.entity';
import { Rental } from '../../rental/entities/rental.entity';
import { RentalType } from '../../rental-type/entities/rental-type.entity';
@Entity({ name: 'account_prices' })
export class AccountPrice {
    @PrimaryGeneratedColumn('uuid', {
        comment: 'Primary key of the account price table',
    })
    id: string;

    @Column({
        type: 'decimal',
        precision: 15,
        scale: 2,
        nullable: false,
        comment: 'Price of the account',
    })
    price: number;

    @Column({
        type: 'int',
        nullable: false,
        comment: 'Duration of the account validity in days',
        name: 'validity_duration',
        default: 30,
    })
    validityDuration: number;

    @Column({
        type: 'boolean',
        nullable: false,
        comment: 'Is lifetime account',
        name: 'is_lifetime',
        default: false,
    })
    isLifetime: boolean;

    @Column({
        type: 'uuid',
        nullable: false,
        comment: 'Account id',
        name: 'account_id',
    })
    accountId: string;

    @Column({
        type: 'uuid',
        nullable: false,
        comment: 'Rental type id',
        name: 'rental_type_id',
    })
    rentalTypeId: string;

    @CreateDateColumn({
        comment: 'Date and time when the account price was created',
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the account price was last updated',
        name: 'updated_at',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the account price was deleted',
        name: 'deleted_at',
    })
    deletedAt: Date;

    //relations
    @ManyToOne(() => Account, (account) => account.accountPrices)
    @JoinColumn({ name: 'account_id' })
    account: Account;

    @ManyToOne(() => RentalType, (rentalType) => rentalType.accountPrices)
    @JoinColumn({ name: 'rental_type_id' })
    rentalType: RentalType;

    @OneToMany(() => Rental, (rental) => rental.accountPrice)
    rentals: Rental[];
}
