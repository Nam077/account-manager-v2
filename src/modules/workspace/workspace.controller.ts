import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFieldInterceptor, RemoveFields, UserAuth } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { FindAllWorkspaceDto } from './dto/find-all.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceService } from './workspace.service';

@ApiTags('Workspace')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
@Controller('workspace')
export class WorkspaceController {
    constructor(private readonly workspaceService: WorkspaceService) {}

    @Post()
    create(@GetCurrentUser() user: UserAuth, @Body() createWorkspaceDto: CreateWorkspaceDto) {
        return this.workspaceService.create(user, createWorkspaceDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: UserAuth, @Query() findAllDto: FindAllWorkspaceDto) {
        return this.workspaceService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.workspaceService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.workspaceService.restore(user, id);
    }

    @RemoveFields<Workspace>(['adminAccount', 'workspaceEmails'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch(':id')
    update(@GetCurrentUser() user: UserAuth, @Param('id') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto) {
        return this.workspaceService.update(user, id, updateWorkspaceDto);
    }

    @Delete('hard-delete/:id')
    removeHard(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.workspaceService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: UserAuth, @Param('id') id: string) {
        return this.workspaceService.remove(user, id);
    }
}
