import { Module } from '@nestjs/common';
import { WorkspaceEmailService } from './workspace-email.service';
import { WorkspaceEmailController } from './workspace-email.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceModule } from '../workspace/workspace.module';
import { CaslModule } from '../casl/casl.module';
import { EmailModule } from '../email/email.module';
import { WorkspaceEmail } from './entities/workspace-email.entity';

@Module({
    imports: [TypeOrmModule.forFeature([WorkspaceEmail]), CaslModule, WorkspaceModule, EmailModule],
    controllers: [WorkspaceEmailController],
    providers: [WorkspaceEmailService],
    exports: [WorkspaceEmailService],
})
export class WorkspaceEmailModule {}
