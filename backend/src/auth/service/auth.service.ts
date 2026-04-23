import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private tokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getMe(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      tasks: user.tasks,
    };

    const isAdmin =
      user.email === this.configService.getOrThrow<string>('ADMIN_EMAIL');

    return { ...safeUser, isAdmin };
  }

  async login(email: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid Login Credentials');
    }

    const payload = { sub: user.id, email: user.email };

    return this.generateTokens(payload);
  }

  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ): Promise<Omit<User, 'password' | 'refreshTokens'>> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    } else {
      const newUser = this.usersRepository.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
      });
      await this.usersRepository.save(newUser);

      return {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        tasks: newUser.tasks,
      };
    }
  }

  async refreshToken(refreshToken: string) {
    const secret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    let payload: { sub: number; email: string };

    try {
      payload = await this.jwtService.verifyAsync<{
        sub: number;
        email: string;
      }>(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token signature',
      );
    }

    const storedToken = await this.tokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found in database');
    }

    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    storedToken.isRevoked = true;
    await this.tokenRepository.save(storedToken);

    return this.generateTokens({
      sub: payload.sub,
      email: payload.email,
    });
  }

  async logout(refreshToken: string) {
    const storedToken = await this.tokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found in database');
    }

    storedToken.isRevoked = true;
    await this.tokenRepository.save(storedToken);

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(payload: { sub: number; email: string }) {
    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    const newRefreshToken = this.tokenRepository.create({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
      user: { id: payload.sub } as User,
    });
    await this.tokenRepository.save(newRefreshToken);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async getUsers() {
    const users = await this.usersRepository.find({ relations: ['tasks'] });
    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      tasks: user.tasks,
    }));
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
