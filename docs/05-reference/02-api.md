# API 文档

GraphViewer API 端点的完整参考。

## 基础 URL

| 环境 | 基础 URL                |
| ---- | ----------------------- |
| 开发 | `http://localhost:3000` |
| 生产 | 您的部署 URL            |

## 端点

### GET /api/healthz

健康检查端点。

**响应：**

```json
{
  "status": "ok",
  "timestamp": "2026-04-16T10:36:25.457Z",
  "version": "1.0.0"
}
```

**状态码：**

| 代码 | 说明     |
| ---- | -------- |
| 200  | 服务健康 |

---

### POST /api/render

使用 Kroki 渲染图表。

**请求：**

```typescript
{
  engine: string;       // 图表引擎（mermaid、plantuml 等）
  format: string;       // 输出格式（svg、png、pdf）
  code: string;         // 图表源代码
  binary?: boolean;     // 返回二进制而非 JSON
  krokiBaseUrl?: string; // 可选：自定义 Kroki URL
}
```

**请求头：**

```
Content-Type: application/json
X-GraphViewer-Version: 1.0.0
```

**示例请求：**

```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "engine": "mermaid",
    "format": "svg",
    "code": "graph TD; A-->B;"
  }'
```

**成功响应（SVG）：**

```json
{
  "result": "<svg>...</svg>",
  "engine": "mermaid",
  "format": "svg",
  "cached": false
}
```

**成功响应（PNG/PDF 二进制）：**

二进制数据配合适当的 Content-Type 头。

**错误响应：**

| 状态 | 错误代码                     | 说明                  |
| ---- | ---------------------------- | --------------------- |
| 400  | `INVALID_ENGINE`             | 不支持的引擎          |
| 400  | `INVALID_FORMAT`             | 不支持的格式          |
| 400  | `INVALID_KROKI_BASE_URL`     | 格式错误的 Kroki URL  |
| 400  | `KROKI_BASE_URL_NOT_ALLOWED` | URL 不在白名单中      |
| 413  | `PAYLOAD_TOO_LARGE`          | 代码超过 100,000 字符 |
| 502  | `KROKI_ERROR`                | Kroki 返回错误        |
| 504  | `KROKI_TIMEOUT`              | 请求超时              |

**错误响应格式：**

```json
{
  "error": "KROKI_ERROR",
  "message": "图表渲染失败",
  "details": "图的语法错误",
  "krokiUrl": "https://kroki.io"
}
```

**缓存：**

成功响应包含缓存指示器：

```
X-Cache: HIT    // 来自缓存
X-Cache: MISS   // 新渲染
```

---

### 客户端渲染（非 API）

本地渲染绕过 API：

#### Mermaid（浏览器）

```typescript
import mermaid from 'mermaid';

mermaid.initialize({
  securityLevel: 'strict',
  startOnLoad: false,
});

const { svg } = await mermaid.render('id', code);
```

#### Graphviz WASM（浏览器）

```typescript
import { Graphviz } from '@hpcc-js/wasm';

const graphviz = await Graphviz.load();
const svg = graphviz.dot(code);
```

## 引擎支持参考

### 支持的引擎

| 引擎       | Kroki 类型 | 本地支持  |
| ---------- | ---------- | --------- |
| mermaid    | mermaid    | ✅ 浏览器 |
| plantuml   | plantuml   | ❌        |
| graphviz   | graphviz   | ✅ WASM   |
| d2         | d2         | ❌        |
| nomnoml    | nomnoml    | ❌        |
| blockdiag  | blockdiag  | ❌        |
| seqdiag    | seqdiag    | ❌        |
| actdiag    | actdiag    | ❌        |
| nwdiag     | nwdiag     | ❌        |
| packetdiag | packetdiag | ❌        |
| rackdiag   | rackdiag   | ❌        |
| c4plantuml | c4plantuml | ❌        |
| ditaa      | ditaa      | ❌        |
| erd        | erd        | ❌        |
| excalidraw | excalidraw | ❌        |
| pikchr     | pikchr     | ❌        |
| svgbob     | svgbob     | ❌        |
| symbolator | symbolator | ❌        |
| umlet      | umlet      | ❌        |
| vega       | vega       | ❌        |
| vegalite   | vegalite   | ❌        |
| wavedrom   | wavedrom   | ❌        |

### 支持的格式

| 格式 | MIME 类型       | 说明       |
| ---- | --------------- | ---------- |
| svg  | image/svg+xml   | 可缩放矢量 |
| png  | image/png       | 位图       |
| pdf  | application/pdf | 文档       |

**注意：** 并非所有引擎支持所有格式。检查 Kroki 文档了解兼容性。

## 速率限制

当前实现无显式速率限制。对于生产环境：

1. 使用反向代理（nginx）进行速率限制
2. 在中间件中实现请求节流
3. 添加 API 密钥认证

## 示例

### 渲染 Mermaid 流程图

```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "engine": "mermaid",
    "format": "svg",
    "code": "graph TD\n  A[开始] --> B{决策}\n  B -->|是| C[动作 1]\n  B -->|否| D[动作 2]"
  }'
```

### 渲染 PlantUML 类图

```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "engine": "plantuml",
    "format": "png",
    "code": "@startuml\nclass User\nclass Order\nUser \"1\" --> \"*\" Order : places\n@enduml"
  }' \
  --output diagram.png
```

### 使用自定义 Kroki 实例

```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "engine": "mermaid",
    "format": "svg",
    "code": "graph TD; A-->B;",
    "krokiBaseUrl": "https://internal-kroki.company.com"
  }'
```

## SDK / 客户端库

无官方 SDK 提供。使用标准 HTTP 客户端：

### JavaScript/TypeScript

```typescript
async function renderDiagram(engine: string, format: string, code: string): Promise<string> {
  const response = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine, format, code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  return data.result;
}
```

### Python

```python
import requests

def render_diagram(engine: str, format: str, code: str) -> str:
    response = requests.post(
        "http://localhost:3000/api/render",
        json={"engine": engine, "format": format, "code": code}
    )
    response.raise_for_status()
    return response.json()["result"]
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type RenderRequest struct {
    Engine string `json:"engine"`
    Format string `json:"format"`
    Code   string `json:"code"`
}

func renderDiagram(engine, format, code string) (string, error) {
    req := RenderRequest{Engine: engine, Format: format, Code: code}
    body, _ := json.Marshal(req)

    resp, err := http.Post(
        "http://localhost:3000/api/render",
        "application/json",
        bytes.NewBuffer(body),
    )
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result["result"].(string), nil
}
```
