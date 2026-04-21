import { AdminGuard } from './admin.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AdminGuard', () => {
  it('should be defined', () => {
    const mockJwtService = {} as JwtService;
    const mockConfigService = {} as ConfigService;
    expect(new AdminGuard(mockJwtService, mockConfigService)).toBeDefined();
  });
});
