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
import type { Request } from 'express';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  // Get all users with all their tasks
  @Get('users')
  async getUsers() {
    return await this.tasksService.getUsers();
  }

  // Get all tasks for the authenticated user
  @Get()
  async getTasks(@Req() request: Request) {
    const userId = request.user.sub;
    return await this.tasksService.getTasks(userId);
  }

  // Create a new task for the authenticated user
  @Post()
  async createTask(@Req() req: Request, @Body() body: CreateTaskDto) {
    const userId = req.user.sub;
    return await this.tasksService.createTask(userId, body.title);
  }

  // Update a task by ID for the authenticated user
  @Patch(':id')
  async updateTask(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTaskDto,
  ) {
    const userId = request.user.sub;
    return await this.tasksService.updateTask(userId, id, body);
  }

  // Delete a task by ID for the authenticated user
  @Delete(':id')
  async deleteTask(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = request.user.sub;
    return await this.tasksService.deleteTask(userId, id);
  }
}
