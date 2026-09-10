import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Vite 8 起用 Oxc 取代 esbuild 做 JSX 转换。项目 tsconfig 为 Next.js 设了
  // "jsx": "preserve",会阻断 Oxc 解析 .tsx,故在此显式指定 automatic runtime。
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  resolve: {
    alias: {
      '@': resolve(rootDir, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', '.claude'],
  },
});
