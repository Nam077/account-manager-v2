import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { AccountPrice } from '../../account-price/entities/account-price.entity';
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
        type: 'text',
        nullable: true,
        comment: 'Description of the rental type',
    })
    description: string;

    @Column({
        type: 'tinyint',
        nullable: false,
        default: 1,
        comment: 'Maximum slots allowed in the rental type',
        name: 'max_slots',
    })
    maxSlots: number;

    @Column({
        type: 'boolean',
        nullable: false,
        default: false,
        comment: 'Indicates if the rental type is a workspace',
        name: 'is_workspace',
    })
    isWorkspace: boolean;

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
}
