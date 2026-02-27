import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setTokenCookie, clearTokenCookie } from './cookie.utils';

describe('cookie.utils', () => {
  let res: { cookie: ReturnType<typeof vi.fn>; clearCookie: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    res = { cookie: vi.fn(), clearCookie: vi.fn() };
    delete process.env.NODE_ENV;
  });

  describe('setTokenCookie', () => {
    it('should set an httpOnly cookie with the token', () => {
      setTokenCookie(res as any, 'my-jwt');

      expect(res.cookie).toHaveBeenCalledWith('accessToken', 'my-jwt', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    });

    it('should set secure: true in production', () => {
      process.env.NODE_ENV = 'production';

      setTokenCookie(res as any, 'my-jwt');

      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'my-jwt',
        expect.objectContaining({ secure: true }),
      );
    });
  });

  describe('clearTokenCookie', () => {
    it('should clear the accessToken cookie', () => {
      clearTokenCookie(res as any);

      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
    });

    it('should set secure: true in production', () => {
      process.env.NODE_ENV = 'production';

      clearTokenCookie(res as any);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'accessToken',
        expect.objectContaining({ secure: true }),
      );
    });
  });
});
