import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Param,
  Body,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { TeamsService } from '../service/teams.service';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { Roles } from '../../auth/decorator/roles.decorator';
import { Role } from '../../auth/entities/user.entity';
import type { RequestWithUser } from '../../auth/guard/auth.guard';
import { CreateTeamDto } from '../dto/create-team.dto';
import { AddMemberDto } from '../dto/add-member.dto';

@Controller('teams')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.PROJECT_MANAGER)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Delete(':id')
  async deleteTeam(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) teamId: number,
  ) {
    return this.teamsService.deleteTeam(teamId, request.user.sub);
  }

  @Get()
  async getManagedTeams(@Req() request: RequestWithUser) {
    return this.teamsService.getManagedTeams(request.user.sub);
  }

  @Post()
  async createTeam(
    @Req() request: RequestWithUser,
    @Body() body: CreateTeamDto,
  ) {
    return await this.teamsService.createTeam(request.user.sub, body.name);
  }

  @Post(':id/members')
  async addMember(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) teamId: number,
    @Body() body: AddMemberDto,
  ) {
    return this.teamsService.addMember(teamId, request.user.sub, body.userId);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) teamId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return await this.teamsService.removeMember(
      teamId,
      request.user.sub,
      userId,
    );
  }

  @Get(':id/available-users')
  async getAvailableMembers(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) teamId: number,
  ) {
    return this.teamsService.getAvailableMembers(teamId, request.user.sub);
  }

  @Get(':id/tasks')
  async getTeamTasks(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) teamId: number,
  ) {
    return this.teamsService.getTeamTasks(teamId, request.user.sub);
  }
}
