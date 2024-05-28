import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFieldInterceptor, RemoveFields, UserAuth } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { CreateWorkspaceEmailDto } from './dto/create-workspace-email.dto';
import { FindAllWorkspaceEmailDto } from './dto/find-all.dto';
import { UpdateWorkspaceEmailDto } from './dto/update-workspace-email.dto';
import { WorkspaceEmail } from './entities/workspace-email.entity';
import { WorkspaceEmailService } from './workspace-email.service';

@ApiTags('Workspace Email')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
@Controller('workspace-email')
export class WorkspaceEmailController {
    constructor(private readonly workspaceEmailService: WorkspaceEmailService) {}

    @Post()
    create(@GetCurrentUser() user: UserAuth, @Body() createWorkspaceEmailDto: CreateWorkspaceEmailDto) {
        return this.workspaceEmailService.create(user, createWorkspaceEmailDto);
    }

    @Get('by-workspace/:id')
    findAllByWorkspace(
        @GetCurrentUser() user: UserAuth,
        @Param('id') id: string,
        @Query() findAllDto: FindAllWorkspaceEmailDto,
    ) {
        return this.workspaceEmailService.findAllByWorkspace(user, id, findAllDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: UserAuth, @Query() findAllDto: FindAllWorkspaceEmailDto) {
        return this.workspaceEmailService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.workspaceEmailService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.workspaceEmailService.restore(user, id);
    }

    @RemoveFields<WorkspaceEmail>(['workspace', 'email'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch(':id')
    update(
        @GetCurrentUser() user: UserAuth,
        @Param('id') id: string,
        @Body() updateWorkspaceEmailDto: UpdateWorkspaceEmailDto,
    ) {
        return this.workspaceEmailService.update(user, id, updateWorkspaceEmailDto);
    }

    @Delete('hard-delete/:id')
    hardRemove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.workspaceEmailService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.workspaceEmailService.remove(user, id);
    }
}
