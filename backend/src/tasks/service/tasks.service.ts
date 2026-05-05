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
import { DelegateTaskDto } from '../dto/delegate-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { ReorderTasksDto } from '../dto/reorder-tasks.dto';
import { Role } from '../../auth/entities/user.entity';
import { TeamsService } from '../../teams/service/teams.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private authService: AuthService,
    private teamsService: TeamsService,
  ) {}

  // Get all users with their tasks
  async getUsers() {
    return await this.authService.getUsers();
  }

  // Get all tasks for the authenticated user
  async getTasks(userId: number) {
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

  async createTask(userId: number, body: CreateTaskDto) {
    const order = await this.getNextOrder(userId, TaskStatus.TODO);
    const task = this.tasksRepository.create({
      title: body.title,
      description: body.description,
      dueDate: body.dueDate,
      priority: body.priority,
      status: TaskStatus.TODO,
      order,
      userId,
    });
    return this.tasksRepository.save(task);
  }

  private async assertTaskAccess(userId: number, task: Task) {
    const user = await this.authService.findById(userId);
    if (user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER) return;
    if (task.userId !== userId) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  async delegateTask(managerId: number, body: DelegateTaskDto) {
    const canAssign = await this.teamsService.isManagerOfUser(
      managerId,
      body.userId,
    );

    if (!canAssign) {
      throw new ForbiddenException(
        'You do not have permission to assign tasks to this user',
      );
    }

    const { userId, ...taskBody } = body;
    return this.createTask(userId, taskBody);
  }

  // Update a task
  async updateTask(userId: number, taskId: number, body: UpdateTaskDto) {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    await this.assertTaskAccess(userId, task);
    Object.assign(task, body);
    return this.tasksRepository.save(task);
  }

  async reorderTasks(userId: number, body: ReorderTasksDto) {
    const ids = body.items.map((item) => item.id);
    const tasks = await this.tasksRepository.findBy({ id: In(ids) });

    if (tasks.length !== ids.length) {
      throw new NotFoundException('One or more tasks not found');
    }

    const user = await this.authService.findById(userId);

    // Check if user is a "Power User"
    const isPowerUser =
      user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER;

    if (!isPowerUser) {
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
  async deleteTask(userId: number, taskId: number) {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    await this.assertTaskAccess(userId, task);
    return this.tasksRepository.remove(task);
  }
}
