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

    const user1Tasks = await this.tasksRepository.count({
      where: { userId: user1.id },
    });
    const user2Tasks = await this.tasksRepository.count({
      where: { userId: user2.id },
    });
    const user3Tasks = await this.tasksRepository.count({
      where: { userId: user3.id },
    });

    if (user1Tasks === 0) {
      await this.tasksRepository.save(
        this.tasksRepository.create([
          {
            title: 'Example Task 1',
            status: TaskStatus.TODO,
            userId: user1.id,
          },
          {
            title: 'Example Task 2',
            status: TaskStatus.IN_PROGRESS,
            userId: user1.id,
          },
          {
            title: 'Example Task 3',
            status: TaskStatus.COMPLETED,
            userId: user1.id,
          },
        ]),
      );
    }

    if (user2Tasks === 0) {
      await this.tasksRepository.save(
        this.tasksRepository.create([
          { title: 'Learn Angular', status: TaskStatus.TODO, userId: user2.id },
          { title: 'Master NestJS', status: TaskStatus.TODO, userId: user2.id },
          {
            title: 'Build fullstack app',
            status: TaskStatus.TODO,
            userId: user2.id,
          },
        ]),
      );
    }

    if (user3Tasks === 0) {
      await this.tasksRepository.save(
        this.tasksRepository.create([
          { title: 'Write tests', status: TaskStatus.TODO, userId: user3.id },
          {
            title: 'Refactor code',
            status: TaskStatus.IN_PROGRESS,
            userId: user3.id,
          },
          {
            title: 'Update README',
            status: TaskStatus.IN_PROGRESS,
            userId: user3.id,
          },
        ]),
      );
    }

    return { message: 'Seeded successfully' };
  }

  async deleteAllData() {
    await this.usersRepository.query(
      'CREATE TABLE IF NOT EXISTS "temp_user" AS SELECT * FROM "user" WHERE email = $1',
      [this.configService.get('ADMIN_EMAIL')],
    );
    await this.usersRepository.query(
      'TRUNCATE TABLE "user" RESTART IDENTITY CASCADE',
    );
    await this.usersRepository.query(
      'INSERT INTO "user" SELECT * FROM "temp_user"',
    );
    await this.usersRepository.query('DROP TABLE "temp_user"');
    await this.usersRepository.query(
      `SELECT setval(pg_get_serial_sequence('"user"', 'id'), (SELECT MAX(id) FROM "user"))`,
    );
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
