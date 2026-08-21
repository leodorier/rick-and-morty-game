import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 8095,
    host: '0.0.0.0'
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  },
  // @ts-ignore vitest config extension
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**/*.spec.ts', 'node_modules']
  }
});
