# Docker 部署

使用 Docker 和 Docker Compose 部署 GraphViewer。

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/LessUp/graph-viewer.git
cd graph-viewer

# 生产环境部署配合自建 Kroki
docker compose --profile prod --profile kroki up -d

# 访问 http://localhost:3000
```

## Docker Compose 配置文件

GraphViewer 为不同用例提供多个 compose 配置：

| 配置文件   | 描述            | 用途          |
| ---------- | --------------- | ------------- |
| `dev`      | 热重载开发      | 本地开发      |
| `prod`     | 生产构建        | 生产部署      |
| `web-test` | 测试环境        | 测试/CI       |
| `kroki`    | 自建 Kroki 服务 | 离线/受限环境 |

### 开发环境

```bash
docker compose --profile dev up
```

特性：

- 热重载启用
- 源代码作为卷挂载
- 端口: 3000
- Node.js 调试端口: 9229

### 生产环境

```bash
# 独立部署
docker compose --profile prod up -d

# 配合自建 Kroki
docker compose --profile prod --profile kroki up -d
```

特性：

- 优化的生产构建
- 独立 Next.js 服务器
- 无卷挂载

### 测试环境

```bash
docker compose --profile web-test up -d
```

使用端口 3001 避免与开发服务器冲突。

## 配置

### 环境变量

创建 `.env` 文件用于部署配置：

```env
# Kroki 配置
KROKI_BASE_URL=http://kroki:8000

# 服务器配置
PORT=3000

# 可选：允许客户端配置 Kroki
KROKI_ALLOW_CLIENT_BASE_URL=false
KROKI_CLIENT_BASE_URL_ALLOWLIST=https://kroki.example.com
```

### 自建 Kroki

使用 `kroki` 配置文件时：

```yaml
services:
  kroki:
    image: yuzutech/kroki:latest
    ports:
      - '8000:8000'
    environment:
      - KROKI_BLOCKDIAG_HOST=blockdiag
      - KROKI_MERMAID_HOST=mermaid
    # ... 其他 Kroki 服务
```

优点：

- 离线工作
- 无外部依赖
- 跨环境一致的渲染

## 独立 Docker

### 构建镜像

```bash
docker build -t graph-viewer:latest .
```

### 运行容器

```bash
docker run -d \
  --name graph-viewer \
  -p 3000:3000 \
  -e KROKI_BASE_URL=https://kroki.io \
  graph-viewer:latest
```

### 配合自建 Kroki

```bash
# 运行 Kroki
docker run -d --name kroki -p 8000:8000 yuzutech/kroki

# 运行 GraphViewer 配合 Kroki
docker run -d \
  --name graph-viewer \
  -p 3000:3000 \
  -e KROKI_BASE_URL=http://host.docker.internal:8000 \
  graph-viewer:latest
```

## 健康检查

每个服务都包含健康检查：

```bash
# 检查 web 服务
curl http://localhost:3000/api/healthz

# 检查 Kroki
curl http://localhost:8000/health
```

## 生产考虑

### 反向代理（Nginx）

```nginx
server {
    listen 80;
    server_name diagrams.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### HTTPS/TLS

使用反向代理或云负载均衡器进行 HTTPS 终止。

### 资源限制

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 日志管理

```bash
# 查看日志
docker compose logs -f web

# 轮转日志
docker logs --since 24h graph-viewer 2>&1 | gzip > logs-$(date +%Y%m%d).gz
```

## 故障排除

### 容器无法启动

```bash
# 检查日志
docker compose logs web

# 验证环境变量
docker compose config
```

### Kroki 连接失败

```bash
# 测试 Kroki 连接
docker exec graph-viewer curl http://kroki:8000/health

# 检查网络
docker network ls
docker network inspect graph-viewer_default
```

### 端口冲突

```bash
# 检查端口使用
lsof -i :3000

# 使用不同主机端口
docker compose -p 3001:3000 --profile prod up -d
```

## 更新

```bash
# 拉取最新镜像
docker compose pull

# 重建容器
docker compose --profile prod up -d --force-recreate

# 清理旧镜像
docker image prune -f
```
