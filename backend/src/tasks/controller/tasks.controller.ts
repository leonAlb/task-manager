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
    return await this.tasksService.getTasks(request);
  }

  // Create a new task for the authenticated user
  @Post()
  async createTask(@Req() request: Request, @Body() body: CreateTaskDto) {
    return await this.tasksService.createTask(request, body.title);
  }

  // Update a task by ID for the authenticated user
  @Patch(':id')
  async updateTask(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTaskDto,
  ) {
    return await this.tasksService.updateTask(request, id, body);
  }

  // Delete a task by ID for the authenticated user
  @Delete(':id')
  async deleteTask(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.tasksService.deleteTask(request, id);
  }
}
