import { Controller, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guard/admin.guard';

@Controller('admin')
export class AdminController {
  @Post('seed')
  @UseGuards(AdminGuard)
  seedData() {
    // this.adminService.seedData();
  }
}
