# 自建 Kroki 集成

部署并集成您自己的 Kroki 渲染服务。

## 为什么自建 Kroki？

- **隐私**：图表数据永不离开您的基础设施
- **可靠性**：不依赖外部服务
- **离线**：无需互联网连接即可工作
- **性能**：本地网络延迟
- **定制**：控制可用的图表引擎

## 部署选项

### 选项 1：Docker Compose（推荐）

GraphViewer 在 `docker-compose.yml` 中包含 Kroki 服务：

```bash
# 启动配合自建 Kroki
docker compose --profile prod --profile kroki up -d

# 访问：
# - GraphViewer: http://localhost:3000
# - Kroki: http://localhost:8000
```

这将部署：

- Kroki 核心服务器
- BlockDiag 服务
- Mermaid 服务
- 所有其他图表引擎

### 选项 2：独立 Kroki

```bash
# 运行 Kroki 容器
docker run -d \
  --name kroki \
  -p 8000:8000 \
  yuzutech/kroki:latest

# 或配合所有服务（完整）
docker run -d \
  --name kroki \
  -p 8000:8000 \
  yuzutech/kroki:latest \
  --kroki-blockdiag-host=blockdiag \
  --kroki-mermaid-host=mermaid
  # ... 其他服务
```

### 选项 3：Kubernetes

参阅 [Kroki Kubernetes 部署指南](https://docs.kroki.io/kroki/setup/install/#kubernetes)。

## 与 GraphViewer 集成

### 服务端配置

设置环境变量：

```bash
# .env 或 docker-compose.yml
KROKI_BASE_URL=http://kroki:8000
```

对于 Docker Compose，服务内部通信：

```yaml
services:
  web:
    environment:
      - KROKI_BASE_URL=http://kroki:8000
    depends_on:
      - kroki

  kroki:
    image: yuzutech/kroki:latest
    # ...
```

### 客户端配置

用户可以在设置中指定自定义 Kroki：

1. 打开设置（齿轮图标）
2. 启用"自定义渲染服务器"
3. 输入 URL（例如 `https://kroki.company.com`）

服务端必须通过以下方式允许此 URL：

```bash
# 允许任意客户端 URL（仅开发）
KROKI_ALLOW_CLIENT_BASE_URL=true

# 或白名单特定 URL
KROKI_CLIENT_BASE_URL_ALLOWLIST=https://kroki.company.com,https://kroki.example.com
```

### 测试连接

```bash
# 测试 Kroki 健康
curl http://localhost:8000/health

# 测试图表渲染
curl -X POST http://localhost:8000/mermaid/svg \
  -d 'graph TD; A-->B;'
```

## 安全配置

### 访问控制

对于生产部署：

```yaml
# 带基本认证的 docker-compose.yml
services:
  kroki:
    image: yuzutech/kroki:latest
    environment:
      - KROKI_USERNAME=admin
      - KROKI_PASSWORD=secure-password
```

### 网络隔离

```yaml
# 只有 web 服务可以访问 Kroki
services:
  web:
    networks:
      - frontend
      - backend

  kroki:
    networks:
      - backend
    # 不暴露端口到主机

networks:
  frontend:
  backend:
    internal: true
```

### HTTPS/TLS

使用反向代理进行 HTTPS 终止：

```nginx
# nginx.conf
upstream kroki {
    server localhost:8000;
}

server {
    listen 443 ssl;
    server_name kroki.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://kroki;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 故障排除

### 连接被拒绝

```bash
# 验证 Kroki 正在运行
docker ps | grep kroki

# 检查日志
docker logs kroki

# 从 GraphViewer 测试连接
docker exec graph-viewer curl http://kroki:8000/health
```

### URL 不允许

错误：`KROKI_BASE_URL_NOT_ALLOWED`

解决方案：

1. 添加 URL 到 `KROKI_CLIENT_BASE_URL_ALLOWLIST`
2. 设置 `KROKI_ALLOW_CLIENT_BASE_URL=true`（开发）
3. 改用服务端 `KROKI_BASE_URL`

### CORS 错误

对于 GitHub Pages 或外部访问：

```yaml
services:
  kroki:
    image: yuzutech/kroki:latest
    environment:
      - KROKI_CORS_ORIGIN=*
      # 或特定来源：
      # - KROKI_CORS_ORIGIN=https://diagrams.example.com
```

## 性能调优

### 资源分配

```yaml
services:
  kroki:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 1G
```

### 缓存

GraphViewer 包含 `/api/render` 的内存缓存：

```typescript
// route.ts 中的缓存配置
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 小时
const CACHE_SIZE_LIMIT = 1000; // 最大条目数
```

对于生产规模，考虑：

- Redis 缓存
- CDN 缓存
- HTTP 缓存头

## 可用图表引擎

完整 Kroki 支持 20+ 引擎：

| 引擎      | 本地    | 远程 | 说明           |
| --------- | ------- | ---- | -------------- |
| Mermaid   | ✅      | ✅   | 本地使用浏览器 |
| Graphviz  | ✅ WASM | ✅   |                |
| PlantUML  | ❌      | ✅   | 需要 Java      |
| D2        | ❌      | ✅   |                |
| BlockDiag | ❌      | ✅   | Python         |
| SeqDiag   | ❌      | ✅   |                |
| Nomnoml   | ❌      | ✅   |                |
| Vega      | ❌      | ✅   |                |
| Vega-Lite | ❌      | ✅   |                |
| WaveDrom  | ❌      | ✅   |                |
| ...       |         |      |                |

## 维护

### 更新

```bash
# 更新 Kroki 镜像
docker pull yuzutech/kroki:latest
docker compose --profile kroki up -d

# 检查版本
curl http://localhost:8000/health | jq .version
```

### 监控

```bash
# 健康检查端点
curl http://localhost:8000/health

# Prometheus 指标（如启用）
curl http://localhost:8000/metrics
```

### 备份

Kroki 是无状态的 - 不需要备份。配置在 compose 文件中。
