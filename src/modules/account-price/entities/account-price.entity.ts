import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Account } from 'src/modules/account/entities/account.entity';
import { RentalType } from 'src/modules/rental-type/entities/rental-type.entity';
import { Rental } from '../../rental/entities/rental.entity';
@Entity({ name: 'account_prices' })
export class AccountPrice {
    @PrimaryGeneratedColumn('uuid', { comment: 'Primary key of the account price table' })
    id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, comment: 'Price of the account' })
    price: number;

    @Column({ type: 'uuid', nullable: false, comment: 'Account id', name: 'account_id' })
    accountId: string;

    @Column({ type: 'uuid', nullable: false, comment: 'Rental type id', name: 'rental_type_id' })
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
