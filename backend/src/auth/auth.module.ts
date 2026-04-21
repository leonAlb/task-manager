import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard } from './guard/auth.guard';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { SeederService } from './seeder/seeder.service';
import { AdminGuard } from './guard/admin.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        return {
          secret: secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, SeederService, AdminGuard],
  exports: [AuthService],
})
export class AuthModule {}
