import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

const mockReflector = {
  getAllAndOverride: vi.fn(),
};

function createMockContext(user: { role: string }) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  };
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new RolesGuard(mockReflector as unknown as Reflector);
  });

  it('should allow access when no roles are required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = createMockContext({ role: 'USER' });

    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it('should allow access when user has the required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const ctx = createMockContext({ role: 'ADMIN' });

    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it('should deny access when user lacks the required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['CONTROL']);
    const ctx = createMockContext({ role: 'USER' });

    expect(guard.canActivate(ctx as any)).toBe(false);
  });
});
