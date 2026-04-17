import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../task.entity';
import { AuthService } from '../../auth/service/auth.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private authService: AuthService,
  ) {}

  async createTask(request: { user: { sub: number } }, title: string) {
    const user = await this.authService.findById(request.user.sub);
    if (!user) {
      throw new Error('User not found');
    }
    const task = this.tasksRepository.create({
      title,
      isCompleted: false,
      user: { email: user.email },
    });
    return this.tasksRepository.save(task);
  }
}
