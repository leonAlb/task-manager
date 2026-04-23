import { Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guard/admin.guard';
import { Param, ParseIntPipe } from '@nestjs/common';
import { AdminService } from '../service/admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}
  @Post('seed')
  @UseGuards(AdminGuard)
  async seedData() {
    return await this.adminService.seedData();
  }

  @Delete('delete-all')
  @UseGuards(AdminGuard)
  async deleteAllData() {
    return await this.adminService.deleteAllData();
  }

  @Delete('delete-tasks')
  @UseGuards(AdminGuard)
  async deleteAllTasks() {
    return await this.adminService.deleteAllTasks();
  }

  @Delete('delete-user/:id')
  @UseGuards(AdminGuard)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return await this.adminService.deleteUser(id);
  }
}
