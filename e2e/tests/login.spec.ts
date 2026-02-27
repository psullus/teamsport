import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:4000/api';
const TEST_EMAIL = `e2e-login-${Date.now()}@test.com`;
const TEST_PASSWORD = 'password123';

test.describe('Login', () => {
  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/signup`, {
      data: {
        organisationName: 'E2E Test Org',
        clubName: 'E2E Test Club',
        teamName: 'E2E Test Team',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });
    expect(response.ok()).toBeTruthy();
  });

  test('should log in via the UI', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#email').fill(TEST_EMAIL);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();

    await page.waitForURL('/');
    await expect(page.locator('.avatar')).toBeVisible();
  });
});
