import { Injectable } from '@nestjs/common';

import { CreateRentalRenewDto } from './dto/create-rental-renew.dto';
import { UpdateRentalRenewDto } from './dto/update-rental-renew.dto';

@Injectable()
export class RentalRenewService {
    create(createRentalRenewDto: CreateRentalRenewDto) {
        return createRentalRenewDto;
    }

    findAll() {
        return `This action returns all rentalRenew`;
    }

    findOne(id: number) {
        return `This action returns a #${id} rentalRenew`;
    }

    update(id: number, updateRentalRenewDto: UpdateRentalRenewDto) {
        return {
            id,
            ...updateRentalRenewDto,
        };
    }

    remove(id: number) {
        return `This action removes a #${id} rentalRenew`;
    }
}
