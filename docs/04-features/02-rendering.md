# 渲染引擎

GraphViewer 通过混合渲染支持 16+ 图表引擎。

## 引擎分类

### 热门引擎

| 引擎           | 类型       | 本地    | 远程 |
| -------------- | ---------- | ------- | ---- |
| Mermaid        | 文本转图表 | ✅      | ✅   |
| PlantUML       | UML 图表   | ❌      | ✅   |
| Graphviz (DOT) | 图可视化   | ✅ WASM | ✅   |
| D2             | 声明式绘图 | ❌      | ✅   |

### 流程图系列

| 引擎         | 最适合     |
| ------------ | ---------- |
| Flowchart.js | 简单流程图 |
| BlockDiag    | 框图       |
| ActDiag      | 活动图     |

### 时序与网络

| 引擎    | 最适合 |
| ------- | ------ |
| SeqDiag | 时序图 |
| NwDiag  | 网络图 |

### 数据可视化

| 引擎      | 最适合     |
| --------- | ---------- |
| Vega      | 复杂可视化 |
| Vega-Lite | 统计图表   |
| WaveDrom  | 数字时序图 |

### ASCII 艺术

| 引擎    | 最适合        |
| ------- | ------------- |
| Ditaa   | ASCII 转图表  |
| SVGBob  | ASCII 艺术    |
| Nomnoml | 快速 UML 草图 |

### 其他

| 引擎 | 最适合   |
| ---- | -------- |
| ERD  | 实体关系 |

## 渲染模式

### 本地渲染

直接在浏览器中运行：

```typescript
// Mermaid
import mermaid from 'mermaid';
mermaid.initialize({ securityLevel: 'strict' });

// Graphviz WASM
import { Graphviz } from '@hpcc-js/wasm';
const graphviz = await Graphviz.load();
```

**优点：**

- 快速 - 无网络延迟
- 私密 - 数据保留在浏览器中
- 离线工作
- 始终可用

**限制：**

- 仅限 Mermaid 和 Graphviz
- WASM 包大小（~2MB）
- 浏览器内存限制

### 远程渲染

通过 `/api/render` 代理到 Kroki：

```typescript
// POST /api/render
const response = await fetch('/api/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    engine: 'plantuml',
    format: 'svg',
    code: diagramCode,
  }),
});
```

**优点：**

- 支持所有 16+ 引擎
- 一致的服务端渲染
- 无浏览器限制

**要求：**

- 网络连接
- Kroki 服务（公共或自建）
- 服务器提供 API 路由（非静态导出）

### 混合决策

GraphViewer 自动选择：

```
能否本地渲染？
  ├── 是（Mermaid/Graphviz SVG）
  │   └── 尝试本地
  │       ├── 成功 → 显示
  │       └── 错误 → 回退到远程
  └── 否
      └── 通过 Kroki 远程渲染
```

## 引擎选择

### 按使用场景

#### 软件架构

- **Mermaid**: 通用图表，GitHub 原生支持
- **PlantUML**: 全面的 UML
- **Graphviz**: 复杂图、布局

#### 文档

- **Mermaid**: Markdown 兼容
- **D2**: 现代、可读语法
- **Nomnoml**: 快速 UML 草图

#### 系统设计

- **PlantUML**: 组件图
- **BlockDiag**: 高层框图
- **NwDiag**: 网络拓扑

#### 数据与分析

- **Vega/Vega-Lite**: 数据驱动图表
- **Graphviz**: 关系图
- **WaveDrom**: 时序图

### 格式选择

| 格式 | 最适合 | 说明           |
| ---- | ------ | -------------- |
| SVG  | 通用   | 可编辑、可缩放 |
| PNG  | 分享   | 位图、固定大小 |
| PDF  | 打印   | 文档嵌入       |

## 引擎配置

### 每个引擎支持的格式

| 引擎     | SVG | PNG | PDF |
| -------- | --- | --- | --- |
| Mermaid  | ✅  | ✅  | ✅  |
| PlantUML | ✅  | ✅  | ✅  |
| Graphviz | ✅  | ✅  | ✅  |
| D2       | ✅  | ❌  | ❌  |
| Vega     | ✅  | ✅  | ✅  |
| ...      |     |     |     |

### 语法高亮

CodeMirror 基于引擎提供语法高亮：

```typescript
// lib/syntaxHighlight.ts
const languageMap: Record<string, string> = {
  mermaid: 'markdown',
  plantuml: 'markdown',
  graphviz: 'javascript', // DOT 使用 JS
  javascript: 'javascript',
  // ...
};
```

## 性能考虑

### 本地渲染

| 因素     | 影响                    |
| -------- | ----------------------- |
| 图表大小 | 大图解析时间更长        |
| 复杂度   | 嵌套结构增加渲染时间    |
| 浏览器   | Chrome/Firefox 通常更快 |

### 远程渲染

| 因素       | 影响             |
| ---------- | ---------------- |
| 网络延迟   | 影响响应时间     |
| Kroki 负载 | 共享实例可能排队 |
| 图表类型   | 一些引擎比其他慢 |
| 缓存       | 重复渲染瞬间完成 |

### 优化建议

1. **尽可能使用本地引擎**
2. **使用 SVG** 格式获得最佳质量
3. **启用缓存** 用于远程渲染
4. **防抖输入**（300ms）减少渲染

## 故障排除

### 本地渲染问题

**Mermaid 解析错误：**

- 检查语法有效性
- 尝试 Mermaid Live Editor 调试
- 更新 mermaid 库

**Graphviz WASM 未加载：**

- 检查 WASM 文件的网络请求
- 验证 CDN 或本地路径配置
- 检查浏览器控制台错误

### 远程渲染问题

**超时（504）：**

- 图表太复杂
- Kroki 服务过载
- 网络问题

**解析错误（400）：**

- 无效图表语法
- 不支持的引擎/格式组合

**连接被拒绝：**

- Kroki 服务未运行
- 错误的 KROKI_BASE_URL
- 防火墙阻止

## 添加新引擎

要添加对新引擎的支持：

1. **在 `lib/diagramConfig.ts` 中注册引擎**：

   ```typescript
   export const ENGINE_LIST = [
     // ... 现有引擎
     'newengine',
   ] as const;
   ```

2. **添加标签**：

   ```typescript
   export const ENGINE_LABELS: Record<string, string> = {
     newengine: '新引擎',
   };
   ```

3. **在 `lib/diagramSamples.ts` 中添加示例代码**：

   ```typescript
   newengine: `图表代码`;
   ```

4. **配置 Kroki 映射**（如果是远程）：

   ```typescript
   export const KROKI_TYPES: Record<string, string> = {
     newengine: 'newengine',
   };
   ```

5. **在 `lib/syntaxHighlight.ts` 中添加语法高亮**

6. **在相关测试文件中更新测试**
