import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountModule } from '../account/account.module';
import { CaslModule } from '../casl/casl.module';
import { AdminAccountController } from './admin-account.controller';
import { AdminAccountService } from './admin-account.service';
import { AdminAccount } from './entities/admin-account.entity';

@Module({
    imports: [AccountModule, TypeOrmModule.forFeature([AdminAccount]), CaslModule],
    controllers: [AdminAccountController],
    providers: [AdminAccountService],
    exports: [AdminAccountService],
})
export class AdminAccountModule {}
