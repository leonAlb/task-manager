import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async getUsers() {
    const users = await this.usersRepository.find({ relations: ['tasks'] });
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      tasks: user.tasks,
    }));
  }

  async login(email: string, password: string) {
    // Find the user by email
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid Login Credentials');
    }
    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid Login Credentials');
    }
    // Generate a JWT token
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    // Hash the password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if the email is already in use
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    // If the email is already in use, throw a conflict exception
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    // If the email is not in use, create a new user
    else {
      const newUser = this.usersRepository.create({
        email,
        password: hashedPassword,
      });
      await this.usersRepository.save(newUser);

      return {
        id: newUser.id,
        email: newUser.email,
        tasks: newUser.tasks,
      };
    }
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
