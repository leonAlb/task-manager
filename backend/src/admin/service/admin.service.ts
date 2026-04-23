import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../auth/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';
import { TaskStatus } from '../../tasks/entities/task.entity';

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      console.warn('Admin credentials not set. Skipping seeding.');
      return;
    }
    // Check if admin user already exists
    const existingAdmin = await this.usersRepository.findOne({
      where: { email: adminEmail },
    });
    if (existingAdmin) {
      console.log('Admin user already exists. Skipping seeding.');
      return;
    }

    // Hash the admin password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user from environment variables
    const admin = this.usersRepository.create({
      firstName: 'Admin',
      lastName: 'User',
      email: adminEmail,
      password: hashedPassword,
    });

    await this.usersRepository.save(admin);
  }

  async seedData() {
    const defaultPassword = await bcrypt.hash('qwertz', 10);

    const user1 = await this.findOrCreateUser(
      'John',
      'Doe',
      'john.doe@example.com',
      defaultPassword,
    );
    const user2 = await this.findOrCreateUser(
      'Jane',
      'Smith',
      'jane.smith@example.com',
      defaultPassword,
    );
    const user3 = await this.findOrCreateUser(
      'Alice',
      'Jones',
      'alice.jones@example.com',
      defaultPassword,
    );

    const existingTasksCount = await this.tasksRepository.count({
      where: [
        { user: { id: user1.id } },
        { user: { id: user2.id } },
        { user: { id: user3.id } },
      ],
    });

    if (existingTasksCount === 0) {
      const tasks = this.tasksRepository.create([
        // User 1 tasks (1 TODO, 1 IN_PROGRESS, 1 COMPLETED)
        { title: 'Example Task 1', status: TaskStatus.TODO, user: user1 },
        {
          title: 'Example Task 2',
          status: TaskStatus.IN_PROGRESS,
          user: user1,
        },
        { title: 'Example Task 3', status: TaskStatus.COMPLETED, user: user1 },

        // User 2 tasks (3 TODO)
        { title: 'Learn Angular', status: TaskStatus.TODO, user: user2 },
        { title: 'Master NestJS', status: TaskStatus.TODO, user: user2 },
        { title: 'Build fullstack app', status: TaskStatus.TODO, user: user2 },

        // User 3 tasks (1 TODO, 2 IN_PROGRESS)
        { title: 'Write tests', status: TaskStatus.TODO, user: user3 },
        { title: 'Refactor code', status: TaskStatus.IN_PROGRESS, user: user3 },
        { title: 'Update README', status: TaskStatus.IN_PROGRESS, user: user3 },
      ]);
      await this.tasksRepository.save(tasks);
    }
    return { message: 'Seeded successfully' };
  }

  async deleteAllData() {
    await this.usersRepository.query(
      'CREATE TABLE IF NOT EXISTS "temp_user" AS SELECT * FROM "user" WHERE id = 1',
    );
    await this.usersRepository.query(
      'TRUNCATE TABLE "user" RESTART IDENTITY CASCADE',
    );
    await this.usersRepository.query(
      'INSERT INTO "user" SELECT * FROM "temp_user"',
    );
    await this.usersRepository.query('DROP TABLE "temp_user"');

    return { message: 'All data deleted except admin user' };
  }

  async deleteAllTasks() {
    await this.tasksRepository.query(
      'TRUNCATE TABLE "task" RESTART IDENTITY CASCADE',
    );

    return { message: 'All tasks deleted' };
  }

  async deleteUser(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email === this.configService.get('ADMIN_EMAIL')) {
      throw new ForbiddenException("Can't delete the admin user");
    }

    return await this.usersRepository.delete(id);
  }

  private async findOrCreateUser(
    firstName: string,
    lastName: string,
    email: string,
    passwordHash: string,
  ): Promise<User> {
    let user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      user = this.usersRepository.create({
        firstName,
        lastName,
        email,
        password: passwordHash,
      });
      await this.usersRepository.save(user);
    }
    return user;
  }
}
