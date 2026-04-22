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

  @Delete('clear-all')
  @UseGuards(AdminGuard)
  async clearAllData() {
    return await this.adminService.clearAllData();
  }

  @Delete('clear-tasks')
  @UseGuards(AdminGuard)
  async clearTasks() {
    return await this.adminService.clearTasks();
  }

  @Delete('clear-user/:id')
  @UseGuards(AdminGuard)
  async clearUsers(@Param('id', ParseIntPipe) id: number) {
    return await this.adminService.clearUser(id);
  }
}
