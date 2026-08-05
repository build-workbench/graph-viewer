# 开发环境设置

配置 GraphViewer 开发环境。

## 先决条件

- Node.js 20+ 和 npm 10+
- Git
- 支持 TypeScript 的 IDE（推荐 VS Code）

## IDE 配置

### VS Code 推荐设置

创建 `.vscode/settings.json`：

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

### 必需扩展

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer

## 开发工作流

### 1. Fork 和克隆

```bash
git clone https://github.com/YOUR_USERNAME/graph-viewer.git
cd graph-viewer
```

### 2. 安装依赖

```bash
npm install
```

### 3. 开始开发

```bash
# 启动开发服务器
npm run dev

# 在另一个终端，以监听模式运行测试
npm run test:watch
```

### 4. 进行修改

- 在 `app/`、`components/`、`hooks/` 或 `lib/` 中编辑代码
- 测试随 `npm run test:watch` 自动运行
- Prettier 保存时自动格式化
- ESLint 高亮问题

### 5. 提交前

```bash
# 运行所有质量检查
npm run lint
npm run typecheck
npm run test
npm run build
```

## 环境变量

### 开发

在 `.env.local` 中创建本地覆盖：

```env
# 使用本地 Kroki 测试
KROKI_BASE_URL=http://localhost:8000

# 调试日志
DEBUG=graph-viewer:*
```

### 测试

```env
# 测试专用 Kroki 实例
KROKI_BASE_URL=http://localhost:8001
```

## Git 工作流

### 分支命名

- `feat/description` - 新功能
- `fix/description` - Bug 修复
- `docs/description` - 文档
- `refactor/description` - 代码重构

### 提交信息

遵循约定式提交：

```
feat: 添加 PDF 导出支持
fix: 修复预览面板的内存泄漏
docs: 更新安装指南
refactor: 简化图表状态 hook
test: 添加导出工具的单元测试
```

## 调试

### 浏览器 DevTools

1. **React Developer Tools**: 检查组件树
2. **Network Tab**: 监控 `/api/render` 请求
3. **Performance Tab**: 分析渲染性能

### VS Code 调试

启动配置（`.vscode/launch.json`）：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: 调试全栈",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 服务端调试

```bash
# 调试 API 路由
NODE_OPTIONS='--inspect' npm run dev
```

然后连接 Chrome DevTools 到 `chrome://inspect`。

## 开发期间测试

### 单元测试

```bash
# 监听模式
npm run test:watch

# 单次运行并生成覆盖率报告
npm run test -- --coverage
```

### 集成测试

```bash
# 首先启动开发服务器
npm run dev

# 运行冒烟测试
npm run test:smoke
```

### 手动测试清单

- [ ] 所有图表引擎正确渲染
- [ ] 导出格式工作正常（SVG、PNG、HTML、Markdown）
- [ ] 分享链接正确恢复
- [ ] localStorage 持久化工作正常
- [ ] 不同屏幕尺寸的响应式布局

## 常见问题

### 热重载不工作

```bash
# 重启开发服务器
Ctrl+C && npm run dev
```

### 端口冲突

```bash
# 查找使用端口 3000 的进程
lsof -i :3000

# 终止进程或使用不同端口
npm run dev -- -p 3001
```

### TypeScript 错误

```bash
# 在 VS Code 中重启 TypeScript 服务
Cmd+Shift+P → "TypeScript: Restart TS Server"
```
