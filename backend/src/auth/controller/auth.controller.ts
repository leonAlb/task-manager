import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { AuthCredentialsDto } from '../dto/auth-credentials.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() authCredentialsDto: AuthCredentialsDto) {
    const { email, password } = authCredentialsDto;
    return await this.authService.login(email, password);
  }

  @Post('register')
  async register(@Body() authCredentialsDto: AuthCredentialsDto) {
    const { email, password } = authCredentialsDto;
    return await this.authService.register(email, password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const { refresh_token } = refreshTokenDto;
    return await this.authService.refreshToken(refresh_token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    const { refresh_token } = refreshTokenDto;
    await this.authService.logout(refresh_token);
    return { message: 'Successfully logged out' };
  }
}
