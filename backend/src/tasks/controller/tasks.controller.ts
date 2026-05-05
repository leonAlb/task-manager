import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from '../service/tasks.service';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { Roles } from '../../auth/decorator/roles.decorator';
import { Role } from '../../auth/entities/user.entity';
import type { RequestWithUser } from '../../auth/guard/auth.guard';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { ReorderTasksDto } from '../dto/reorder-tasks.dto';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getUsers() {
    return await this.tasksService.getUsers();
  }

  @Get()
  async getTasks(@Req() request: RequestWithUser) {
    return await this.tasksService.getTasks(request.user.sub);
  }

  @Post()
  async createTask(
    @Req() request: RequestWithUser,
    @Body() body: CreateTaskDto,
  ) {
    return await this.tasksService.createTask(request.user.sub, body);
  }

  @Patch('reorder')
  async reorderTasks(
    @Req() request: RequestWithUser,
    @Body() body: ReorderTasksDto,
  ) {
    return await this.tasksService.reorderTasks(request.user.sub, body);
  }

  @Patch(':id')
  async updateTask(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTaskDto,
  ) {
    return await this.tasksService.updateTask(request.user.sub, id, body);
  }

  @Delete(':id')
  async deleteTask(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.tasksService.deleteTask(request.user.sub, id);
  }
}
