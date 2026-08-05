# 快速开始与安装

5 分钟内启动 GraphViewer。

## 环境要求

| 组件    | 最低版本 | 推荐版本   |
| ------- | -------- | ---------- |
| Node.js | 20.0.0   | 22.0.0 LTS |
| npm     | 10.0.0   | 11.6.0+    |
| Git     | 任意     | 最新版     |

验证环境：

```bash
node --version  # v20.0.0 或更高
npm --version   # 10.0.0 或更高
```

## 快速安装

```bash
# 克隆仓库
git clone https://github.com/LessUp/graph-viewer.git
cd graph-viewer

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

应用将在 `http://localhost:3000` 可用。

## 环境变量（可选）

创建 `.env.local` 文件：

```env
KROKI_BASE_URL=https://kroki.io
PORT=3000
```

## 生产构建

```bash
# 标准构建（含 API 路由）
npm run build
npm start

# 静态导出（用于 GitHub Pages）
npm run build:static
```

## Docker

```bash
# 生产环境 + 自建 Kroki
docker compose --profile prod --profile kroki up -d

# 开发环境
docker compose --profile dev up
```

## 第一步

1. **创建第一个图表** - 选择引擎，选择示例，点击"渲染预览"
2. **导出** - 选择 SVG、PNG (2x/4x)、HTML 或 Markdown 格式
3. **分享** - 生成压缩 URL 方便分享

## 下一步

- 了解[支持的图表引擎](../04-features/02-rendering.md)
- 探索[导出选项](../04-features/01-export.md)
- 阅读[架构概述](./03-architecture.md)
