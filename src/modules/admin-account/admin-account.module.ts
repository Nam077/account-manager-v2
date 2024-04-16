import { Module } from '@nestjs/common';
import { AdminAccountService } from './admin-account.service';
import { AdminAccountController } from './admin-account.controller';
import { AccountModule } from '../account/account.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAccount } from './entities/admin-account.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
    imports: [AccountModule, TypeOrmModule.forFeature([AdminAccount]), CaslModule],
    controllers: [AdminAccountController],
    providers: [AdminAccountService],
    exports: [AdminAccountService],
})
export class AdminAccountModule {}
