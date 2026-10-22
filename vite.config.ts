import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages ではリポジトリ名のサブパスで配信される
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/default/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
