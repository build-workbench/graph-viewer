# 配置参考

GraphViewer 配置选项的完整参考。

## 环境变量

### 服务端配置

| 变量                              | 默认值             | 说明                     |
| --------------------------------- | ------------------ | ------------------------ |
| `PORT`                            | `3000`             | 服务器监听端口           |
| `NODE_ENV`                        | `development`      | 环境模式                 |
| `KROKI_BASE_URL`                  | `https://kroki.io` | 默认 Kroki 渲染服务      |
| `KROKI_TIMEOUT_MS`                | `10000`            | Kroki 请求超时（毫秒）   |
| `KROKI_ALLOW_CLIENT_BASE_URL`     | `false`            | 允许客户端指定 Kroki URL |
| `KROKI_CLIENT_BASE_URL_ALLOWLIST` | -                  | 逗号分隔的允许 URL       |

### 客户端配置

| 变量                                 | 默认值  | 说明                   |
| ------------------------------------ | ------- | ---------------------- |
| `NEXT_PUBLIC_GRAPHVIZ_WASM_BASE_URL` | CDN URL | Graphviz WASM 资源 URL |
| `NEXT_PUBLIC_DEFAULT_KROKI_URL`      | -       | 客户端配置的默认 Kroki |

### AI 助手配置

| 变量          | 默认值  | 说明               |
| ------------- | ------- | ------------------ |
| `AI_API_KEY`  | -       | AI 服务 API 密钥   |
| `AI_BASE_URL` | -       | 自定义 AI 服务端点 |
| `AI_MODEL`    | `gpt-4` | AI 模型选择        |

## 完整 .env.example

```env
# ================================================
# GraphViewer 环境配置
# ================================================

# 服务器配置
# --------------------
PORT=3000
NODE_ENV=production

# Kroki 配置
# -------------------
# 服务端渲染的默认 Kroki 服务
KROKI_BASE_URL=https://kroki.io

# 请求超时（毫秒）
KROKI_TIMEOUT_MS=10000

# 客户端 Kroki 配置
# --------------------------
# 取消注释以允许客户端指定自己的 Kroki URL
# KROKI_ALLOW_CLIENT_BASE_URL=true

# 或限制为特定 URL（逗号分隔）
# KROKI_CLIENT_BASE_URL_ALLOWLIST=https://kroki.example.com,https://kroki.internal:8000

# Graphviz WASM
# -------------
# Graphviz WASM 文件的 CDN
NEXT_PUBLIC_GRAPHVIZ_WASM_BASE_URL=https://unpkg.com/@hpcc-js/wasm/dist

# AI 助手（可选）
# -----------------------
# AI_API_KEY=sk-...
# AI_BASE_URL=https://api.openai.com/v1
# AI_MODEL=gpt-4
```

## Next.js 配置

### 静态导出

用于 GitHub Pages 部署：

```javascript
// next.config.js
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true, // 静态导出必需
  },
};
```

### 独立输出

用于 Docker 部署：

```javascript
// next.config.js
const nextConfig = {
  output: 'standalone',
};
```

### 自定义 Webpack

```javascript
// next.config.js
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
      };
    }
    return config;
  },
};
```

## Docker 配置

### docker-compose.yml

```yaml
services:
  web:
    build: .
    ports:
      - '3000:3000'
    environment:
      - KROKI_BASE_URL=${KROKI_BASE_URL:-https://kroki.io}
      - PORT=3000
    depends_on:
      - kroki
    profiles:
      - prod

  kroki:
    image: yuzutech/kroki:latest
    ports:
      - '8000:8000'
    profiles:
      - kroki
```

### Dockerfile

```dockerfile
FROM node:22-alpine AS base

# 依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 构建器
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 运行器
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

## TypeScript 配置

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## ESLint 配置

### .eslintrc.json

```json
{
  "extends": ["next/core-web-vitals", "next/typescript", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

## Prettier 配置

### .prettierrc.json

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## Tailwind 配置

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

## Vitest 配置

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

## 运行时常量

### 代码限制

| 限制              | 值      | 说明               |
| ----------------- | ------- | ------------------ |
| `MAX_CODE_LENGTH` | 100,000 | 每个图表最大字符数 |
| `MAX_DIAGRAMS`    | 100     | 工作区最大图表数   |

### 缓存配置

| 设置               | 值        | 说明                   |
| ------------------ | --------- | ---------------------- |
| `CACHE_MAX_AGE_MS` | 3,600,000 | 缓存条目 TTL（1 小时） |
| `CACHE_SIZE_LIMIT` | 1,000     | 最大缓存条目数         |

### 防抖计时

| 设置                  | 值  | 说明         |
| --------------------- | --- | ------------ |
| `PREVIEW_DEBOUNCE_MS` | 300 | 预览输入防抖 |

### 导出设置

| 设置           | 值   | 说明                       |
| -------------- | ---- | -------------------------- |
| `PNG_QUALITY`  | 0.95 | PNG 导出质量（0-1）        |
| `PNG_SCALE_2X` | 2    | PNG 2x 缩放因子            |
| `PNG_SCALE_4X` | 4    | PNG 4x 缩放因子            |
| `SVG_PADDING`  | 20   | SVG viewBox 内边距（像素） |
