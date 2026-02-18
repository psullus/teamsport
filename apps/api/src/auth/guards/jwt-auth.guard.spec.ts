import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

const mockJwtService = {
  verifyAsync: vi.fn(),
};

function createMockContext(cookies: Record<string, string> = {}) {
  const request = { cookies };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    request,
  };
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new JwtAuthGuard(mockJwtService as any);
  });

  it('should throw UnauthorizedException when no cookie present', async () => {
    const ctx = createMockContext();
    await expect(guard.canActivate(ctx as any)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token is invalid', async () => {
    const ctx = createMockContext({ accessToken: 'bad-token' });
    mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(UnauthorizedException);
  });

  it('should attach user to request and return true for valid token', async () => {
    const ctx = createMockContext({ accessToken: 'valid-token' });
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', role: 'ADMIN' });

    const result = await guard.canActivate(ctx as any);

    expect(result).toBe(true);
    expect(ctx.request['user']).toEqual({ id: 'user-1', role: 'ADMIN' });
  });
});
