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
import type { RequestWithUser } from '../../auth/guard/auth.guard';
import { AdminGuard } from '../../admin/guard/admin.guard';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { ReorderTasksDto } from '../dto/reorder-tasks.dto';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  // Get all users with all their tasks (admin only)
  @Get('users')
  @UseGuards(AdminGuard)
  async getUsers() {
    return await this.tasksService.getUsers();
  }

  // Get all tasks for the authenticated user
  @Get()
  async getTasks(@Req() request: RequestWithUser) {
    const userId = request.user.sub;
    return await this.tasksService.getTasks(userId);
  }

  // Create a new task for the authenticated user
  @Post()
  async createTask(@Req() req: RequestWithUser, @Body() body: CreateTaskDto) {
    const userId = req.user.sub;
    return await this.tasksService.createTask(userId, body);
  }

  // Reorder tasks (batch update)
  @Patch('reorder')
  async reorderTasks(
    @Req() request: RequestWithUser,
    @Body() body: ReorderTasksDto,
  ) {
    const { sub: userId, email } = request.user;
    return await this.tasksService.reorderTasks(userId, body, email);
  }

  // Update a task by ID for the authenticated user
  @Patch(':id')
  async updateTask(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTaskDto,
  ) {
    const { sub: userId, email } = request.user;
    return await this.tasksService.updateTask(userId, id, body, email);
  }

  // Delete a task by ID for the authenticated user
  @Delete(':id')
  async deleteTask(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { sub: userId, email } = request.user;
    return await this.tasksService.deleteTask(userId, id, email);
  }
}
