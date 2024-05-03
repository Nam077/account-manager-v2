import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminAccountModule } from '../admin-account/admin-account.module';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
    imports: [AdminAccountModule, TypeOrmModule.forFeature([Workspace])],
    controllers: [WorkspaceController],
    providers: [WorkspaceService],
    exports: [WorkspaceService],
})
export class WorkspaceModule {}
