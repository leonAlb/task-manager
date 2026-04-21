import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { AuthService } from '../../auth/service/auth.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private authService: AuthService,
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
  async createTask(userid: number, title: string) {
    const task = this.tasksRepository.create({
      title,
      status: TaskStatus.TODO,
      userId: userid,
    });
    return this.tasksRepository.save(task);
  }

  // Update a task
  async updateTask(
    userId: number,
    taskId: number,
    updateData: { status?: TaskStatus; title?: string },
  ) {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this task',
      );
    }

    Object.assign(task, updateData);

    return this.tasksRepository.save(task);
  }

  // Delete a task
  async deleteTask(userId: number, taskId: number) {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this task',
      );
    }

    return this.tasksRepository.remove(task);
  }
}
