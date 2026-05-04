import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { AuthService } from '../../auth/service/auth.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  // Get all users with their tasks
  async getUsers() {
    return await this.authService.getUsers();
  }

  // Get all tasks for the authenticated user
  async getTasks(userId: number) {
    // Just search by the exposed userId! No need to find the user first.
    return this.tasksRepository.find({
      where: { userId },
    });
  }

  // Create a new task for the authenticated user
  async createTask(userid: number, body: CreateTaskDto) {
    const task = this.tasksRepository.create({
      title: body.title,
      description: body.description,
      dueDate: body.dueDate,
      priority: body.priority,
      status: TaskStatus.TODO,
      userId: userid,
    });
    return this.tasksRepository.save(task);
  }

  // Update a task
  async updateTask(
    userId: number,
    taskId: number,
    body: UpdateTaskDto,
    email: string,
  ) {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAdmin =
      email === this.configService.getOrThrow<string>('ADMIN_EMAIL');

    if (!isAdmin && task.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this task',
      );
    }

    Object.assign(task, body);

    return this.tasksRepository.save(task);
  }

  // Delete a task
  async deleteTask(userId: number, taskId: number, email: string) {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAdmin =
      email === this.configService.getOrThrow<string>('ADMIN_EMAIL');

    if (!isAdmin && task.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this task',
      );
    }

    return this.tasksRepository.remove(task);
  }
}
