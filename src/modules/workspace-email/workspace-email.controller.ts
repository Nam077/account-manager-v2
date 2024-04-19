import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { WorkspaceEmailService } from './workspace-email.service';
import { CreateWorkspaceEmailDto } from './dto/create-workspace-email.dto';
import { UpdateWorkspaceEmailDto } from './dto/update-workspace-email.dto';
import { GetCurrentUser } from 'src/decorator/auth.decorator';
import { User } from '../user/entities/user.entity';
import { FindAllDto } from 'src/dto/find-all.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthJwtGuard } from '../auth/guard/auth-jwt.guard';
@ApiTags('Workspace Email')
@ApiBearerAuth()
@UseGuards(AuthJwtGuard)
@Controller('workspace-email')
export class WorkspaceEmailController {
    constructor(private readonly workspaceEmailService: WorkspaceEmailService) {}

    @Post()
    create(@GetCurrentUser() user: User, @Body() createWorkspaceEmailDto: CreateWorkspaceEmailDto) {
        return this.workspaceEmailService.create(user, createWorkspaceEmailDto);
    }

    @Get()
    findAll(@GetCurrentUser() user: User, @Query() findAllDto: FindAllDto) {
        return this.workspaceEmailService.findAll(user, findAllDto);
    }

    @Get(':id')
    findOne(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.workspaceEmailService.findOne(user, id);
    }

    @Patch('restore/:id')
    restore(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.workspaceEmailService.restore(user, id);
    }

    @Patch(':id')
    update(
        @GetCurrentUser() user: User,
        @Param('id') id: string,
        @Body() updateWorkspaceEmailDto: UpdateWorkspaceEmailDto,
    ) {
        return this.workspaceEmailService.update(user, id, updateWorkspaceEmailDto);
    }

    @Delete('hard-delete/:id')
    hardRemove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.workspaceEmailService.remove(user, id, true);
    }

    @Delete(':id')
    remove(@GetCurrentUser() user: User, @Param('id') id: string) {
        return this.workspaceEmailService.remove(user, id);
    }
}