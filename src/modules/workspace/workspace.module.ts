import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { CaslModule } from '../casl/casl.module';
import { AdminAccountModule } from '../admin-account/admin-account.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';

@Module({
    imports: [CaslModule, AdminAccountModule, TypeOrmModule.forFeature([Workspace])],
    controllers: [WorkspaceController],
    providers: [WorkspaceService],
    exports: [WorkspaceService],
})
export class WorkspaceModule {}
