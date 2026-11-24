import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/dsa-playbook/',
  build: { target: 'es2022' },
  worker: { format: 'es' },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts', 'tests/content/**/*.test.ts'],
  },
});
