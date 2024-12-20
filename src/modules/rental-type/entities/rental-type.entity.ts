import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { RentalTypeEnums } from '../../../common/enum/rental-type.enum';
import { AccountPrice } from '../../account-price/entities/account-price.entity';
import { Rental } from '../../rental/entities/rental.entity';

@Entity({ name: 'rental_types' })
export class RentalType {
    @PrimaryGeneratedColumn('uuid', {
        comment: 'Primary key of the rental type table',
    })
    id: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Name of the rental type',
    })
    name: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: 'Slug of the rental type',
    })
    slug: string;

    @Column({
        type: 'enum',
        enum: RentalTypeEnums,
        nullable: false,
        comment: 'Type of the rental',
        default: RentalTypeEnums.PERSONAL,
    })
    type: RentalTypeEnums;

    @Column({
        type: 'text',
        nullable: true,
        comment: 'Description of the rental type',
    })
    description: string;

    @CreateDateColumn({
        comment: 'Date and time when the rental type was created',
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        comment: 'Date and time when the rental type was last updated',
        name: 'updated_at',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        comment: 'Date and time when the rental type was deleted',
        name: 'deleted_at',
    })
    deletedAt: Date;

    @OneToMany(() => AccountPrice, (accountPrice) => accountPrice.rentalType)
    accountPrices: AccountPrice[];

    @OneToMany(() => Rental, (rental) => rental.rentalType)
    rentals: Rental[];
}
