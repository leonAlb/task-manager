import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { AuthService } from '../../auth/service/auth.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { ConfigService } from '@nestjs/config';
import { ReorderTasksDto } from '../dto/reorder-tasks.dto';

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
      order: { status: 'ASC', order: 'ASC', id: 'ASC' },
    });
  }

  private async getNextOrder(userId: number, status: TaskStatus) {
    const result = await this.tasksRepository
      .createQueryBuilder('task')
      .select('MAX(task.order)', 'max')
      .where('task.userId = :userId', { userId })
      .andWhere('task.status = :status', { status })
      .getRawOne<{ max: string | null }>();

    const maxOrder = result?.max ? Number(result.max) : 0;
    return maxOrder + 1;
  }

  // Create a new task for the authenticated user
  async createTask(userid: number, body: CreateTaskDto) {
    const order = await this.getNextOrder(userid, TaskStatus.TODO);
    const task = this.tasksRepository.create({
      title: body.title,
      description: body.description,
      dueDate: body.dueDate,
      priority: body.priority,
      status: TaskStatus.TODO,
      order,
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

  async reorderTasks(userId: number, body: ReorderTasksDto, email: string) {
    const ids = body.items.map((item) => item.id);
    const tasks = await this.tasksRepository.findBy({ id: In(ids) });

    if (tasks.length !== ids.length) {
      throw new NotFoundException('One or more tasks not found');
    }

    const isAdmin =
      email === this.configService.getOrThrow<string>('ADMIN_EMAIL');

    if (!isAdmin) {
      const unauthorized = tasks.find((task) => task.userId !== userId);
      if (unauthorized) {
        throw new ForbiddenException(
          'You do not have permission to update one or more tasks',
        );
      }
    }

    const updatesById = new Map(body.items.map((item) => [item.id, item]));

    tasks.forEach((task) => {
      const update = updatesById.get(task.id);
      if (!update) return;
      task.order = update.order;
      if (update.status) {
        task.status = update.status;
      }
    });

    return this.tasksRepository.save(tasks);
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
