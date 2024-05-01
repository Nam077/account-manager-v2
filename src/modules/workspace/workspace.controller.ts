import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetCurrentUser, RemoveFieldInterceptor, RemoveFields } from '../../common';
import { AuthJwtGuard } from '../../common/guard';
import { User } from '../user/entities/user.entity';
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
    create(@GetCurrentUser() user: User, @Body() createWorkspaceDto: CreateWorkspaceDto) {
        return this.workspaceService.create(user, createWorkspaceDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllWorkspaceDto) {
        return this.workspaceService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.workspaceService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.workspaceService.restore(user, id);
    }

    @RemoveFields<Workspace>(['adminAccount', 'workspaceEmails'])
    @UseInterceptors(RemoveFieldInterceptor)
    @Patch(':id')
    update(@GetCurrentUser() user: User, @Param('id') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto) {
        return this.workspaceService.update(user, id, updateWorkspaceDto);
    }

    @Delete('hard-remove/:id')
    removeHard(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.workspaceService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.workspaceService.remove(user, id);
    }
}
