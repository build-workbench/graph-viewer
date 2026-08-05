# GitHub Pages 部署

将 GraphViewer 部署到 GitHub Pages 作为静态站点。

## 概述

GitHub Pages 部署使用静态导出模式，其中：

- 应用预构建为静态 HTML/CSS/JS
- 无服务端 API 路由可用
- 远程 Kroki 渲染需要支持 CORS 的 Kroki 实例

## 设置

### 1. 启用 GitHub Pages

1. 进入仓库设置 → Pages
2. 源：GitHub Actions
3. 工作流：Next.js

### 2. 配置工作流

仓库包含 `.github/workflows/pages.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
    paths:
      - 'app/**'
      - 'components/**'
      - 'hooks/**'
      - 'lib/**'
      - 'public/**'
      - 'package.json'
      - 'package-lock.json'
      - 'next.config.*'
      - '.github/workflows/pages.yml'
  workflow_dispatch:
    inputs:
      skip_checks:
        description: 'Skip validation checks'
        required: false
        default: 'false'
        type: boolean

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages-${{ github.ref }}'
  cancel-in-progress: true

env:
  NODE_VERSION: '22'

jobs:
  validate:
    if: inputs.skip_checks != true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test

  build:
    needs: [validate]
    if: always() && (needs.validate.result == 'success' || needs.validate.result == 'skipped')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
        with:
          static_site_generator: next
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-modules-${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - run: npm run build:static
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### 3. 构建设置

静态导出在 `next.config.js` 中配置：

```javascript
const nextConfig = {
  output: 'export',
  distDir: 'out',
  // ... 其他配置
};
```

## 构建流程

```bash
# 本地静态构建
npm run build:static

# 输出到 out/ 目录
# 上传 out/ 到 GitHub Pages
```

构建脚本 (`scripts/build-static-export.mjs`) 处理：

1. 为静态构建设置环境变量
2. 运行 Next.js 导出
3. 复制必要资源

## 限制

### API 路由

以下功能在静态模式下**不可用**：

- `/api/render` - Kroki 代理（需要服务器）
- 服务端缓存
- 运行时环境变量注入

### 远程渲染

对于远程引擎（PlantUML、D2 等），您需要：

1. **支持 CORS 的 Kroki**：Kroki 实例必须允许跨域请求
2. **公共 Kroki**：`https://kroki.io` 可以使用（如果能够访问）
3. **自建 Kroki**：部署适当的 CORS 头

### 本地渲染

静态模式下本地渲染仍然工作：

- ✅ Mermaid（浏览器）
- ✅ Graphviz WASM（浏览器）
- ❌ 无 CORS 的远程引擎

## 静态模式配置

### 客户端 Kroki

用户可以在设置面板中配置自定义 Kroki URL：

1. 打开设置（齿轮图标）
2. 启用"自定义渲染服务器"
3. 输入 Kroki URL: `https://your-kroki-instance.com`

### 环境变量

静态构建在构建时嵌入环境变量：

```env
# .env.production
NEXT_PUBLIC_DEFAULT_KROKI_URL=https://kroki.io
```

## 验证

### 本地预览

```bash
npm run build:static
npx serve out
```

打开 `http://localhost:3000` 并验证：

- [ ] Mermaid 图表渲染
- [ ] Graphviz 图表渲染（WASM）
- [ ] 设置面板打开
- [ ] 导出功能工作

### 部署后

GitHub Actions 部署后：

1. 访问您的 Pages URL
2. 测试本地渲染（Mermaid）
3. 如果使用远程 Kroki，测试 PlantUML/D2
4. 验证所有导出格式

## 自定义域名

### 设置

1. 在仓库根目录添加 `CNAME` 文件：

   ```
   diagrams.example.com
   ```

2. 配置 DNS：
   - CNAME 记录指向 `<username>.github.io`
   - 或根域名的 A 记录

3. 更新仓库设置 → Pages → Custom domain

### HTTPS

GitHub Pages 自动为自定义域名配置 SSL 证书。

## 故障排除

### 构建失败

检查 GitHub Actions 日志：

- Node.js 版本兼容性
- npm install 错误
- TypeScript 编译错误

### 运行时错误

打开浏览器 DevTools：

- Console 错误
- 到 Kroki 的网络请求
- 资源 404 错误

### CORS 错误

如果远程渲染失败：

```
Access to fetch at 'https://kroki.io/' from origin '...' has been blocked by CORS policy
```

解决方案：

1. 使用带 CORS 头的自建 Kroki
2. 使用 CORS 代理
3. 坚持使用本地渲染引擎

## 最佳实践

1. **本地测试**后推送：`npm run build:static`
2. **为用户记录限制**
3. **在设置中提供 Kroki 选项**
4. **监控 GitHub Actions** 构建状态
