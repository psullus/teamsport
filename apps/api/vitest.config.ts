import { resolve } from 'path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    exclude: ['dist/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@teamsport/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
