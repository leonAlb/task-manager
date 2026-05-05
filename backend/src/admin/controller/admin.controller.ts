import {
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from '../service/admin.service';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { Roles } from '../../auth/decorator/roles.decorator';
import { Role } from '../../auth/entities/user.entity';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('seed')
  async seedData() {
    return await this.adminService.seedData();
  }

  @Delete('delete-all')
  async deleteAllData() {
    return await this.adminService.deleteAllData();
  }

  @Delete('delete-tasks')
  async deleteAllTasks() {
    return await this.adminService.deleteAllTasks();
  }

  @Delete('delete-user/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return await this.adminService.deleteUser(id);
  }

  @Patch('users/:id/role')
  async toggleUserRole(@Param('id', ParseIntPipe) id: number) {
    return await this.adminService.toggleUserRole(id);
  }

  @Get('teams')
  async getAllTeams() {
    return await this.adminService.getAllTeams();
  }

  @Get('teams/:id')
  async getTeamDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.adminService.getTeamDetail(id);
  }
}