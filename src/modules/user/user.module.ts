import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from '../email/email.module';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [TypeOrmModule.forFeature([User]), forwardRef(() => EmailModule)],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
