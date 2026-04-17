import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('AuthGuard', () => {
  it('should be defined', () => {
    const mockJwtService = {} as JwtService;
    expect(new AuthGuard(mockJwtService)).toBeDefined();
  });
});
