import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from '../email/email.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { WorkspaceEmail } from './entities/workspace-email.entity';
import { WorkspaceEmailController } from './workspace-email.controller';
import { WorkspaceEmailService } from './workspace-email.service';

@Module({
    imports: [TypeOrmModule.forFeature([WorkspaceEmail]), WorkspaceModule, EmailModule],
    controllers: [WorkspaceEmailController],
    providers: [WorkspaceEmailService],
    exports: [WorkspaceEmailService],
})
export class WorkspaceEmailModule {}
