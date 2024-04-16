import { Module } from '@nestjs/common';
import { AdminAccountService } from './admin-account.service';
import { AdminAccountController } from './admin-account.controller';

@Module({
  controllers: [AdminAccountController],
  providers: [AdminAccountService],
})
export class AdminAccountModule {}
