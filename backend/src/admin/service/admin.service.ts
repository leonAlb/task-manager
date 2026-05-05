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
import { User, Role } from '../../auth/entities/user.entity';
import {
  Task,
  TaskPriority,
  TaskStatus,
} from '../../tasks/entities/task.entity';
import { Team } from '../../teams/entities/team.entity';
import { TeamsService } from '../../teams/service/teams.service';

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    private teamsService: TeamsService,
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
    if (existingAdmin && existingAdmin.role === Role.ADMIN) {
      return;
    } else if (existingAdmin) {
      console.warn(
        `User with email ${adminEmail} already exists but is not an admin.`,
      );
      existingAdmin.role = Role.ADMIN;
      await this.usersRepository.save(existingAdmin);
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
      role: Role.ADMIN,
    });

    await this.usersRepository.save(admin);
  }

  async seedData() {
    const days = (n: number) => new Date(Date.now() + n * 86400000);
    const defaultPassword = await bcrypt.hash('qwertz', 10);

    const users: User[] = [];

    // 1. Generate 10 example users dynamically
    for (let i = 1; i <= 10; i++) {
      const user = await this.findOrCreateUser(
        `TestUser${i}`,
        `Example`,
        `user${i}@example.com`,
        defaultPassword,
      );
      users.push(user);
    }

    // 2. Loop through the generated users to seed their tasks
    for (const [index, user] of users.entries()) {
      const userTasksCount = await this.tasksRepository.count({
        where: { userId: user.id },
      });

      if (userTasksCount === 0) {
        // Create some generic tasks for each user, adding a bit of randomness to the due dates
        await this.tasksRepository.save(
          this.tasksRepository.create([
            {
              title: `Learn Module ${index + 1}`,
              description: `Study requirements for user ${user.firstName}`,
              dueDate: days(Math.floor(Math.random() * 14) + 1), // Random due date 1-14 days in the future
              priority: TaskPriority.HIGH,
              status: TaskStatus.TODO,
              userId: user.id,
            },
            {
              title: `Complete Setup ${index + 1}`,
              description: `Finish initial configuration for ${user.email}`,
              dueDate: days(3),
              priority: TaskPriority.MEDIUM,
              status: TaskStatus.IN_PROGRESS,
              userId: user.id,
            },
            {
              title: `Review Docs ${index + 1}`,
              description: 'Read the project documentation',
              dueDate: days(-2), // Past due
              priority: TaskPriority.LOW,
              status: TaskStatus.COMPLETED,
              userId: user.id,
            },
          ]),
        );
      }
    }

    return { message: '10 users seeded successfully' };
  }

  async deleteAllData() {
    await this.usersRepository.query(
      'CREATE TABLE IF NOT EXISTS "temp_user" AS SELECT * FROM "user" WHERE role = $1',
      [Role.ADMIN],
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

  async toggleUserRole(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException("Can't change the admin role");
    }

    if (user.role === Role.USER) {
      user.role = Role.PROJECT_MANAGER;
    } else {
      await this.teamsRepository.delete({ managerId: id });
      user.role = Role.USER;
    }

    return this.usersRepository.save(user);
  }

  async deleteUser(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException("Can't delete the admin user");
    }

    return await this.usersRepository.delete(id);
  }

  async getAllTeams() {
    return this.teamsService.getAllTeams();
  }

  async getTeamDetail(id: number) {
    return this.teamsService.getTeamDetail(id);
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
