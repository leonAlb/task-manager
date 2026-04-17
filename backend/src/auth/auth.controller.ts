import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    return await this.authService.login(email, password);
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    return await this.authService.register(email, password);
  }
}
