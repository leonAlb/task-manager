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
} from '@nestjs/common';
import { TasksService } from '../service/tasks.service';
import { AuthGuard } from '../../auth/guard/auth.guard';
import type { Request } from 'express';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  // Get all users with all their tasks
  @Get('users')
  getUsers(@Req() request: Request) {
    return request;
  }

  // Get all tasks for the authenticated user
  @Get()
  getTasks(@Req() request: Request) {
    return request;
  }

  // Create a new task for the authenticated user
  @Post()
  createTask(@Req() request: Request, @Body() body: { title: string }) {
    return this.tasksService.createTask(request, body.title);
  }

  // Update a task by ID for the authenticated user
  @Patch(':id')
  updateTask(@Req() request: Request, @Param('id') id: string) {
    console.log('Updating task with ID:', id);
    return request;
  }

  // Delete a task by ID for the authenticated user
  @Delete(':id')
  deleteTask(@Req() request: Request, @Param('id') id: string) {
    console.log('Deleting task with ID:', id);
    return request;
    // Compare the user ID from the JWT with the user ID associated with the task
    // If they match, allow the operation; otherwise, throw an UnauthorizedException
  }
}
